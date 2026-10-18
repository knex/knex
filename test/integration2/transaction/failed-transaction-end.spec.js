const { expect } = require('chai');
const pg = require('pg');
const knex = require('../../../lib');
const {
  getAllDbs,
  getKnexForDb,
  testConfigs,
} = require('../util/knex-instance-provider');
const { isPostgreSQL } = require('../../util/db-helpers');

describe('Transaction', () => {
  describe('failed ROLLBACK or COMMIT (#6546)', () => {
    getAllDbs().forEach((dialect) => {
      describe(dialect, () => {
        before(function () {
          const probe = getKnexForDb(dialect);
          const postgres = isPostgreSQL(probe);
          return probe.destroy().then(() => {
            if (!postgres) this.skip();
          });
        });

        async function pidsAndCodes(db, table) {
          const pid = (await db.raw('select pg_backend_pid() as pid')).rows[0]
            .pid;
          const codes = (await db(table).select('code').orderBy('code')).map(
            (row) => row.code
          );
          return { pid, codes };
        }

        function failRollbackOnce() {
          const original = pg.Client.prototype.query;
          pg.Client.prototype.query = function (config, ...rest) {
            const text =
              typeof config === 'string' ? config : config && config.text;
            if (
              typeof text === 'string' &&
              /^ROLLBACK\b/i.test(text) &&
              !/^ROLLBACK\s+TO\b/i.test(text)
            ) {
              pg.Client.prototype.query = original;
              const err = new Error('ROLLBACK failed before send');
              const callback = rest.find((arg) => typeof arg === 'function');
              if (callback) {
                process.nextTick(() => callback(err));
                return undefined;
              }
              return Promise.reject(err);
            }
            return original.apply(this, [config, ...rest]);
          };
          return () => {
            pg.Client.prototype.query = original;
          };
        }

        it('does not reuse a connection whose ROLLBACK was never sent', async function () {
          this.timeout(10000);
          const db = getKnexForDb(dialect, { pool: { min: 0, max: 1 } });
          const restore = failRollbackOnce();
          try {
            await db.schema.dropTableIfExists('failed_tx_end');
            await db.schema.createTable('failed_tx_end', (table) => {
              table.text('code').primary();
            });
            const trx = await db.transaction();
            const first = (await trx.raw('select pg_backend_pid() as pid'))
              .rows[0].pid;
            await trx('failed_tx_end').insert({ code: 'doomed' });
            await trx.rollback().catch(() => {});
            const next = await db.transaction();
            const second = (await next.raw('select pg_backend_pid() as pid'))
              .rows[0].pid;
            await next('failed_tx_end').insert({ code: 'next' });
            await next.commit();
            const codes = (
              await db('failed_tx_end').select('code').orderBy('code')
            ).map((row) => row.code);
            expect(second).to.not.equal(first);
            expect(codes).to.deep.equal(['next']);
          } finally {
            restore();
            await db.schema.dropTableIfExists('failed_tx_end');
            await db.destroy();
          }
        });

        it('does not reuse a connection after query_timeout drops ROLLBACK', async function () {
          this.timeout(20000);
          const db = getKnexForDb(dialect, {
            connection: { query_timeout: 1000 },
            pool: { min: 0, max: 2 },
          });
          try {
            await db.schema.dropTableIfExists('failed_tx_end');
            await db.schema.createTable('failed_tx_end', (table) => {
              table.text('code').primary();
            });
            let first;
            await db
              .transaction(async (trx) => {
                first = (await trx.raw('select pg_backend_pid() as pid'))
                  .rows[0].pid;
                await trx('failed_tx_end').insert({ code: 'doomed' });
                await trx.raw('select pg_sleep(3)');
              })
              .catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, 1500));
            let second;
            await db.transaction(async (trx) => {
              second = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
                .pid;
              await trx('failed_tx_end').insert({ code: 'next' });
            });
            const { codes } = await pidsAndCodes(db, 'failed_tx_end');
            expect(second).to.not.equal(first);
            expect(codes).to.deep.equal(['next']);
          } finally {
            await db.schema.dropTableIfExists('failed_tx_end');
            await db.destroy();
          }
        });

        it('does not reuse a connection after query_timeout drops COMMIT', async function () {
          this.timeout(20000);
          const db = getKnexForDb(dialect, {
            connection: { query_timeout: 1000 },
            pool: { min: 0, max: 2 },
          });
          try {
            await db.schema.dropTableIfExists('failed_tx_end');
            await db.schema.createTable('failed_tx_end', (table) => {
              table.text('code').primary();
            });
            let first;
            await db
              .transaction(async (trx) => {
                first = (await trx.raw('select pg_backend_pid() as pid'))
                  .rows[0].pid;
                await trx('failed_tx_end').insert({ code: 'doomed' });
                await trx.raw('select pg_sleep(3)').catch(() => {});
              })
              .catch(() => {});
            await new Promise((resolve) => setTimeout(resolve, 1500));
            let second;
            await db.transaction(async (trx) => {
              second = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
                .pid;
              await trx('failed_tx_end').insert({ code: 'next' });
            });
            const { codes } = await pidsAndCodes(db, 'failed_tx_end');
            expect(second).to.not.equal(first);
            expect(codes).to.deep.equal(['next']);
          } finally {
            await db.schema.dropTableIfExists('failed_tx_end');
            await db.destroy();
          }
        });

        it('keeps a connection after a deferred constraint error at COMMIT', async function () {
          this.timeout(20000);
          const db = getKnexForDb(dialect, { pool: { min: 0, max: 1 } });
          try {
            await db.raw('drop table if exists failed_tx_end_child');
            await db.raw('drop table if exists failed_tx_end_parent');
            await db.raw(`
              create table failed_tx_end_parent (id int primary key);
              create table failed_tx_end_child (
                id int primary key,
                parent_id int references failed_tx_end_parent (id)
                  deferrable initially deferred
              )
            `);
            const pids = [];
            for (let i = 0; i < 8; i++) {
              const trx = await db.transaction();
              pids.push(
                (await trx.raw('select pg_backend_pid() as pid')).rows[0].pid
              );
              await trx.raw(
                'insert into failed_tx_end_child (id, parent_id) values (?, 1)',
                [i + 1]
              );
              await trx.commit();
              await trx.executionPromise.catch(() => {});
            }
            const rows = await db('failed_tx_end_child').select('id');
            expect(rows).to.deep.equal([]);
            expect(new Set(pids).size).to.be.below(8);
          } finally {
            await db.raw('drop table if exists failed_tx_end_child');
            await db.raw('drop table if exists failed_tx_end_parent');
            await db.destroy();
          }
        });

        function stubTransactionStatus(fake) {
          const original = pg.Client.prototype.getTransactionStatus;
          pg.Client.prototype.getTransactionStatus = fake;
          return () => {
            pg.Client.prototype.getTransactionStatus = original;
          };
        }

        function settleWithin(promise, ms) {
          let timer;
          const deadline = new Promise((resolve, reject) => {
            timer = setTimeout(
              () => reject(new Error(`did not settle within ${ms} ms`)),
              ms
            );
          });
          return Promise.race([promise, deadline]).finally(() =>
            clearTimeout(timer)
          );
        }

        async function dropStatusTables(db) {
          await db.raw('drop table if exists failed_tx_end_status_child');
          await db.raw('drop table if exists failed_tx_end_status_parent');
        }

        async function createStatusTables(db) {
          await dropStatusTables(db);
          await db.raw(`
            create table failed_tx_end_status_parent (id int primary key);
            create table failed_tx_end_status_child (
              id int primary key,
              parent_id int references failed_tx_end_status_parent (id)
                deferrable initially deferred
            )
          `);
        }

        // COMMIT fails on the deferred foreign key. Then a new transaction
        // inserts the parent and the child, and must commit.
        async function failCommitThenCommit(db, id) {
          let first;
          const error = await settleWithin(
            db
              .transaction(async (trx) => {
                first = (await trx.raw('select pg_backend_pid() as pid'))
                  .rows[0].pid;
                await trx.raw(
                  'insert into failed_tx_end_status_child (id, parent_id) values (?, ?)',
                  [id, id]
                );
              })
              .then(
                () => null,
                (err) => err
              ),
            5000
          );
          let second;
          await db.transaction(async (trx) => {
            second = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
              .pid;
            await trx.raw(
              'insert into failed_tx_end_status_parent (id) values (?)',
              [id]
            );
            await trx.raw(
              'insert into failed_tx_end_status_child (id, parent_id) values (?, ?)',
              [id, id]
            );
          });
          return { error, first, second };
        }

        // pg 8.21+ gives the native client a getTransactionStatus() that calls
        // pg-native's binding, which has it only from pg-native 3.8.0.
        it('reports the COMMIT error and discards the connection when the status accessor throws', async function () {
          this.timeout(10000);
          const db = getKnexForDb(dialect, { pool: { min: 0, max: 1 } });
          const restore = stubTransactionStatus(() => {
            throw new TypeError(
              'this.native.getTransactionStatus is not a function'
            );
          });
          try {
            await createStatusTables(db);
            const { error, first, second } = await failCommitThenCommit(db, 1);
            expect(error).to.not.be.an.instanceOf(TypeError);
            expect(error.code).to.equal('23503');
            expect(second).to.not.equal(first);
            const rows = await db('failed_tx_end_status_child').select('id');
            expect(rows).to.deep.equal([{ id: 1 }]);
          } finally {
            restore();
            await dropStatusTables(db);
            await db.destroy();
          }
        });

        it('discards the connection when the status accessor returns an unexpected value', async function () {
          this.timeout(10000);
          const db = getKnexForDb(dialect, { pool: { min: 0, max: 1 } });
          const values = [undefined, null, 'X', 0];
          let current;
          const restore = stubTransactionStatus(() => current);
          try {
            await createStatusTables(db);
            for (const [index, value] of values.entries()) {
              current = value;
              const { error, first, second } = await failCommitThenCommit(
                db,
                index + 1
              );
              expect(error.code, String(value)).to.equal('23503');
              expect(second, String(value)).to.not.equal(first);
            }
            const rows = await db('failed_tx_end_status_child')
              .select('id')
              .orderBy('id');
            expect(rows.map((row) => row.id)).to.deep.equal([1, 2, 3, 4]);
          } finally {
            restore();
            await dropStatusTables(db);
            await db.destroy();
          }
        });

        it('keeps the connection when a nested transaction rolls back', async function () {
          this.timeout(10000);
          const db = getKnexForDb(dialect, { pool: { min: 0, max: 1 } });
          try {
            await db.schema.dropTableIfExists('failed_tx_end_nested');
            await db.schema.createTable('failed_tx_end_nested', (table) => {
              table.text('code').primary();
            });
            let first;
            let during;
            await db.transaction(async (trx) => {
              first = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
                .pid;
              await trx('failed_tx_end_nested').insert({ code: 'outer' });
              await trx
                .transaction(async (inner) => {
                  await inner('failed_tx_end_nested').insert({ code: 'inner' });
                  throw new Error('nested');
                })
                .catch(() => {});
              during = (await trx.raw('select pg_backend_pid() as pid')).rows[0]
                .pid;
            });
            const codes = (
              await db('failed_tx_end_nested').select('code').orderBy('code')
            ).map((row) => row.code);
            expect(during).to.equal(first);
            expect(codes).to.deep.equal(['outer']);
          } finally {
            await db.schema.dropTableIfExists('failed_tx_end_nested');
            await db.destroy();
          }
        });

        it('discards a native-pool connection whose ROLLBACK was never sent', async function () {
          this.timeout(10000);
          const nativePool = new pg.Pool({
            ...testConfigs.postgres.connection,
            max: 1,
          });
          const db = knex({ client: 'pg', connectionPool: nativePool });
          const restore = failRollbackOnce();
          try {
            await db.schema.dropTableIfExists('failed_tx_end_pool');
            await db.schema.createTable('failed_tx_end_pool', (table) => {
              table.text('code').primary();
            });
            const trx = await db.transaction();
            const first = (await trx.raw('select pg_backend_pid() as pid'))
              .rows[0].pid;
            await trx('failed_tx_end_pool').insert({ code: 'doomed' });
            await trx.rollback().catch(() => {});
            const next = await db.transaction();
            const second = (await next.raw('select pg_backend_pid() as pid'))
              .rows[0].pid;
            await next('failed_tx_end_pool').insert({ code: 'next' });
            await next.commit();
            const codes = (
              await db('failed_tx_end_pool').select('code').orderBy('code')
            ).map((row) => row.code);
            expect(second).to.not.equal(first);
            expect(codes).to.deep.equal(['next']);
          } finally {
            restore();
            await db.schema.dropTableIfExists('failed_tx_end_pool');
            await db.destroy();
            await nativePool.end();
          }
        });
      });
    });
  });
});

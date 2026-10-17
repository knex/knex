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
          const pid = (
            await db.raw('select pg_backend_pid() as pid')
          ).rows[0].pid;
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
            const first = (
              await trx.raw('select pg_backend_pid() as pid')
            ).rows[0].pid;
            await trx('failed_tx_end').insert({ code: 'doomed' });
            await trx.rollback().catch(() => {});
            const next = await db.transaction();
            const second = (
              await next.raw('select pg_backend_pid() as pid')
            ).rows[0].pid;
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
              second = (await trx.raw('select pg_backend_pid() as pid'))
                .rows[0].pid;
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
              second = (await trx.raw('select pg_backend_pid() as pid'))
                .rows[0].pid;
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
            const first = (
              await trx.raw('select pg_backend_pid() as pid')
            ).rows[0].pid;
            await trx('failed_tx_end_pool').insert({ code: 'doomed' });
            await trx.rollback().catch(() => {});
            const next = await db.transaction();
            const second = (
              await next.raw('select pg_backend_pid() as pid')
            ).rows[0].pid;
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

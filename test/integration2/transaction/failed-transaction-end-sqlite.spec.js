const fs = require('fs');
const os = require('os');
const path = require('path');
const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

// SQLite keeps knex 3.3.0's behavior when a transaction's ending is uncertain
// (#6546): the connection is not discarded, because discarding a `:memory:`
// connection destroys its database.
describe('Transaction', () => {
  describe('failed ROLLBACK or COMMIT on SQLite (#6546)', () => {
    getAllDbs().forEach((dialect) => {
      describe(dialect, () => {
        // These cases need the asynchronous sqlite3 driver: a second
        // connection and a busy timeout. better-sqlite3 uses the same
        // transaction class, so it gets the same behavior.
        before(function () {
          if (dialect !== 'sqlite3') this.skip();
        });

        let dir;
        beforeEach(() => {
          dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knex-6546-'));
        });
        afterEach(() => {
          fs.rmSync(dir, { recursive: true, force: true });
        });

        function memoryDb() {
          return getKnexForDb(dialect, { connection: ':memory:' });
        }

        function fileDb(filename) {
          return getKnexForDb(dialect, { connection: { filename } });
        }

        // The pool has one connection; later checkouts are compared with it.
        async function onlyConnection(db) {
          const conn = await db.client.acquireConnection();
          db.client.releaseConnection(conn);
          return conn;
        }

        function run(conn, sql) {
          return new Promise((resolve, reject) =>
            conn.run(sql, (err) => (err ? reject(err) : resolve()))
          );
        }

        // A second connection takes the write lock on `filename` and keeps it
        // until the returned function is called.
        async function holdWriteLock(db, filename) {
          const holder = await new Promise((resolve, reject) => {
            const conn = new db.client.driver.Database(filename, (err) =>
              err ? reject(err) : resolve(conn)
            );
          });
          await run(holder, 'BEGIN IMMEDIATE');
          return async () => {
            await run(holder, 'ROLLBACK');
            await new Promise((resolve, reject) =>
              holder.close((err) => (err ? reject(err) : resolve()))
            );
          };
        }

        // Resolves once `conn` has run the ROLLBACK that knex queued on it.
        function rollbackFinished(conn) {
          const all = conn.all;
          return new Promise((resolve) => {
            conn.all = function (sql, bindings, callback) {
              if (!/^ROLLBACK\b/i.test(sql)) {
                return all.call(this, sql, bindings, callback);
              }
              conn.all = all;
              return all.call(this, sql, bindings, function (...args) {
                resolve();
                return callback.apply(this, args);
              });
            };
          });
        }

        async function codes(db, table) {
          return (await db(table).select('code').orderBy('code')).map(
            (row) => row.code
          );
        }

        it('keeps the in-memory database when COMMIT fails on a deferred foreign key', async function () {
          const db = memoryDb();
          try {
            const first = await onlyConnection(db);
            await db.raw('create table parent (id integer primary key)');
            await db.raw(`
              create table child (
                id integer primary key,
                parent_id integer references parent (id)
                  deferrable initially deferred
              )
            `);
            await db.raw('insert into parent (id) values (1)');
            const error = await db
              .transaction(async (trx) => {
                await trx.raw(
                  'insert into child (id, parent_id) values (1, 2)'
                );
              })
              .then(
                () => null,
                (err) => err
              );
            expect(error.code).to.equal('SQLITE_CONSTRAINT');
            expect(await onlyConnection(db)).to.equal(first);
            const tables = await db('sqlite_master')
              .where({ type: 'table' })
              .whereIn('name', ['child', 'parent'])
              .orderBy('name')
              .pluck('name');
            expect(tables).to.deep.equal(['child', 'parent']);
            expect(await db('parent').pluck('id')).to.deep.equal([1]);
          } finally {
            await db.destroy();
          }
        });

        it('keeps the in-memory database when a trigger rolls the transaction back', async function () {
          const db = memoryDb();
          try {
            await db.raw('create table guarded (code text primary key)');
            await db.raw(`
              create trigger guard before insert on guarded
              when new.code = 'boom'
              begin select raise(rollback, 'blocked'); end
            `);
            await db('guarded').insert({ code: 'kept' });
            // SQLite ends the transaction itself, so knex's ROLLBACK fails.
            const error = await db
              .transaction(async (trx) => {
                await trx('guarded').insert({ code: 'doomed' });
                await trx('guarded').insert({ code: 'boom' });
              })
              .then(
                () => null,
                (err) => err
              );
            expect(error).to.be.an('error');
            await db.transaction(async (trx) => {
              await trx('guarded').insert({ code: 'next' });
            });
            expect(await codes(db, 'guarded')).to.deep.equal(['kept', 'next']);
          } finally {
            await db.destroy();
          }
        });

        it('reuses a file connection whose ROLLBACK outlasts the rollback timer', async function () {
          this.timeout(30000);
          const filename = path.join(dir, 'slow-rollback.sqlite3');
          const db = fileDb(filename);
          let release;
          try {
            const first = await onlyConnection(db);
            first.configure('busyTimeout', 30000);
            await db.raw('create table slow (code text primary key)');
            await db('slow').insert({ code: 'kept' });
            release = await holdWriteLock(db, filename);
            const finished = rollbackFinished(first);
            let rolledBack = false;
            finished.then(() => (rolledBack = true));
            // The insert waits for the lock and the ROLLBACK queues behind
            // it, so rollback()'s 5 s timer settles the transaction first.
            const error = await db
              .transaction(async (trx) => {
                trx('slow')
                  .insert({ code: 'doomed' })
                  .catch(() => {});
                throw new Error('handler failed');
              })
              .then(
                () => null,
                (err) => err
              );
            expect(error.message).to.equal('handler failed');
            expect(rolledBack).to.equal(false);
            await release();
            release = null;
            await finished;
            let second;
            await db.transaction(async (trx) => {
              second = await trx.client.acquireConnection();
              await trx('slow').insert({ code: 'next' });
            });
            expect(second).to.equal(first);
            expect(await codes(db, 'slow')).to.deep.equal(['kept', 'next']);
          } finally {
            if (release) await release();
            await db.destroy();
          }
        });

        it('keeps the in-memory database when ROLLBACK outlasts the rollback timer', async function () {
          this.timeout(30000);
          const aux = path.join(dir, 'aux.sqlite3');
          const db = memoryDb();
          let release;
          try {
            const first = await onlyConnection(db);
            first.configure('busyTimeout', 30000);
            // Nothing outside this connection can lock an in-memory database,
            // so the statement that waits writes to an attached file.
            await db.raw('attach database ? as aux', [aux]);
            await db.raw('create table aux.blocker (id integer)');
            await db.raw('create table slow (code text primary key)');
            await db('slow').insert({ code: 'kept' });
            release = await holdWriteLock(db, aux);
            const finished = rollbackFinished(first);
            let rolledBack = false;
            finished.then(() => (rolledBack = true));
            const error = await db
              .transaction(async (trx) => {
                await trx('slow').insert({ code: 'doomed' });
                trx
                  .raw('insert into aux.blocker (id) values (1)')
                  .catch(() => {});
                throw new Error('handler failed');
              })
              .then(
                () => null,
                (err) => err
              );
            expect(error.message).to.equal('handler failed');
            expect(rolledBack).to.equal(false);
            await release();
            release = null;
            await finished;
            let second;
            await db.transaction(async (trx) => {
              second = await trx.client.acquireConnection();
              await trx('slow').insert({ code: 'next' });
            });
            expect(second).to.equal(first);
            expect(await codes(db, 'slow')).to.deep.equal(['kept', 'next']);
          } finally {
            if (release) await release();
            await db.destroy();
          }
        });

        it('commits and rolls back as before', async function () {
          const db = memoryDb();
          try {
            const first = await onlyConnection(db);
            await db.raw('create table plain (code text primary key)');
            await db.transaction(async (trx) => {
              await trx('plain').insert({ code: 'committed' });
            });
            const error = await db
              .transaction(async (trx) => {
                await trx('plain').insert({ code: 'rolled-back' });
                throw new Error('handler failed');
              })
              .then(
                () => null,
                (err) => err
              );
            expect(error.message).to.equal('handler failed');
            let second;
            await db.transaction(async (trx) => {
              second = await trx.client.acquireConnection();
            });
            expect(second).to.equal(first);
            expect(await codes(db, 'plain')).to.deep.equal(['committed']);
          } finally {
            await db.destroy();
          }
        });
      });
    });
  });
});

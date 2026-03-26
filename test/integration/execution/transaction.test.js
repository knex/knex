'use strict';

const Knex = require('../../../knex');
const _ = require('lodash');
const { KnexTimeoutError } = require('../../../lib/util/timeout');
const delay = require('../../../lib/execution/internal/delay');
const {
  isRedshift,
  isOracle,
  isMssql,
  isPostgreSQL,
  isCockroachDB,
} = require('../../util/db-helpers');
const { DRIVER_NAMES: drivers } = require('../../util/constants');
const {
  dropTables,
  createAccounts,
  createTestTableTwo,
} = require('../../util/tableCreatorHelper');
const {
  insertTestTableTwoData,
  insertAccounts,
} = require('../../util/dataInsertHelper');
const { assertNumber } = require('../../util/assertHelper');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../integration2/util/knex-instance-provider');
const { pDefer } = require('#test/util/deferred.js');

getAllDbs().forEach((db) => {
  describe(`${db} - Transactions`, () => {
    let knex;
    beforeAll(() => {
      knex = getKnexForDb(db);
    });
    afterAll(() => knex.destroy());

    // Certain dialects do not have proper insert with returning, so if this is true
    // then pick an id to use as the "foreign key" just for testing transactions.
    let constid;
    let fkid = 1;

    beforeAll(async () => {
      constid = isRedshift(knex);

      await dropTables(knex);
      await createAccounts(knex);
      await createTestTableTwo(knex);

      await insertAccounts(knex);
      await insertTestTableTwoData(knex);
    });

    it('can run with asCallback', function () {
      const dfd = pDefer();
      knex
        .transaction(function (t) {
          t.commit();
        })
        .asCallback(function (err) {
          if (err) return dfd.reject(err);
          dfd.resolve();
        });
      return dfd.promise;
    });

    it('should throw when undefined transaction is sent to transacting', function () {
      return knex
        .transaction(function (t) {
          knex('accounts').transacting(undefined);
        })
        .catch(function handle(error) {
          expect(error.message).toBe(
            'Invalid transacting value (null, undefined or empty object)'
          );
        });
    });

    it('supports direct retrieval of a transaction without a callback', () => {
      const trxPromise = knex.transaction();
      const query = isOracle(knex) ? '1 as "result" from DUAL' : '1 as result';

      let transaction;
      return trxPromise
        .then((trx) => {
          transaction = trx;
          expect(trx.client.transacting).toBe(true);
          return knex.transacting(trx).select(knex.raw(query));
        })
        .then((rows) => {
          assertNumber(knex, rows[0].result, 1);
          return transaction.commit();
        });
    });

    it('should throw when null transaction is sent to transacting', function () {
      return knex
        .transaction(function (t) {
          knex('accounts').transacting(null);
        })
        .catch(function handle(error) {
          expect(error.message).toBe(
            'Invalid transacting value (null, undefined or empty object)'
          );
        });
    });

    it('should throw when empty object transaction is sent to transacting', function () {
      return knex
        .transaction(function (t) {
          knex('accounts').transacting({});
        })
        .catch(function handle(error) {
          expect(error.message).toBe(
            'Invalid transacting value (null, undefined or empty object)'
          );
        });
    });

    it('should be able to commit transactions', function () {
      let id = null;
      return knex
        .transaction(function (t) {
          knex('accounts')
            .transacting(t)
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User',
              email: 'transaction-test1@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then(function (resp) {
              return knex('test_table_two')
                .transacting(t)
                .insert({
                  account_id: constid
                    ? ++fkid
                    : (id = !isNaN(resp[0]) ? resp[0] : resp[0].id),
                  details: '',
                  status: 1,
                });
            })
            .then(function () {
              t.commit('Hello world');
            });
        })
        .then(function (commitMessage) {
          expect(commitMessage).toBe('Hello world');
          return knex('accounts').where('id', id).select('first_name');
        })
        .then(function (resp) {
          if (!constid) {
            expect(resp).toHaveLength(1);
          }
        });
    });

    it('should be able to rollback transactions', function () {
      let id = null;
      const err = new Error('error message');
      return knex
        .transaction(function (t) {
          knex('accounts')
            .transacting(t)
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User2',
              email: 'transaction-test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then(function (resp) {
              return knex('test_table_two')
                .transacting(t)
                .insert({
                  account_id: constid
                    ? ++fkid
                    : (id = !isNaN(resp[0]) ? resp[0] : resp[0].id),
                  details: '',
                  status: 1,
                });
            })
            .then(function () {
              t.rollback(err);
            });
        })
        .catch(function (msg) {
          expect(msg).toBe(err);
          return knex('accounts').where('id', id).select('first_name');
        })
        .then(function (resp) {
          expect(resp.length).toBe(0);
        });
    });

    it('should be able to commit transactions with a resolved trx query', function () {
      let id = null;
      return knex
        .transaction(function (trx) {
          return trx('accounts')
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User',
              email: 'transaction-test3@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then(function (resp) {
              return trx('test_table_two').insert({
                account_id: constid
                  ? ++fkid
                  : (id = !isNaN(resp[0]) ? resp[0] : resp[0].id),
                details: '',
                status: 1,
              });
            })
            .then(function () {
              return 'Hello World';
            });
        })
        .then(function (commitMessage) {
          expect(commitMessage).toBe('Hello World');
          return knex('accounts').where('id', id).select('first_name');
        })
        .then(function (resp) {
          if (!constid) {
            expect(resp).toHaveLength(1);
          }
        });
    });

    it('should be able to rollback transactions with rejected trx query', function () {
      let id = null;
      const err = new Error('error message');
      let __knexUid,
        count = 0;
      return knex
        .transaction(function (trx) {
          return trx('accounts')
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User2',
              email: 'transaction-test4@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then(function (resp) {
              return trx
                .insert({
                  account_id: constid
                    ? ++fkid
                    : (id = !isNaN(resp[0]) ? resp[0] : resp[0].id),
                  details: '',
                  status: 1,
                })
                .into('test_table_two');
            })
            .then(function () {
              throw err;
            });
        })
        .on('query', function (obj) {
          count++;
          if (!__knexUid) __knexUid = obj.__knexUid;
          expect(__knexUid).toBe(obj.__knexUid);
        })
        .catch(function (msg) {
          // oracle & mssql: BEGIN & ROLLBACK not reported as queries
          const expectedCount = isOracle(knex) || isMssql(knex) ? 2 : 4;
          expect(count).toBe(expectedCount);
          expect(msg).toBe(err);
          return knex('accounts').where('id', id).select('first_name');
        })
        .then(function (resp) {
          expect(resp).toEqual([]);
        });
    });

    it('should be able to run schema methods', async function () {
      // CockroachDB requires schema changes to happen before any writes, so trying to execute migrations in transaction directly fails due to attempt to get lock first
      if (isCockroachDB(knex)) {
        return;
      }

      let __knexUid,
        count = 0;
      const err = new Error('error message');
      if (isPostgreSQL(knex)) {
        return knex
          .transaction(function (trx) {
            return trx.schema
              .createTable('test_schema_transactions', function (table) {
                table.increments();
                table.string('name');
                table.timestamps();
              })
              .then(function () {
                return trx('test_schema_transactions').insert({ name: 'bob' });
              })
              .then(function () {
                return trx('test_schema_transactions').count('*');
              })
              .then(function (resp) {
                const _count = parseInt(resp[0].count, 10);
                expect(_count).toBe(1);
                throw err;
              });
          })
          .on('query', function (obj) {
            count++;
            if (!__knexUid) __knexUid = obj.__knexUid;
            expect(__knexUid).toBe(obj.__knexUid);
          })
          .catch(function (msg) {
            expect(msg).toBe(err);
            expect(count).toBe(5);
            return knex('test_schema_migrations').count('*');
          })
          .then(() => {
            throw new Error('should never reach this line');
          })
          .catch(function (e) {
            // https://www.postgresql.org/docs/8.2/static/errcodes-appendix.html
            expect(e.code).toBe('42P01');
          });
      } else {
        let id = null;
        const promise = knex
          .transaction(function (trx) {
            return trx('accounts')
              .returning('id')
              .insert({
                first_name: 'Transacting',
                last_name: 'User3',
                email: 'transaction-test5@example.com',
                logins: 1,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: new Date(),
                updated_at: new Date(),
              })
              .then(function (resp) {
                return trx('test_table_two').insert({
                  account_id: constid
                    ? ++fkid
                    : (id = !isNaN(resp[0]) ? resp[0] : resp[0].id),
                  details: '',
                  status: 1,
                });
              })
              .then(function () {
                return trx.schema.createTable(
                  'test_schema_transactions',
                  function (table) {
                    table.increments();
                    table.string('name');
                    table.timestamps();
                  }
                );
              });
          })
          .on('query', function (obj) {
            count++;
            if (!__knexUid) __knexUid = obj.__knexUid;
            expect(__knexUid).toBe(obj.__knexUid);
          })
          .then(function () {
            if (isMssql(knex)) {
              expect(count).toBe(3);
            } else if (isOracle(knex)) {
              expect(count).toBe(4);
            } else {
              expect(count).toBe(5);
            }
            return knex('accounts').where('id', id).select('first_name');
          })
          .then(function (resp) {
            if (!constid) {
              expect(resp).toHaveLength(1);
            }
          });

        try {
          await promise;
        } finally {
          await knex.schema.dropTableIfExists('test_schema_transactions');
        }
      }
    });

    it('should resolve with the correct value, #298', function () {
      return knex
        .transaction(function (trx) {
          trx.debugging = true;
          return Promise.resolve(null);
        })
        .then(function (result) {
          expect(result).toBe(null);
        });
    });

    it('does not reject promise when rolling back a transaction', async () => {
      const trxProvider = knex.transactionProvider();
      const trx = await trxProvider();

      await trx.rollback();
      await trx.executionPromise;
    });

    it('should allow for nested transactions', function () {
      if (isRedshift(knex)) {
        return Promise.resolve();
      }
      return knex.transaction(function (trx) {
        return trx
          .select('*')
          .from('accounts')
          .then(function () {
            return trx.transaction(function () {
              return trx.select('*').from('accounts');
            });
          });
      });
    });

    it('#2213 - should wait for sibling transactions to finish', function () {
      if (isRedshift(knex)) {
        return;
      }

      const first = delay(50);
      const second = first.then(() => delay(50));
      return knex.transaction(function (trx) {
        return Promise.all([
          trx.transaction(function (trx2) {
            return first;
          }),
          trx.transaction(function (trx3) {
            return second;
          }),
        ]);
      });
    });

    it('#2213 - should not evaluate a Transaction container until all previous siblings have completed', async function () {
      if (isRedshift(knex)) {
        return;
      }

      const TABLE_NAME = 'test_sibling_transaction_order';
      await knex.schema.dropTableIfExists(TABLE_NAME);
      await knex.schema.createTable(TABLE_NAME, function (t) {
        t.string('username');
      });

      await knex.transaction(async function (trx) {
        await Promise.all([
          trx.transaction(async function (trx1) {
            // This delay provides `trx2` with an opportunity to run first.
            await delay(200);
            await trx1(TABLE_NAME).insert({ username: 'bob' });
          }),
          trx.transaction(async function (trx2) {
            const rows = await trx2(TABLE_NAME);

            // Even though `trx1` was delayed, `trx2` waited patiently for `trx1`
            // to finish.  Therefore, `trx2` discovers that there is already 1 row.
            expect(rows.length).toBe(1);
          }),
        ]);
      });
    });

    it('#855 - Query Event should trigger on Transaction Client AND main Client', function () {
      let queryEventTriggered = false;

      knex.once('query', function (queryData) {
        queryEventTriggered = true;
        return queryData;
      });

      function expectQueryEventToHaveBeenTriggered() {
        expect(queryEventTriggered).toBe(true);
      }

      return knex
        .transaction(function (trx) {
          trx.select('*').from('accounts').then(trx.commit).catch(trx.rollback);
        })
        .then(expectQueryEventToHaveBeenTriggered)
        .catch(expectQueryEventToHaveBeenTriggered);
    });

    it('#1040, #1171 - When pool is filled with transaction connections, Non-transaction queries should not hang the application, but instead throw a timeout error', async () => {
      //To make this test easier, I'm changing the pool settings to max 1.
      const knexConfig = _.clone(knex.client.config);
      knexConfig.pool.min = 0;
      knexConfig.pool.max = 1;
      knexConfig.acquireConnectionTimeout = 1000;

      const knexDb = new Knex(knexConfig);

      //Create a transaction that will occupy the only available connection, and avoid trx.commit.

      await knexDb.transaction(function (trx) {
        let sql = 'SELECT 1';
        if (isOracle(knex)) {
          sql = 'SELECT 1 FROM DUAL';
        } else if (isMssql(knex)) {
          // MSSQL does not have a boolean type.
          sql = 'SELECT CASE WHEN 1 = 1 THEN 1 ELSE 0 END';
        }

        trx
          .raw(sql)
          .then(function () {
            //No connection is available, so try issuing a query without transaction.
            //Since there is no available connection, it should throw a timeout error based on `aquireConnectionTimeout` from the knex config.
            return knexDb.raw('select * FROM accounts WHERE username = ?', [
              'Test',
            ]);
          })
          .then(function () {
            //Should never reach this point
            expect(false).toBeTruthy();
          })
          .catch(function (error) {
            expect(error.bindings).toBeInstanceOf(Array);
            expect(error.bindings[0]).toBe('Test');
            expect(error.sql).toBe('select * FROM accounts WHERE username = ?');
            expect(error.message).toBe(
              'Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?'
            );
            trx.commit(); //Test done
          });
      });

      await knexDb.destroy();
    });

    it('#1694, #1703 it should return connections to pool if acquireConnectionTimeout is triggered', async function () {
      const knexConfig = _.clone(knex.client.config);
      knexConfig.pool = {
        min: 0,
        max: 1,
      };
      knexConfig.acquireConnectionTimeout = 300;

      const db = new Knex(knexConfig);

      await expect(
        db.transaction(() => db.transaction(() => ({})))
      ).rejects.toThrow(KnexTimeoutError);

      await db.destroy();
    });

    /**
     * In mssql, certain classes of failures will "abort" a transaction, which
     * causes the subsequent ROLLBACK to fail (because the transaction has
     * been rolled back automatically).
     * An example of this type of auto-aborting error is creating a table with
     * a foreign key that references a non-existent table.
     */
    if (db === 'mssql') {
      it('should rollback when transaction aborts', function () {
        let insertedId = null;
        let originalError = null;

        function transactionAbortingQuery(transaction) {
          return transaction.schema.createTable(
            'test_schema_transaction_fails',
            function (table) {
              table.string('name').references('id').on('non_exist_table');
            }
          );
        }

        function insertSampleRow(transaction) {
          return transaction('accounts')
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User2',
              email: 'transaction-test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date(),
            })
            .then(function (res0) {
              insertedId = !isNaN(res0[0]) ? res0[0] : res0[0].id;
            });
        }

        function querySampleRow() {
          return knex('accounts').where('id', insertedId).select('first_name');
        }

        function captureAndRethrowOriginalError(err) {
          originalError = err;
          throw err;
        }

        return knex
          .transaction(function (t) {
            return insertSampleRow(t)
              .then(function () {
                return transactionAbortingQuery(t);
              })
              .catch(captureAndRethrowOriginalError);
          })
          .then(function () {
            //Should never reach this point
            expect(false).toBeTruthy();
          })
          .catch(function (err) {
            expect(err).toBeTruthy();
            expect(err.originalError).toBe(originalError);
            // confirm transaction rolled back
            return querySampleRow().then(function (resp) {
              expect(resp).toEqual([]);
            });
          });
      });
    }

    it('Rollback without an error should not reject with undefined #1966', function () {
      return knex
        .transaction(
          function (tr) {
            tr.rollback();
          },
          {
            doNotRejectOnRollback: false,
          }
        )
        .then(function () {
          expect(true).toBe(false);
        })
        .catch(function (error) {
          expect(error instanceof Error).toBe(true);
          expect(error.message).toBe(
            'Transaction rejected with non-error: undefined'
          );
        });
    });

    it('#1052 - transaction promise mutating', function () {
      const transactionReturning = knex.transaction(function (trx) {
        return trx
          .insert({
            first_name: 'foo',
            last_name: 'baz',
            email: 'fbaz@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: new Date(),
            updated_at: new Date(),
          })
          .into('accounts');
      });

      return Promise.all([transactionReturning, transactionReturning]).then(
        ([ret1, ret2]) => {
          expect(ret1).toBe(ret2);
        }
      );
    });

    it('should pass the query context to wrapIdentifier', function () {
      const originalWrapIdentifier = knex.client.config.wrapIdentifier;
      const spy = vi.fn();

      function restoreWrapIdentifier() {
        knex.client.config.wrapIdentifier = originalWrapIdentifier;
      }

      knex.client.config.wrapIdentifier = (value, wrap, queryContext) => {
        spy(queryContext);
        return wrap(value);
      };

      return knex
        .transaction(function (trx) {
          return trx.select().from('accounts').queryContext({ foo: 'bar' });
        })
        .then(function () {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith({ foo: 'bar' });
        })
        .then(function () {
          restoreWrapIdentifier();
        })
        .catch(function (e) {
          restoreWrapIdentifier();
          throw e;
        });
    });

    it('connection should contain __knexTxId which is also exposed in query event', function () {
      return knex.transaction(function (trx) {
        const builder = trx.select().from('accounts');

        trx.on('query', function (obj) {
          expect(typeof obj.__knexTxId).toBe(typeof '');
        });

        builder.on('query', function (obj) {
          expect(typeof obj.__knexTxId).toBe(typeof '');
        });

        return builder;
      });
    });

    it('#3690 does not swallow exception when error during transaction occurs', async function () {
      const mysqlKillConnection = async (connection) =>
        knex.raw('KILL ?', [connection.threadId]);
      const killConnectionMap = {
        [drivers.MySQL]: mysqlKillConnection,
        [drivers.MySQL2]: mysqlKillConnection,
        [drivers.PostgreSQL]: async (connection) =>
          knex.raw('SELECT pg_terminate_backend(?)', [connection.processID]),
      };

      const killConnection = killConnectionMap[knex.client.driverName];
      if (!killConnection) {
        return;
      }

      await expect(
        knex.transaction(async (trx2) => {
          await killConnection(await trx2.client.acquireConnection(), trx2);
          await trx2.transaction(async () => 2);
        })
      ).rejects.toThrow();
    });

    it('handles promise rejections in nested Transactions (#3706)', async function () {
      const fn = vi.fn();
      process.on('unhandledRejection', fn);
      try {
        await knex.transaction(async function (trx1) {
          // These two lines together will cause the underlying Transaction
          // to be rejected.  Prior to #3706, this rejection would be unhandled.
          const trx2 = await trx1.transaction(undefined, {
            doNotRejectOnRollback: false,
          });
          await trx2.rollback();

          await expect(trx2.executionPromise).rejects.toThrow();
        });

        expect(fn).not.toHaveBeenCalled();
      } finally {
        process.removeListener('unhandledRejection', fn);
      }
    });

    describe('when a `connection` is passed in explicitly', function () {
      let sandbox;

      beforeEach(function () {
        sandbox = vi.fn;
      });

      it('assumes the caller will release the connection', async function () {
        const releaseConnectionSpy = vi.spyOn(knex.client, 'releaseConnection');
        const conn = await knex.client.acquireConnection();
        try {
          await knex.transaction(
            async function (trx) {
              // Do nothing!
            },
            { connection: conn }
          );
        } catch (err) {
          // Do nothing.  The transaction could have failed due to some other
          // bug, and it might have still released the connection in the process.
        }

        expect(releaseConnectionSpy).not.toHaveBeenCalledWith(conn);

        // By design, this line will only be reached if the connection
        // was never released.
        knex.client.releaseConnection(conn);

        releaseConnectionSpy.mockRestore();
      });
    });

    it('exposes the parent transaction', async () => {
      await knex.transaction(async (trx1) => {
        expect(trx1.parentTransaction).toBe(undefined);

        await trx1.transaction(async (trx2) => {
          expect(trx2.parentTransaction).toBe(trx1);
        });

        await trx1.transaction(async (trx2) => {
          expect(trx2.parentTransaction).toBe(trx1);

          await trx2.transaction(async (trx3) => {
            expect(trx3.parentTransaction).toBe(trx2);
          });

          await trx2.transaction(async (trx3) => {
            expect(trx3.parentTransaction).toBe(trx2);
          });
        });
      });
    });
  });
});

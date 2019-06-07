/*global describe, expect, it*/

'use strict';

const bluebird = require('bluebird');
const Knex = require('../../../knex');
const _ = require('lodash');
const sinon = require('sinon');

module.exports = function(knex) {
  // Certain dialects do not have proper insert with returning, so if this is true
  // then pick an id to use as the "foreign key" just for testing transactions.
  const constid = /redshift/.test(knex.client.driverName);
  let fkid = 1;

  describe('Transactions', function() {
    it('can run with asCallback', function(ok) {
      knex
        .transaction(function(t) {
          t.commit();
        })
        .asCallback(ok);
    });

    it('should throw when undefined transaction is sent to transacting', function() {
      return knex
        .transaction(function(t) {
          knex('accounts').transacting(undefined);
        })
        .catch(function handle(error) {
          expect(error.message).to.equal(
            'Invalid transacting value (null, undefined or empty object)'
          );
        });
    });

    it('supports direct retrieval of a transaction without a callback', () => {
      const trxPromise = knex.transaction();
      const query =
        knex.client.driverName === 'oracledb'
          ? '1 as "result" from DUAL'
          : '1 as result';

      let transaction;
      return trxPromise
        .then((trx) => {
          transaction = trx;
          expect(trx.client.transacting).to.equal(true);
          return knex.transacting(trx).select(knex.raw(query));
        })
        .then((rows) => {
          expect(rows[0].result).to.equal(1);
          return transaction.commit();
        });
    });

    it('should throw when null transaction is sent to transacting', function() {
      return knex
        .transaction(function(t) {
          knex('accounts').transacting(null);
        })
        .catch(function handle(error) {
          expect(error.message).to.equal(
            'Invalid transacting value (null, undefined or empty object)'
          );
        });
    });

    it('should throw when empty object transaction is sent to transacting', function() {
      return knex
        .transaction(function(t) {
          knex('accounts').transacting({});
        })
        .catch(function handle(error) {
          expect(error.message).to.equal(
            'Invalid transacting value (null, undefined or empty object)'
          );
        });
    });

    it('should be able to commit transactions (TODO: fix random oracle fail)', function() {
      if (knex.client.driverName == 'oracledb') {
        this.skip();
        return;
      }

      let id = null;
      return knex
        .transaction(function(t) {
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
            .then(function(resp) {
              return knex('test_table_two')
                .transacting(t)
                .insert({
                  account_id: constid ? ++fkid : (id = resp[0]),
                  details: '',
                  status: 1,
                });
            })
            .then(function() {
              t.commit('Hello world');
            });
        })
        .then(function(commitMessage) {
          expect(commitMessage).to.equal('Hello world');
          return knex('accounts')
            .where('id', id)
            .select('first_name');
        })
        .then(function(resp) {
          if (!constid) {
            expect(resp).to.have.length(1);
          }
        });
    });

    it('should be able to rollback transactions', function() {
      let id = null;
      const err = new Error('error message');
      return knex
        .transaction(function(t) {
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
            .then(function(resp) {
              return knex('test_table_two')
                .transacting(t)
                .insert({
                  account_id: constid ? ++fkid : (id = resp[0]),
                  details: '',
                  status: 1,
                });
            })
            .then(function() {
              t.rollback(err);
            });
        })
        .catch(function(msg) {
          expect(msg).to.equal(err);
          return knex('accounts')
            .where('id', id)
            .select('first_name');
        })
        .then(function(resp) {
          expect(resp.length).to.equal(0);
        });
    });

    it('should be able to commit transactions with a resolved trx query (TODO: fix random oracle fail)', function() {
      if (knex.client.driverName == 'oracledb') {
        this.skip();
        return;
      }

      let id = null;
      return knex
        .transaction(function(trx) {
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
            .then(function(resp) {
              return trx('test_table_two').insert({
                account_id: constid ? ++fkid : (id = resp[0]),
                details: '',
                status: 1,
              });
            })
            .then(function() {
              return 'Hello World';
            });
        })
        .then(function(commitMessage) {
          expect(commitMessage).to.equal('Hello World');
          return knex('accounts')
            .where('id', id)
            .select('first_name');
        })
        .then(function(resp) {
          if (!constid) {
            expect(resp).to.have.length(1);
          }
        });
    });

    it('should be able to rollback transactions with rejected trx query', function() {
      let id = null;
      const err = new Error('error message');
      let __knexUid,
        count = 0;
      return knex
        .transaction(function(trx) {
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
            .then(function(resp) {
              return trx
                .insert({
                  account_id: constid ? ++fkid : (id = resp[0]),
                  details: '',
                  status: 1,
                })
                .into('test_table_two');
            })
            .then(function() {
              throw err;
            });
        })
        .on('query', function(obj) {
          count++;
          if (!__knexUid) __knexUid = obj.__knexUid;
          expect(__knexUid).to.equal(obj.__knexUid);
        })
        .catch(function(msg) {
          // oracle & mssql: BEGIN & ROLLBACK not reported as queries
          const expectedCount =
            knex.client.driverName === 'oracledb' ||
            knex.client.driverName === 'mssql'
              ? 2
              : 4;
          expect(count).to.equal(expectedCount);
          expect(msg).to.equal(err);
          return knex('accounts')
            .where('id', id)
            .select('first_name');
        })
        .then(function(resp) {
          expect(resp).to.eql([]);
        });
    });

    it('should be able to run schema methods', function() {
      let __knexUid,
        count = 0;
      const err = new Error('error message');
      if (knex.client.driverName === 'pg') {
        return knex
          .transaction(function(trx) {
            return trx.schema
              .createTable('test_schema_transactions', function(table) {
                table.increments();
                table.string('name');
                table.timestamps();
              })
              .then(function() {
                return trx('test_schema_transactions').insert({ name: 'bob' });
              })
              .then(function() {
                return trx('test_schema_transactions').count('*');
              })
              .then(function(resp) {
                const _count = parseInt(resp[0].count, 10);
                expect(_count).to.equal(1);
                throw err;
              });
          })
          .on('query', function(obj) {
            count++;
            if (!__knexUid) __knexUid = obj.__knexUid;
            expect(__knexUid).to.equal(obj.__knexUid);
          })
          .catch(function(msg) {
            expect(msg).to.equal(err);
            expect(count).to.equal(5);
            return knex('test_schema_migrations').count('*');
          })
          .catch(function(e) {
            // https://www.postgresql.org/docs/8.2/static/errcodes-appendix.html
            expect(e.code).to.equal('42P01');
          });
      } else {
        let id = null;
        return knex
          .transaction(function(trx) {
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
              .then(function(resp) {
                return trx('test_table_two').insert({
                  account_id: constid ? ++fkid : (id = resp[0]),
                  details: '',
                  status: 1,
                });
              })
              .then(function() {
                return trx.schema.createTable(
                  'test_schema_transactions',
                  function(table) {
                    table.increments();
                    table.string('name');
                    table.timestamps();
                  }
                );
              });
          })
          .on('query', function(obj) {
            count++;
            if (!__knexUid) __knexUid = obj.__knexUid;
            expect(__knexUid).to.equal(obj.__knexUid);
          })
          .then(function() {
            if (knex.client.driverName === 'mssql') {
              expect(count).to.equal(3);
            } else if (knex.client.driverName === 'oracledb') {
              expect(count).to.equal(4);
            } else {
              expect(count).to.equal(5);
            }
            return knex('accounts')
              .where('id', id)
              .select('first_name');
          })
          .then(function(resp) {
            if (!constid) {
              expect(resp).to.have.length(1);
            }
          })
          .finally(function() {
            return knex.schema.dropTableIfExists('test_schema_transactions');
          });
      }
    });

    it('should resolve with the correct value, #298', function() {
      return knex
        .transaction(function(trx) {
          trx.debugging = true;
          return Promise.resolve(null);
        })
        .then(function(result) {
          expect(result).to.equal(null);
        });
    });

    it('should allow for nested transactions', function() {
      if (/redshift/i.test(knex.client.driverName)) {
        return Promise.resolve();
      }
      return knex.transaction(function(trx) {
        return trx
          .select('*')
          .from('accounts')
          .then(function() {
            return trx.transaction(function() {
              return trx.select('*').from('accounts');
            });
          });
      });
    });

    it('#855 - Query Event should trigger on Transaction Client AND main Client', function() {
      let queryEventTriggered = false;

      knex.once('query', function(queryData) {
        queryEventTriggered = true;
        return queryData;
      });

      function expectQueryEventToHaveBeenTriggered() {
        expect(queryEventTriggered).to.equal(true);
      }

      return knex
        .transaction(function(trx) {
          trx
            .select('*')
            .from('accounts')
            .then(trx.commit)
            .catch(trx.rollback);
        })
        .then(expectQueryEventToHaveBeenTriggered)
        .catch(expectQueryEventToHaveBeenTriggered);
    });

    it('#1040, #1171 - When pool is filled with transaction connections, Non-transaction queries should not hang the application, but instead throw a timeout error', function() {
      //To make this test easier, I'm changing the pool settings to max 1.
      const knexConfig = _.clone(knex.client.config);
      knexConfig.pool.min = 0;
      knexConfig.pool.max = 1;
      knexConfig.acquireConnectionTimeout = 1000;

      const knexDb = new Knex(knexConfig);

      //Create a transaction that will occupy the only available connection, and avoid trx.commit.

      return knexDb.transaction(function(trx) {
        let sql = 'SELECT 1';
        if (knex.client.driverName === 'oracledb') {
          sql = 'SELECT 1 FROM DUAL';
        }

        trx
          .raw(sql)
          .then(function() {
            //No connection is available, so try issuing a query without transaction.
            //Since there is no available connection, it should throw a timeout error based on `aquireConnectionTimeout` from the knex config.
            return knexDb.raw('select * FROM accounts WHERE username = ?', [
              'Test',
            ]);
          })
          .then(function() {
            //Should never reach this point
            expect(false).to.be.ok();
          })
          .catch(function(error) {
            expect(error.bindings).to.be.an('array');
            expect(error.bindings[0]).to.equal('Test');
            expect(error.sql).to.equal(
              'select * FROM accounts WHERE username = ?'
            );
            expect(error.message).to.equal(
              'Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?'
            );
            trx.commit(); //Test done
          });
      });
    });

    it('#1694, #1703 it should return connections to pool if acquireConnectionTimeout is triggered', function() {
      const knexConfig = _.clone(knex.client.config);
      knexConfig.pool = {
        min: 0,
        max: 1,
      };
      knexConfig.acquireConnectionTimeout = 300;

      const db = new Knex(knexConfig);

      return db
        .transaction(function() {
          return db.transaction(function() {});
        })
        .then(function() {
          throw new Error('should not get here');
        })
        .catch(bluebird.TimeoutError, function(error) {});
    });

    /**
     * In mssql, certain classes of failures will "abort" a transaction, which
     * causes the subsequent ROLLBACK to fail (because the transaction has
     * been rolled back automatically).
     * An example of this type of auto-aborting error is creating a table with
     * a foreign key that references a non-existent table.
     */
    if (knex.client.driverName === 'mssql') {
      it('should rollback when transaction aborts', function() {
        let insertedId = null;
        let originalError = null;

        function transactionAbortingQuery(transaction) {
          return transaction.schema.createTable(
            'test_schema_transaction_fails',
            function(table) {
              table
                .string('name')
                .references('id')
                .on('non_exist_table');
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
            .then(function(res0) {
              insertedId = res0[0];
            });
        }

        function querySampleRow() {
          return knex('accounts')
            .where('id', insertedId)
            .select('first_name');
        }

        function captureAndRethrowOriginalError(err) {
          originalError = err;
          throw err;
        }

        return knex
          .transaction(function(t) {
            return insertSampleRow(t)
              .then(function() {
                return transactionAbortingQuery(t);
              })
              .catch(captureAndRethrowOriginalError);
          })
          .then(function() {
            //Should never reach this point
            expect(false).to.be.ok;
          })
          .catch(function(err) {
            expect(err).should.exist;
            expect(err.originalError).to.equal(originalError);
            // confirm transaction rolled back
            return querySampleRow().then(function(resp) {
              expect(resp).to.be.empty;
            });
          });
      });
    }

    it('Rollback without an error should not reject with undefined #1966', function() {
      return knex
        .transaction(function(tr) {
          tr.rollback();
        })
        .then(function() {
          expect(true).to.equal(false, 'Transaction should not have commited');
        })
        .catch(function(error) {
          expect(error instanceof Error).to.equal(true);
          expect(error.message).to.equal(
            'Transaction rejected with non-error: undefined'
          );
        });
    });

    it('#1052 - transaction promise mutating', function() {
      const transactionReturning = knex.transaction(function(trx) {
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

      return bluebird
        .all([transactionReturning, transactionReturning])
        .spread(function(ret1, ret2) {
          expect(ret1).to.equal(ret2);
        });
    });

    it('should pass the query context to wrapIdentifier', function() {
      const originalWrapIdentifier = knex.client.config.wrapIdentifier;
      const spy = sinon.spy().named('calledWithContext');

      function restoreWrapIdentifier() {
        knex.client.config.wrapIdentifier = originalWrapIdentifier;
      }

      knex.client.config.wrapIdentifier = (value, wrap, queryContext) => {
        spy(queryContext);
        return wrap(value);
      };

      return knex
        .transaction(function(trx) {
          return trx
            .select()
            .from('accounts')
            .queryContext({ foo: 'bar' });
        })
        .then(function() {
          expect(spy.callCount).to.equal(1);
          expect(spy.calledWith({ foo: 'bar' })).to.equal(true);
        })
        .then(function() {
          restoreWrapIdentifier();
        })
        .catch(function(e) {
          restoreWrapIdentifier();
          throw e;
        });
    });

    it('connection should contain __knexTxId which is also exposed in query event', function() {
      return knex.transaction(function(trx) {
        const builder = trx.select().from('accounts');

        trx.on('query', function(obj) {
          expect(typeof obj.__knexTxId).to.equal(typeof '');
        });

        builder.on('query', function(obj) {
          expect(typeof obj.__knexTxId).to.equal(typeof '');
        });

        return builder;
      });
    });
  });
};

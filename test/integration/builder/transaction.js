/*eslint-env mocha*/
/*eslint no-var:0, max-len:0 */

'use strict';

var Promise = require('bluebird')
var Knex   = require('../../../knex')
var _ = require('lodash');
var expect = require('expect')

module.exports = function(knex) {

  describe('Transactions', function() {

    it('can run with asCallback', function(ok) {
      knex.transaction(function(t) {
        t.commit();
      })
      .asCallback(ok)
    });

    it('should be able to commit transactions', function() {

      var id = null;
      return knex.transaction(function(t) {
        knex('accounts')
          .transacting(t)
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User',
            email:'transaction-test1@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: new Date(),
            updated_at: new Date()
          }).then(function(resp) {
            return knex('test_table_two').transacting(t).insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            });
          }).then(function() {
            t.commit('Hello world');
          });

      }).then(function(commitMessage) {
        expect(commitMessage).toEqual('Hello world');
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp.length).toEqual(1);
      });
    });

    it('should be able to rollback transactions', function() {
      var id = null;
      var err = new Error('error message');
      return knex.transaction(function(t) {
        knex('accounts')
          .transacting(t)
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User2',
            email:'transaction-test2@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: new Date(),
            updated_at: new Date()
          }).then(function(resp) {
            return knex('test_table_two').transacting(t).insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            });
          }).then(function() {
            t.rollback(err);
          });
      }).catch(function(msg) {
        expect(msg).toEqual(err);
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp.length).toEqual(0);
      });
    });

    it('should be able to commit transactions with a resolved trx query', function() {

      var id = null;
      return knex.transaction(function(trx) {
        return trx('accounts')
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User',
            email:'transaction-test3@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: new Date(),
            updated_at: new Date()
          }).then(function(resp) {
            return trx('test_table_two').insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            });
          }).then(function() {
            return 'Hello World';
          });
      }).then(function(commitMessage) {
        expect(commitMessage).toEqual('Hello World');
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp.length).toEqual(1);
      });
    });

    it('should be able to rollback transactions with rejected trx query', function() {
      var id = null;
      var err = new Error('error message');
      var __knexUid, count = 0;
      return knex.transaction(function(trx) {
        return trx('accounts')
          .returning('id')
          .insert({
            first_name: 'Transacting',
            last_name: 'User2',
            email:'transaction-test4@example.com',
            logins: 1,
            about: 'Lorem ipsum Dolore labore incididunt enim.',
            created_at: new Date(),
            updated_at: new Date()
          })
          .then(function(resp) {
            return trx.insert({
              account_id: (id = resp[0]),
              details: '',
              status: 1
            }).into('test_table_two');
          })
          .then(function() {
            throw err;
          });
      })
      .on('query', function(obj) {
        count++;
        if (!__knexUid) __knexUid = obj.__knexUid;
        expect(__knexUid).toEqual(obj.__knexUid);
      })
      .catch(function(msg) {
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        var expectedCount =
          knex.client.dialect === 'oracle' ||
          knex.client.dialect === 'mssql' ? 2 : 4;
        expect(count).toEqual(expectedCount);
        expect(msg).toEqual(err);
        return knex('accounts').where('id', id).select('first_name');
      })
      .then(function(resp) {
        expect(resp).toEqual([]);
      });
    });

    it('should be able to run schema methods', function() {
      var __knexUid, count = 0;
      var err = new Error('error message');
      if (knex.client.dialect === 'postgresql') {
        return knex.transaction(function(trx) {
          return trx.schema.createTable('test_schema_transactions', function(table) {
            table.increments();
            table.string('name');
            table.timestamps();
          }).then(function() {
            return trx('test_schema_transactions').insert({name: 'bob'});
          }).then(function() {
            return trx('test_schema_transactions').count('*');
          }).then(function(resp) {
            var _count = parseInt(resp[0].count, 10);
            expect(_count).toEqual(1);
            throw err;
          });
        })
        .on('query', function(obj) {
          count++;
          if (!__knexUid) __knexUid = obj.__knexUid;
          expect(__knexUid).toEqual(obj.__knexUid);
        })
        .catch(function(msg) {
          expect(msg).toEqual(err);
          expect(count).toEqual(5);
          return knex('test_schema_migrations').count('*');
        })
        .catch(function(e) {
          // https://www.postgresql.org/docs/8.2/static/errcodes-appendix.html
          expect(e.code).toEqual('42P01');
        });
      } else {
        var id = null;
        return knex.transaction(function(trx) {
          return trx('accounts')
            .returning('id')
            .insert({
              first_name: 'Transacting',
              last_name: 'User3',
              email:'transaction-test5@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: new Date(),
              updated_at: new Date()
            }).then(function(resp) {
              return trx('test_table_two').insert({
                account_id: (id = resp[0]),
                details: '',
                status: 1
              });
            }).then(function() {
              return trx.schema.createTable('test_schema_transactions', function(table) {
                table.increments();
                table.string('name');
                table.timestamps();
              });
            });
        })
        .on('query', function(obj) {
          count++;
          if (!__knexUid) __knexUid = obj.__knexUid;
          expect(__knexUid).toEqual(obj.__knexUid);
        }).then(function() {
          if (knex.client.dialect === 'mssql') {
            expect(count).toEqual(3);
          } else if (knex.client.dialect === 'oracle') {
            expect(count).toEqual(4);
          } else {
            expect(count).toEqual(5);
          }
          return knex('accounts').where('id', id).select('first_name');
        }).then(function(resp) {
          expect(resp.length).toEqual(1);
        }).finally(function() {
          return knex.schema.dropTableIfExists('test_schema_transactions');
        });
      }
    });

    it('should resolve with the correct value, #298', function() {
      return knex.transaction(function(trx) {
        trx.debugging = true;
        return Promise.resolve(null)
      }).then(function(result) {
        expect(result).toEqual(null)
      });
    });

    it('should allow for nested transactions', function() {
      return knex.transaction(function(trx) {
        return trx.select('*').from('accounts').then(function() {
          return trx.transaction(function() {
            return trx.select('*').from('accounts')
          })
        })
      })
    })

    it('#855 - Query Event should trigger on Transaction Client AND main Client', function(done) {
      var queryEventTriggered = false;

      knex.once('query', function(queryData) {
        queryEventTriggered = true;
        return queryData;
      });

      function expectQueryEventToHaveBeenTriggered() {
        expect(queryEventTriggered).toEqual(true);
        done();
      }

      knex.transaction(function(trx) {
        trx.select('*').from('accounts').then(trx.commit).catch(trx.rollback);
      })
      .then(expectQueryEventToHaveBeenTriggered)
      .catch(expectQueryEventToHaveBeenTriggered);

    });

    it('#1040, #1171 - When pool is filled with transaction connections, Non-transaction queries should not hang the application, but instead throw a timeout error', function() {
      //To make this test easier, I'm changing the pool settings to max 1.
      var knexConfig = _.clone(knex.client.config);
      knexConfig.pool.min = 0;
      knexConfig.pool.max = 1;
      knexConfig.acquireConnectionTimeout = 1000;

      var rootKnex = new Knex(knexConfig);

      //Create a transaction that will occupy the only available connection, and avoid trx.commit.
      return rootKnex.transaction(function(trx) {
        var sql = 'SELECT 1 = 1';
        if (knex.client.dialect === 'oracle') {
          sql = 'SELECT 1 FROM DUAL';
        }
        trx.raw(sql).then(function () {
          //No connection is available, so try issuing a query without transaction.
          //Since there is no available connection, it should throw a timeout error based on `acquireConnectionTimeout` from the knex config.
          return rootKnex.raw('select * FROM accounts WHERE username = ?', ['Test']).then(function () {
            //Should never reach this point
            expect(false).toEqual(true);
          })
        })
        .catch(function (error) {
          expect(error.message).toContain('Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?');
          expect(error.sql).toEqual('select * FROM accounts WHERE username = ?');
          expect(error.bindings).toBeAn('array');
          expect(error.bindings[0]).toEqual('Test');
          trx.commit() //Test done
        });
      });
    });

    it('#1694, #1703 it should return connections to pool if acquireConnectionTimeout is triggered', function() {
      var db = Knex({
        client: knex.client.driverName,
        pool: {
          min: 0,
          max: 1
        },
        connection: knex.client.connectionSettings,
        acquireConnectionTimeout: 300
      })
      return db.transaction(function(t) {
        return t.raw('SELECT 1').then(() => {
          return db.transaction(function(t2) {
            return t2.raw('SELECT 2')
          }).then(function () {
            throw new Error('should not get here')
          })
        })
      }).catch(function(error) {
        expect(error.message).toContain('Knex: Timeout acquiring a connection.')
        db.destroy()
      })
    })

  });
};

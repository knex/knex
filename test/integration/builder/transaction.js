/*global describe, expect, it, testPromise*/

'use strict';

var Promise = testPromise;
var Knex   = require('../../../knex');
var _ = require('lodash');

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
        expect(commitMessage).to.equal('Hello world');
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp).to.have.length(1);
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
        expect(msg).to.equal(err);
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp.length).to.equal(0);
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
        expect(commitMessage).to.equal('Hello World');
        return knex('accounts').where('id', id).select('first_name');
      }).then(function(resp) {
        expect(resp).to.have.length(1);
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
        expect(__knexUid).to.equal(obj.__knexUid);
      })
      .catch(function(msg) {
        // oracle & mssql: BEGIN & ROLLBACK not reported as queries
        var expectedCount =
          knex.client.dialect === 'oracle' ||
          knex.client.dialect === 'mssql' ? 2 : 4;
        expect(count).to.equal(expectedCount);
        expect(msg).to.equal(err);
        return knex('accounts').where('id', id).select('first_name');
      })
      .then(function(resp) {
        expect(resp).to.eql([]);
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
          expect(e.message).to.equal('select count(*) from \"test_schema_migrations\" - relation "test_schema_migrations" does not exist');
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
          expect(__knexUid).to.equal(obj.__knexUid);
        }).then(function() {
          if (knex.client.dialect === 'mssql') {
            expect(count).to.equal(3);
          } else {
            expect(count).to.equal(5);
          }
          return knex('accounts').where('id', id).select('first_name');
        }).then(function(resp) {
          expect(resp).to.have.length(1);
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
        expect(result).to.equal(null)
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
        expect(queryEventTriggered).to.equal(true);
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

      var knexDb = new Knex(knexConfig);

      //Create a transaction that will occupy the only available connection, and avoid trx.commit.
     return knexDb.transaction(function(trx) {
       trx.raw('SELECT 1 = 1').then(function () {
         //No connection is available, so try issuing a query without transaction.
         //Since there is no available connection, it should throw a timeout error based on `aquireConnectionTimeout` from the knex config.
         return knexDb.raw('select * FROM accounts WHERE username = ?', ['Test'])
       })
       .then(function () {
         //Should never reach this point
         expect(false).to.be.ok();
       }).catch(function (error) {
         expect(error.bindings).to.be.an('array');
         expect(error.bindings[0]).to.equal('Test');
         expect(error.sql).to.equal('select * FROM accounts WHERE username = ?');
         expect(error.message).to.equal('Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) call?');
         trx.commit();//Test done
       });
      });
    });

  });

};

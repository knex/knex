/*global describe, expect, it, testPromise, d*/
'use strict';

var _ = require('lodash')
var assert  = require('assert')
var Promise = testPromise;
var Runner = require('../../../lib/runner');

module.exports = function(knex) {

  describe('Selects', function() {

    it('runs with no conditions', function() {

      return knex('accounts').select();

    });

    it('returns an array of a single column with `pluck`', function() {
      return knex.pluck('id').orderBy('id').from('accounts')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `id` from `accounts` order by `id` asc',
            [],
            [1, 2, 3, 4, 5, 7]
          );
          tester(
            'postgresql',
            'select "id" from "accounts" order by "id" asc',
            [],
            ['1', '2', '3', '4', '5', '7']
          );
          tester(
            'pg-redshift',
            'select "id" from "accounts" order by "id" asc',
            [],
            ['1', '2', '3', '4', '5', '6']
          );
          tester(
            'sqlite3',
            'select `id` from `accounts` order by `id` asc',
            [],
            [1, 2, 3, 4, 5, 6]
          );
          tester(
            'oracle',
            "select \"id\" from \"accounts\" order by \"id\" asc",
            [],
            [1, 2, 3, 4, 5, 7]
          );
          tester(
            'mssql',
            'select [id] from [accounts] order by [id] asc',
            [],
            ['1', '2', '3', '4', '5', '7']
          );
        });
    });

    it('can pluck a qualified column name, #1619', function() {
      return knex.pluck('accounts.id').from('accounts').orderBy('accounts.id')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `accounts`.`id` from `accounts` order by `accounts`.`id` asc',
            [],
            [1, 2, 3, 4, 5, 7]
          );
          tester(
            'postgresql',
            'select "accounts"."id" from "accounts" order by "accounts"."id" asc',
            [],
            ['1', '2', '3', '4', '5', '7']
          );
          tester(
            'pg-redshift',
            'select "accounts"."id" from "accounts" order by "accounts"."id" asc',
            [],
            ['1', '2', '3', '4', '5', '6']
          );
          tester(
            'sqlite3',
            'select `accounts`.`id` from `accounts` order by `accounts`.`id` asc',
            [],
            [1, 2, 3, 4, 5, 6]
          );
          tester(
            'oracle',
            'select  "accounts"."id" from "accounts" order by "accounts"."id" asc',
            [],
            [1, 2, 3, 4, 5, 7]
          );
          tester(
            'mssql',
            'select [accounts].[id] from [accounts] order by [accounts].[id] asc',
            [],
            ['1', '2', '3', '4', '5', '7']
          );
        });
    });

    it('starts selecting at offset', function () {
      return knex.pluck('id').orderBy('id').from('accounts').offset(2)
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `id` from `accounts` order by `id` asc limit 18446744073709551615 offset ?',
            [2],
            [3, 4, 5, 7]
          );
          tester(
            'postgresql',
            'select "id" from "accounts" order by "id" asc offset ?',
            [2],
            ['3', '4', '5', '7']
          );
          tester(
            'pg-redshift',
            'select "id" from "accounts" order by "id" asc offset ?',
            [2],
            ['3', '4', '5', '6']
          );
          tester(
            'sqlite3',
            'select `id` from `accounts` order by `id` asc limit ? offset ?',
            [-1, 2],
            [3, 4, 5, 6]
          );
          tester(
            'oracle',
            "select * from (select row_.*, ROWNUM rownum_ from (select \"id\" from \"accounts\" order by \"id\" asc) row_ where rownum <= ?) where rownum_ > ?",
            [10000000000002, 2],
            [3, 4, 5, 7]
          );
          tester(
            'mssql',
            'select [id] from [accounts] order by [id] asc offset ? rows',
            [2],
            ['3', '4', '5', '7']
          );
        });
    });

    it('returns a single entry with first', function() {
      return knex.first('id', 'first_name').orderBy('id').from('accounts')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `id`, `first_name` from `accounts` order by `id` asc limit ?',
            [1],
            { id: 1, first_name: 'Test' }
          );
          tester(
            'postgresql',
            'select "id", "first_name" from "accounts" order by "id" asc limit ?',
            [1],
            { id: '1', first_name: 'Test' }
          );
          tester(
            'pg-redshift',
            'select "id", "first_name" from "accounts" order by "id" asc limit ?',
            [1],
            { id: '1', first_name: 'Test' }
          );
          tester(
            'sqlite3',
            'select `id`, `first_name` from `accounts` order by `id` asc limit ?',
            [1],
            { id: 1, first_name: 'Test' }
          );
          tester(
            'oracle',
            "select * from (select \"id\", \"first_name\" from \"accounts\" order by \"id\" asc) where rownum <= ?",
            [1],
            { id: 1, first_name: 'Test' }
          );
          tester(
            'mssql',
            'select top (?) [id], [first_name] from [accounts] order by [id] asc',
            [1],
            { id: '1', first_name: 'Test' }
          );
        });
    });

    it('allows you to stream', function() {
      let count = 0;
      return knex('accounts').stream(function(rowStream) {
        rowStream.on('data', function() {
          count++;
        });
      }).then(function() {
        assert(count === 6, 'Six rows should have been streamed');
      });
    });

    it('returns a stream if not passed a function', function(done) {
      let count = 0;
      const stream = knex('accounts').stream();
      stream.on('data', function() {
        count++;
        if (count === 6) done();
      });
    });

    it('allows you to stream with mysql dialect options', function() {
      if (!_.includes(['mysql', 'mysql2'], knex.client.dialect)) {
        return
      }
      const rows = []
      return knex('accounts')
        .options({
          typeCast (field, next) {
            var val
            if (field.type === 'VAR_STRING') {
              val = field.string()
              return val == null ? val : val.toUpperCase()
            }
            return next()
          }
        })
        .stream(function(rowStream) {
          rowStream.on('data', function(row) {
            rows.push(row)
          });
        }).then(function() {
          expect(rows).to.have.lengthOf(6)
          rows.forEach(row => {
            ['first_name', 'last_name', 'email'].forEach(
              field => expect(row[field]).to.equal(row[field].toUpperCase())
            )
          })
        });
    })

    it('emits error on the stream, if not passed a function, and connecting fails', function() {
      var expected = new Error();
      var original = Runner.prototype.ensureConnection;
      Runner.prototype.ensureConnection = function() {
        return Promise.reject(expected);
      };

      var restore = () => {
        Runner.prototype.ensureConnection = original;
      };

      var promise = new Promise((resolve, reject) => {
        var timeout = setTimeout(() => {
          reject(new Error('Timeout'));
        }, 5000);

        var stream = knex('accounts').stream();
        stream.on('error', function(actual) {
          clearTimeout(timeout);

          if (actual === expected) {
            resolve();
          } else {
            reject(new Error('Stream emitted unexpected error'));
          }
        });
      });

      promise.then(restore, restore);
      return promise;
    });

    it('properly escapes postgres queries on streaming', function() {
      let count = 0;
      return knex('accounts').where('id', 1).stream(function(rowStream) {
        rowStream.on('data', function() {
          count++;
        });
      }).then(function() {
        assert(count === 1, 'One row should have been streamed');
      });
    });

    it('throws errors on the asCallback if uncaught in the last block', function(ok) {

      const listeners = process.listeners('uncaughtException');

      process.removeAllListeners('uncaughtException');

      process.on('uncaughtException', function() {
        process.removeAllListeners('uncaughtException');
        for (let i = 0, l = listeners.length; i < l; i++) {
          process.on('uncaughtException', listeners[i]);
        }
        ok();
      });

      knex('accounts').select().asCallback(function() {
        console.log(this.undefinedVar.test);
      });
    });

    it('uses `orderBy`', function() {
      return knex('accounts')
        .pluck('id')
        .orderBy('id', 'desc')
        .testSql(function(tester) {
          tester(
            'oracle',
            "select \"id\" from \"accounts\" order by \"id\" desc",
            [],
            [7, 5, 4, 3, 2, 1]
          );
          tester(
            'mssql',
            "select [id] from [accounts] order by [id] desc",
            [],
            ['7', '5', '4', '3', '2', '1']
          );
        });
    });

    describe('simple "where" cases', function() {

      it('allows key, value', function() {

        return knex('accounts')
          .where('id', 1)
          .select('first_name', 'last_name')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `first_name`, `last_name` from `accounts` where `id` = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'postgresql',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'pg-redshift',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'sqlite3',
              'select `first_name`, `last_name` from `accounts` where `id` = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'oracle',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'mssql',
              'select [first_name], [last_name] from [accounts] where [id] = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
          });
      });

      it('allows key, operator, value', function() {

        return knex('accounts')
          .where('id', 1)
          .select('first_name', 'last_name')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `first_name`, `last_name` from `accounts` where `id` = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'postgresql',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'pg-redshift',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'sqlite3',
              'select `first_name`, `last_name` from `accounts` where `id` = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'oracle',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
            tester(
              'mssql',
              'select [first_name], [last_name] from [accounts] where [id] = ?',
              [1],
              [{
                first_name: 'Test',
                last_name: 'User'
              }]
            );
          });
      });

      it('allows selecting columns with an array', function() {

        return knex('accounts')
          .where('id', '>', 1)
          .select(['email', 'logins'])
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `email`, `logins` from `accounts` where `id` > ?',
              [1]
            );
            tester(
              'postgresql',
              'select "email", "logins" from "accounts" where "id" > ?',
              [1]
            );
            tester(
              'pg-redshift',
              'select "email", "logins" from "accounts" where "id" > ?',
              [1]
            );
            tester(
              'sqlite3',
              'select `email`, `logins` from `accounts` where `id` > ?',
              [1]
            );
            tester(
              'oracle',
              'select "email", "logins" from "accounts" where "id" > ?',
              [1]
            );
            tester(
              'mssql',
              'select [email], [logins] from [accounts] where [id] > ?',
              [1]
            );
          });
      });

      it('allows a hash of where attrs', function() {

        return knex('accounts')
          .where({'id': 1})
          .select('*')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select * from `accounts` where `id` = ?',
              [1],
              [{
                id: 1,
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
            tester(
              'postgresql',
              'select * from "accounts" where "id" = ?',
              [1],
              [{
                id: '1',
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
            tester(
              'pg-redshift',
              'select * from "accounts" where "id" = ?',
              [1],
              [{
                id: '1',
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
            tester(
              'sqlite3',
              'select * from `accounts` where `id` = ?',
              [1],
              [{
                id: 1,
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
            tester(
              'oracle',
              'select * from "accounts" where "id" = ?',
              [1],
              [{
                id: 1,
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
            tester(
              'mssql',
              'select * from [accounts] where [id] = ?',
              [1],
              [{
                id: '1',
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
          });
      });

      it('allows where id: undefined or id: null as a where null clause', function() {

        return knex('accounts')
          .where({'id': null})
          .select('first_name', 'email')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `first_name`, `email` from `accounts` where `id` is null',
              [],
              []
            );
            tester(
              'postgresql',
              'select "first_name", "email" from "accounts" where "id" is null',
              [],
              []
            );
            tester(
              'pg-redshift',
              'select "first_name", "email" from "accounts" where "id" is null',
              [],
              []
            );
            tester(
              'sqlite3',
              'select `first_name`, `email` from `accounts` where `id` is null',
              [],
              []
            );
            tester(
              'oracle',
              'select "first_name", "email" from "accounts" where "id" is null',
              [],
              []
            );
            tester(
              'mssql',
              'select [first_name], [email] from [accounts] where [id] is null',
              [],
              []
            );
          });

      });

      it('allows where id = 0', function() {

        return knex('accounts')
          .where({'id': 0})
          .select()
          .testSql(function(tester) {
            tester(
              'mysql',
              'select * from `accounts` where `id` = ?',
              [0],
              []
            );
            tester(
              'postgresql',
              'select * from "accounts" where "id" = ?',
              [0],
              []
            );
            tester(
              'pg-redshift',
              'select * from "accounts" where "id" = ?',
              [0],
              []
            );
            tester(
              'sqlite3',
              'select * from `accounts` where `id` = ?',
              [0],
              []
            );
            tester(
              'oracle',
              'select * from "accounts" where "id" = ?',
              [0],
              []
            );
            tester(
              'mssql',
              'select * from [accounts] where [id] = ?',
              [0],
              []
            );
          });
      });

    });

    it('has a "distinct" clause', function() {
      return Promise.all([
        knex('accounts').select().distinct('email').where('logins', 2).orderBy('email'),
        knex('accounts').distinct('email').select().orderBy('email')
      ]);
    });

    it('does "orWhere" cases', function() {
      return knex('accounts').where('id', 1).orWhere('id', '>', 2).select('first_name', 'last_name');
    });

    it('does "andWhere" cases', function() {
      return knex('accounts').select('first_name', 'last_name', 'about').where('id', 1).andWhere('email', 'test@example.com');
    });

    it('takes a function to wrap nested where statements', function() {
      return Promise.all([
        knex('accounts').where(function() {
          this.where('id', 2);
          this.orWhere('id', 3);
        }).select('*')
      ]);
    });

    it('handles "where in" cases', function() {
      return Promise.all([
        knex('accounts').whereIn('id', [1, 2, 3]).select()
      ]);
    });

    it('handles "or where in" cases', function() {
      return knex('accounts')
        .where('email', 'test@example.com')
        .orWhereIn('id', [2, 3, 4])
        .select();
    });

    it('handles multi-column "where in" cases', function() {
      if (knex.client.dialect !== 'sqlite3' && knex.client.dialect !== 'mssql') {
        return knex('composite_key_test')
          .whereIn(['column_a', 'column_b'], [[1, 1], [1, 2]])
          .orderBy('status', 'desc')
          .select()
          .testSql(function(tester) {
            tester('mysql',
              'select * from `composite_key_test` where (`column_a`, `column_b`) in ((?, ?), (?, ?)) order by `status` desc',
              [1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              },{
                column_a: 1,
                column_b: 2,
                details: 'One, Two, Zero',
                status: 0
              }]);
            tester('postgresql',
              'select * from "composite_key_test" where ("column_a", "column_b") in ((?, ?),(?, ?)) order by "status" desc',
              [1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              },{
                column_a: 1,
                column_b: 2,
                details: 'One, Two, Zero',
                status: 0
              }]);
            tester('pg-redshift',
              'select * from "composite_key_test" where ("column_a", "column_b") in ((?, ?), (?, ?)) order by "status" desc',
              [1,1,1,2],
              [
                {
                  column_a: 1,
                  column_b: 1,
                  details: 'One, One, One',
                  status: 1
                },
                {
                  column_a: 1,
                  column_b: 2,
                  details: 'One, Two, Zero',
                  status: 0
                },
              ]); 
            tester('oracle',
              'select * from "composite_key_test" where ("column_a","column_b") in ((?, ?),(?, ?)) order by "status" desc',
              [1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              },{
                column_a: 1,
                column_b: 2,
                details: 'One, Two, Zero',
                status: 0
              }]);
          });
      }
    });

    it('handles multi-column "where in" cases with where', function() {
      if (knex.client.dialect !== 'sqlite3' && knex.client.dialect !== 'mssql') {
        return knex('composite_key_test')
          .where('status', 1)
          .whereIn(['column_a', 'column_b'], [[1, 1], [1, 2]])
          .select()
          .testSql(function(tester) {
            tester('mysql',
              'select * from `composite_key_test` where `status` = ? and (`column_a`, `column_b`) in ((?, ?), (?, ?))',
              [1,1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              }]);
            tester('postgresql',
              'select * from "composite_key_test" where "status" = ? and ("column_a", "column_b") in ((?, ?),(?, ?))',
              [1,1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              }]);
            tester('pg-redshift',
              'select * from "composite_key_test" where "status" = ? and ("column_a", "column_b") in ((?, ?), (?, ?))',
              [1,1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              }]);
            tester('oracle',
              'select * from "composite_key_test" where "status" = ? and ("column_a", "column_b") in ((?, ?),(?, ?))',
              [1,1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              }]);
          });
      }
    });

    it('handles "where exists"', function() {
      return knex('accounts')
        .whereExists(function() {
          this.select('id').from('test_table_two').where({id: 1});
        })
        .select();
    });

    it('handles "where between"', function() {
      return knex('accounts').whereBetween('id', [1, 100]).select();
    });

    it('handles "or where between"', function() {
      return knex('accounts')
        .whereBetween('id', [1, 100])
        .orWhereBetween('id', [200, 300])
        .select();
    });

    it('does where(raw)', function() {
      if (knex.client.dialect === 'oracle') {
        // special case for oracle
        return knex('accounts')
          .whereExists(function() {
            this.select(knex.raw(1))
              .from('test_table_two')
              .where(knex.raw('"test_table_two"."account_id" = "accounts"."id"'));
          })
          .select();
      } else {
        return knex('accounts')
          .whereExists(function() {
            this.select(knex.raw(1))
              .from('test_table_two')
              .where(knex.raw('test_table_two.account_id = accounts.id'));
          })
          .select();
      }
    });

    it('does sub-selects', function() {
      return knex('accounts').whereIn('id', function() {
        this.select('account_id').from('test_table_two').where('status', 1);
      }).select('first_name', 'last_name');
    });

    it("supports the <> operator", function() {
      return knex('accounts').where('id', '<>', 2).select('email', 'logins');
    });

    it("Allows for knex.Raw passed to the `where` clause", function() {
      if (knex.client.dialect === 'oracle') {
        return knex('accounts').where(knex.raw('"id" = 2')).select('email', 'logins');
      } else {
        return knex('accounts').where(knex.raw('id = 2')).select('email', 'logins');
      }
    });

    it('Retains array bindings, #228', function() {
      const raw  = knex.raw('select * from table t where t.id = ANY( ?::int[] )', [[1, 2, 3]]);
      const raw2 = knex.raw('select "stored_procedure"(?, ?, ?)', [1, 2, ['a', 'b', 'c']]);
      const expected1 = [[1, 2, 3]];
      const expected2 = [1, 2, ['a', 'b', 'c']];
      expect(raw.toSQL().bindings).to.eql(knex.client.prepBindings(expected1));
      expect(raw2.toSQL().bindings).to.eql(knex.client.prepBindings(expected2));
      //Also expect raw's bindings to not have been modified by calling .toSQL() (preserving original bindings)
      expect(raw.bindings).to.eql(expected1);
      expect(raw2.bindings).to.eql(expected2);
    });

    it('always returns the response object from raw', function() {
      if (knex.client.dialect === 'postgresql') {
        return knex.raw('select id from accounts').then(function(resp) {
          assert(Array.isArray(resp.rows) === true);
        });
      }
    });

    it('properly escapes identifiers, #737', function() {
      if (knex.client.dialect === 'postgresql') {
        const query = knex.select('id","name').from('test').toSQL();
        assert(query.sql === 'select "id"",""name" from "test"');
      }
    });

  });

};

/*global describe, expect, it, d*/

'use strict';

var uuid = require('node-uuid');
var _    = require('lodash');

module.exports = function(knex) {

  describe('Inserts', function() {

    it("should handle simple inserts", function() {

      return knex('accounts').insert({
        first_name: 'Test',
        last_name: 'User',
        email:'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: d,
        updated_at: d
      }, 'id').testSql(function(tester) {
        tester(
          'mysql',
          'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test@example.com','Test','User', 1, d],
          [1]
        );
        tester(
          'postgresql',
          'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test@example.com','Test','User', 1, d],
          ['1']
        );
        tester(
          'sqlite3',
          'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test@example.com','Test','User', 1, d],
          [1]
        );
        tester(
          'oracle',
          "insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (?, ?, ?, ?, ?, ?, ?) returning ROWID into ?",
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test@example.com','Test','User', 1, d, function (v) { return v.toString() === '[object ReturningHelper:id]';}],
          [1]
        );
        tester(
          'mssql',
          'insert into [accounts] ([about], [created_at], [email], [first_name], [last_name], [logins], [updated_at]) output inserted.[id] values (?, ?, ?, ?, ?, ?, ?)',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test@example.com','Test','User', 1, d],
          ['1']
        );
      });
    });

    it('should handle multi inserts', function() {

      return knex('accounts')
        .insert([{
          first_name: 'Test',
          last_name: 'User',
          email:'test2@example.com',
          logins: 1,
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          created_at: d,
          updated_at: d
        }, {
          first_name: 'Test',
          last_name: 'User',
          email:'test3@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: d,
          updated_at: d
        }], 'id').testSql(function(tester) {
          tester(
            'mysql',
            'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d,'test2@example.com','Test','User',1, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test3@example.com','Test','User',2, d],
            [2]
          );
          tester(
            'postgresql',
            'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"',
            ['Lorem ipsum Dolore labore incididunt enim.', d,'test2@example.com','Test','User',1, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test3@example.com','Test','User',2, d],
            ['2','3']
          );
          tester(
            'sqlite3',
            'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union all select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"',
            ['Lorem ipsum Dolore labore incididunt enim.', d,'test2@example.com','Test','User',1, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test3@example.com','Test','User',2, d],
            [3]
          );
          tester(
            'oracle',
            "begin execute immediate 'insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (:1, :2, :3, :4, :5, :6, :7) returning ROWID into :8' using ?, ?, ?, ?, ?, ?, ?, out ?; execute immediate 'insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (:1, :2, :3, :4, :5, :6, :7) returning ROWID into :8' using ?, ?, ?, ?, ?, ?, ?, out ?;end;",
            ['Lorem ipsum Dolore labore incididunt enim.', d,'test2@example.com','Test','User',1, d, function (v) { return v.toString() === '[object ReturningHelper:id]';},
             'Lorem ipsum Dolore labore incididunt enim.', d,'test3@example.com','Test','User',2, d, function (v) { return v.toString() === '[object ReturningHelper:id]';}],
            [2, 3]
          );
          tester(
            'mssql',
            'insert into [accounts] ([about], [created_at], [email], [first_name], [last_name], [logins], [updated_at]) output inserted.[id] values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d,'test2@example.com','Test','User',1, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test3@example.com','Test','User',2, d],
            ['2', '3']
          );
        });

    });

    it('should allow for using the `asCallback` interface', function(ok) {

      knex('test_table_two').insert([{
        account_id: 1,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0
      }, {
        account_id: 2,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 1
      }, {
        account_id: 3,
        details: '',
        status: 1
      }], 'id')
      .testSql(function(tester) {
          tester(
            'oracle',
            "begin execute immediate 'insert into \"test_table_two\" (\"account_id\", \"details\", \"status\") values (:1, :2, :3) returning ROWID into :4' using ?, ?, ?, out ?; execute immediate 'insert into \"test_table_two\" (\"account_id\", \"details\", \"status\") values (:1, :2, :3) returning ROWID into :4' using ?, ?, ?, out ?; execute immediate 'insert into \"test_table_two\" (\"account_id\", \"details\", \"status\") values (:1, :2, :3) returning ROWID into :4' using ?, ?, ?, out ?;end;",
            [
              1,
              'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              0,
              function (v) {return v.toString() === '[object ReturningHelper:id]';},
              2,
              'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              1,
              function (v) {return v.toString() === '[object ReturningHelper:id]';},
              3,
              '',
              1,
              function (v) {return v.toString() === '[object ReturningHelper:id]';}
            ],
            [1, 2, 3]
          );
      }).asCallback(function(err) {
        if (err) return ok(err);
        ok();
      });

    });

    it('should take hashes passed into insert and keep them in the correct order', function() {

      return knex('accounts').insert([{
        first_name: 'Test',
        last_name: 'User',
        email:'test4@example.com',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: d,
        updated_at: d
      },{
        first_name: 'Test',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: d,
        updated_at: d,
        last_name: 'User',
        email:'test5@example.com'
      }], 'id').testSql(function(tester) {
        tester(
          'mysql',
          'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test4@example.com','Test','User',2, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test5@example.com','Test','User',2, d],
          [4]
        );
        tester(
          'postgresql',
          'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?) returning "id"',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test4@example.com','Test','User',2, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test5@example.com','Test','User',2, d],
          ['4','5']
        );
        tester(
          'sqlite3',
          'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at" union all select ? as "about", ? as "created_at", ? as "email", ? as "first_name", ? as "last_name", ? as "logins", ? as "updated_at"',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test4@example.com','Test','User',2, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test5@example.com','Test','User',2, d],
          [5]
        );
        tester(
          'oracle',
          "begin execute immediate 'insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (:1, :2, :3, :4, :5, :6, :7) returning ROWID into :8' using ?, ?, ?, ?, ?, ?, ?, out ?; execute immediate 'insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (:1, :2, :3, :4, :5, :6, :7) returning ROWID into :8' using ?, ?, ?, ?, ?, ?, ?, out ?;end;",
          [
            'Lorem ipsum Dolore labore incididunt enim.',
            d,
            'test4@example.com',
            'Test',
            'User',
            2,
            d,
            function (v) {return v.toString() === '[object ReturningHelper:id]';},
            'Lorem ipsum Dolore labore incididunt enim.',
            d,
            'test5@example.com',
            'Test',
            'User',
            2,
            d,
            function (v) {return v.toString() === '[object ReturningHelper:id]';}
          ],
          [4, 5]
        );
        tester(
          'mssql',
          'insert into [accounts] ([about], [created_at], [email], [first_name], [last_name], [logins], [updated_at]) output inserted.[id] values (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)',
          ['Lorem ipsum Dolore labore incididunt enim.', d,'test4@example.com','Test','User',2, d,'Lorem ipsum Dolore labore incididunt enim.', d,'test5@example.com','Test','User',2, d],
          ['4', '5']
        );
      });

    });

    it('will fail when multiple inserts are made into a unique column', function() {

      return knex('accounts')
        .where('id', '>', 1)
        .orWhere('x', 2)
        .insert({
          first_name: 'Test',
          last_name: 'User',
          email:'test5@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: d,
          updated_at: d
        }, 'id')
        .testSql(function(tester) {
          tester(
            'mysql',
            'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test5@example.com','Test','User', 2, d]
          );
          tester(
            'postgresql',
            'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test5@example.com','Test','User', 2, d]
          );
          tester(
            'sqlite3',
            'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test5@example.com','Test','User', 2, d]
          );
          tester(
            'oracle',
            "insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (?, ?, ?, ?, ?, ?, ?) returning ROWID into ?",
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test5@example.com','Test','User', 2, d, function (v) {return v.toString() === '[object ReturningHelper:id]';}]
          );
          tester(
            'mssql',
            'insert into [accounts] ([about], [created_at], [email], [first_name], [last_name], [logins], [updated_at]) output inserted.[id] values (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test5@example.com','Test','User', 2, d]
          );
        })
        .then(function() {
          throw new Error('There should be a fail when multi-insert are made in unique col.');
        }, function() {});

    });

    it('should drop any where clause bindings', function() {

      return knex('accounts')
        .where('id', '>', 1)
        .orWhere('x', 2)
        .insert({
          first_name: 'Test',
          last_name: 'User',
          email:'test6@example.com',
          about: 'Lorem ipsum Dolore labore incididunt enim.',
          logins: 2,
          created_at: d,
          updated_at: d
        }, 'id').testSql(function(tester) {
          tester(
            'mysql',
            'insert into `accounts` (`about`, `created_at`, `email`, `first_name`, `last_name`, `logins`, `updated_at`) values (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test6@example.com','Test','User',2, d],
            [7]
          );
          tester(
            'postgresql',
            'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?) returning "id"',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test6@example.com','Test','User',2, d],
            ['7']
          );
          tester(
            'sqlite3',
            'insert into "accounts" ("about", "created_at", "email", "first_name", "last_name", "logins", "updated_at") values (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test6@example.com','Test','User',2, d],
            [6]
          );
          tester(
            'oracle',
            "insert into \"accounts\" (\"about\", \"created_at\", \"email\", \"first_name\", \"last_name\", \"logins\", \"updated_at\") values (?, ?, ?, ?, ?, ?, ?) returning ROWID into ?",
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test6@example.com','Test','User',2, d, function (v) {return v.toString() === '[object ReturningHelper:id]';}],
            [7]
          );
          tester(
            'mssql',
            'insert into [accounts] ([about], [created_at], [email], [first_name], [last_name], [logins], [updated_at]) output inserted.[id] values (?, ?, ?, ?, ?, ?, ?)',
            ['Lorem ipsum Dolore labore incididunt enim.', d, 'test6@example.com','Test','User',2, d],
            ['7']
          );
        });

    });

    it('should not allow inserting invalid values into enum fields', function() {

      return knex('datatype_test')
        .insert({'enum_value': 'd'})
        .testSql(function(tester) {
          tester(
            'mysql',
            'insert into `datatype_test` (`enum_value`) values (?)',
            ['d']
          );
          tester(
            'postgresql',
            'insert into "datatype_test" ("enum_value") values (?)',
            ['d']
          );
          tester(
            'sqlite3',
            'insert into "datatype_test" ("enum_value") values (?)',
            ['d'],
            [1]
          );
          tester(
            'oracle',
            'insert into "datatype_test" ("enum_value") values (?)',
            ['d']
          );
          tester(
            'mssql',
            'insert into [datatype_test] ([enum_value]) values (?)',
            ['d']
          );
        })
        .then(function() {
          // No errors happen in sqlite3, which doesn't have native support
          // for the enum type.
          if (knex.client.dialect !== 'sqlite3') {
            throw new Error('There should be an error for invalid enum inserts');
          }
        }, function() {});

    });

    it('should not allow invalid uuids in postgresql', function() {

      return knex('datatype_test')
        .insert({
          enum_value: 'c',
          uuid: uuid.v4()
        }).then(function() {
          return knex('datatype_test').insert({enum_value: 'c', uuid: 'test'});
        }).then(function() {
          // No errors happen in sqlite3 or mysql, which dont have native support
          // for the uuid type.
          if (knex.client.dialect === 'postgresql' || knex.client.dialect === 'mssql') {
            throw new Error('There should be an error in postgresql for uuids');
          }
        }, function() {});

    });

    it('should not mutate the array passed in', function() {

      var a = {enum_value: 'a', uuid: uuid.v4()};
      var b = {enum_value: 'c', uuid: uuid.v4()};
      var x = [a, b];

      return knex('datatype_test')
        .insert(x)
        .then(function() {
          expect(x).to.eql([a, b]);
        });
    });

    it('should handle empty inserts', function() {

      return knex.schema
        .createTable('test_default_table', function(qb) {
          qb.increments().primary();
          qb.string('string').defaultTo('hello');
          qb.tinyint('tinyint').defaultTo(0);
          qb.text('text').nullable();
        }).then(function() {
          return knex('test_default_table').insert({}, 'id').testSql(function(tester) {
            tester(
              'mysql',
              'insert into `test_default_table` () values ()',
              [],
              [1]
            );
            tester(
              'postgresql',
              'insert into "test_default_table" default values returning "id"',
              [],
              [1]
            );
            tester(
              'sqlite3',
              'insert into "test_default_table" default values',
              [],
              [1]
            );
            tester(
              'oracle',
              "insert into \"test_default_table\" (\"id\") values (default) returning ROWID into ?",
              [function (v) {return v.toString() === '[object ReturningHelper:id]';}],
              [1]
            );
            tester(
              'mssql',
              'insert into [test_default_table] output inserted.[id] default values',
              [],
              [1]
            );
          });
        });
    });


    it('should handle empty arrays inserts', function() {

      return knex.schema
        .createTable('test_default_table2', function(qb) {
          qb.increments().primary();
          qb.string('string').defaultTo('hello');
          qb.tinyint('tinyint').defaultTo(0);
          qb.text('text').nullable();
        }).then(function() {
          return knex('test_default_table2').insert([{}], 'id').testSql(function(tester) {
            tester(
              'mysql',
              'insert into `test_default_table2` () values ()',
              [],
              [1]
            );
            tester(
              'postgresql',
              'insert into "test_default_table2" default values returning "id"',
              [],
              [1]
            );
            tester(
              'sqlite3',
              'insert into "test_default_table2" default values',
              [],
              [1]
            );
            tester(
              'oracle',
              "insert into \"test_default_table2\" (\"id\") values (default) returning ROWID into ?",
              [function (v) {return v.toString() === '[object ReturningHelper:id]';}],
              [1]
            );
            tester(
              'mssql',
              'insert into [test_default_table2] output inserted.[id] default values',
              [],
              [1]
            );
          });
        });
    });

    // TODO
    // it('should handle multiple default inserts with returning only', function() {
    //   if (knex.client.dialect === 'sqlite3') {
    //     console.log('not tested for sqlite3');
    //     return;
    //   }

    //   return knex.schema
    //     .createTable('test_default_table3', function(qb) {
    //       qb.increments().primary();
    //       qb.string('string').defaultTo('hello');
    //       qb.tinyint('tinyint').defaultTo(0);
    //       qb.text('text').nullable();
    //     }).then(function() {
    //       return knex('test_default_table3').insert([{}, {}], 'id').testSql(function(tester) {
    //         tester(
    //           'mysql',
    //           'insert into `test_default_table3` () values (), ()',
    //           [],
    //           [1]
    //         );
    //         tester(
    //           'postgresql',
    //           'insert into "test_default_table3" ("id") values (default), (default) returning "id"',
    //           [],
    //           [1, 2]
    //         );
    //         tester(
    //           'oracle',
    //           "begin execute immediate 'insert into \"test_default_table3\" (\"id\") values (default) returning ROWID into :1' using out ?; execute immediate 'insert into \"test_default_table3\" (\"id\") values (default) returning ROWID into :1' using out ?;end;",
    //           [function (v) {return v.toString() === '[object ReturningHelper:id]';}, function (v) {return v.toString() === '[object ReturningHelper:id]';}],
    //           [1, 2]
    //         );
    //         tester(
    //           'mssql',
    //           'insert into [test_default_table3] output inserted.[id] default values, default values',
    //           [],
    //           [1]
    //         );
    //       });
    //     }).then(function () {
    //       return knex('test_default_table3').then(function (rows) {
    //         expect(rows.length).to.equal(2);
    //       });
    //     });
    // });

    it('should take an array of columns to return in oracle or postgres', function() {
      var insertData = {
        account_id: 10,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0
      };
      return knex('test_table_two').insert(insertData, ['account_id', 'details']).testSql(function(tester) {
        tester(
          'mysql',
          'insert into `test_table_two` (`account_id`, `details`, `status`) values (?, ?, ?)',
          [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
          [4]
        );
        tester(
          'postgresql',
          'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?) returning "account_id", "details"',
          [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
          [{
            account_id: 10,
            details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
          }]
        );
        tester(
          'sqlite3',
          'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?)',
          [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
          [4]
        );
        tester(
          'oracle',
          "insert into \"test_table_two\" (\"account_id\", \"details\", \"status\") values (?, ?, ?) returning ROWID into ?",
          [
            10,
            'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
            0,
            function (v) {return v.toString() === '[object ReturningHelper:account_id:details]';}
          ],
          [{
            account_id: 10,
            details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
          }]
        );
        tester(
          'mssql',
          'insert into [test_table_two] ([account_id], [details], [status]) output inserted.[account_id], inserted.[details] values (?, ?, ?)',
          [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
          [{
              account_id: 10,
              details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.'
          }]
        );
      }).then(function(rows) {
        expect(rows.length).to.equal(1);
        if (knex.client.dialect === 'postgresql') {
          expect(_.keys(rows[0]).length).to.equal(2);
          expect(rows[0].account_id).to.equal(insertData.account_id);
          expect(rows[0].details).to.equal(insertData.details);
        }
      });
    });

    it('should allow a * for returning in postgres and oracle', function() {
      var insertData = {
        account_id: 10,
        details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0
      };

      var returningColumn = '*';
      return knex('test_table_two').insert(insertData, returningColumn).testSql(function(tester) {
        tester(
          'postgresql',
          'insert into "test_table_two" ("account_id", "details", "status") values (?, ?, ?) returning *',
          [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
          [{
            id: 5,
            account_id: 10,
            details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
            status: 0,
            json_data: null
          }]
        );
        tester(
          'oracle',
          "insert into \"test_table_two\" (\"account_id\", \"details\", \"status\") values (?, ?, ?) returning ROWID into ?",
          [
            10,
            'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
            0,
            function (v) {return v.toString() === '[object ReturningHelper:*]';}
          ],
          [{
            id: 5,
            account_id: 10,
            details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
            status: 0,
            json_data: null
          }]
        );
        tester(
          'mssql',
          'insert into [test_table_two] ([account_id], [details], [status]) output inserted.* values (?, ?, ?)',
          [10,'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',0],
          [{
            id: 5,
            account_id: 10,
            details: 'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
            status: 0,
            json_data: null
          }]
        );
      }).then(function(rows) {
        expect(rows.length).to.equal(1);
        if (knex.client.dialect === 'postgresql') {
          expect(_.keys(rows[0]).length).to.equal(5);
          expect(rows[0].account_id).to.equal(insertData.account_id);
          expect(rows[0].details).to.equal(insertData.details);
          expect(rows[0].status).to.equal(insertData.status);
          expect(rows[0].json_data).to.equal(null);
        }
      });
    });

    it('#757 - knex.batchInsert(tableName, bulk, chunkSize)', function () {
      var fiftyLengthString = 'rO8F8YrFS6uoivuRiVnwrO8F8YrFS6uoivuRiVnwuoivuRiVnw';
      var items             = [];
      var amountOfItems     = 100;
      var amountOfColumns   = 30;

      for (var i = 0; i < amountOfItems; i++) {
        var item = {};
        for (var x = 0; x < amountOfColumns; x++) {
          item['Col' + x] = fiftyLengthString;
        }
        items.push(item);
      }

      return knex.schema.dropTableIfExists('BatchInsert')
          .then(function () {
            return knex.schema.createTable('BatchInsert', function (table) {
              for (var i = 0; i < amountOfColumns; i++) {
                table.string('Col' + i, 50);
              }
            })
          })
          .then(function () {
            return knex.batchInsert('BatchInsert', items, 30);
          })
          .then(function () {
            return knex('BatchInsert').select();
          })
          .then(function (result) {
            var count = result.length;
            expect(count).to.equal(amountOfItems);
          })
    });

  });

  it('should validate batchInsert batchSize parameter', function() {
    expect(function () { knex.batchInsert('test', []) }).to.not.throw();
    expect(function () { knex.batchInsert('test', [], null) }).to.throw(TypeError);
    expect(function () { knex.batchInsert('test', [], 0) }).to.throw(TypeError);
    expect(function () { knex.batchInsert('test', [], 'still no good') }).to.throw(TypeError);
  });

};

/*global describe, d, it*/

'use strict';

module.exports = function(knex) {

  describe('Deletes', function () {

    it('should handle deletes', function() {
      return knex('accounts')
        .where('id', 1)
        .del()
        .testSql(function(tester) {
          tester(
            'mysql',
            'delete from `accounts` where `id` = ?',
            [1],
            1
          );
          tester(
            'postgresql',
            'delete from "accounts" where "id" = ?',
            [1],
            1
          );
          tester(
            'pg-redshift',
            'delete from "accounts" where "id" = ?',
            [1],
            1
          );
          tester(
            'sqlite3',
            'delete from `accounts` where `id` = ?',
            [1],
            1
          );
          tester(
            'oracle',
            'delete from "accounts" where "id" = ?',
            [1],
            1
          );
          tester(
            'mssql',
            'delete from [accounts] where [id] = ?;select @@rowcount',
            [1],
            1
          );
        });
    });

    it('should allow returning for deletes in postgresql', function() {
      return knex('accounts')
        .where('id', 2)
        .del('*')
        .testSql(function(tester) {
          tester(
            'mysql',
            'delete from `accounts` where `id` = ?',
            [2],
            1
          );
          tester(
            'postgresql',
            'delete from "accounts" where "id" = ? returning *',
            [2],
            [{
              id: '2',
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null
            }]
          );
          tester(
            'pg-redshift',
            'delete from "accounts" where "id" = ?',
            [2],
            1
          );
          tester(
            'sqlite3',
            'delete from `accounts` where `id` = ?',
            [2],
            1
          );
          tester(
            'oracle',
            'delete from "accounts" where "id" = ?',
            [2],
            1
          );
          tester(
            'mssql',
            'delete from [accounts] output deleted.* where [id] = ?',
            [2],
            [{
              id: '2',
              first_name: 'Test',
              last_name: 'User',
              email: 'test2@example.com',
              logins: 1,
              about: 'Lorem ipsum Dolore labore incididunt enim.',
              created_at: d,
              updated_at: d,
              phone: null
            }]
          );
        });
    });

  });

};

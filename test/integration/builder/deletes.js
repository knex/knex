'use strict';

const { TEST_TIMESTAMP } = require('../../util/constants');

module.exports = function (knex) {
  describe('Deletes', function () {
    it('should handle deletes', function () {
      return knex('accounts')
        .where('id', 1)
        .del()
        .testSql(function (tester) {
          tester('mysql', 'delete from `accounts` where `id` = ?', [1], 1);
          tester('pg', 'delete from "accounts" where "id" = ?', [1], 1);
          tester(
            'pg-redshift',
            'delete from "accounts" where "id" = ?',
            [1],
            1
          );
          tester('sqlite3', 'delete from `accounts` where `id` = ?', [1], 1);
          tester('oracledb', 'delete from "accounts" where "id" = ?', [1], 1);
          tester(
            'mssql',
            'delete from [accounts] where [id] = ?;select @@rowcount',
            [1],
            1
          );
        });
    });

    it('should allow returning for deletes in postgresql and mssql', function () {
      return knex('accounts')
        .where('id', 2)
        .del('*')
        .testSql(function (tester) {
          tester('mysql', 'delete from `accounts` where `id` = ?', [2], 1);
          tester(
            'pg',
            'delete from "accounts" where "id" = ? returning *',
            [2],
            [
              {
                id: '2',
                first_name: 'Test',
                last_name: 'User',
                email: 'test2@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
              },
            ]
          );
          tester(
            'pg-redshift',
            'delete from "accounts" where "id" = ?',
            [2],
            1
          );
          tester('sqlite3', 'delete from `accounts` where `id` = ?', [2], 1);
          tester('oracledb', 'delete from "accounts" where "id" = ?', [2], 1);
          tester(
            'mssql',
            'select top(0) [t].* into #out from [accounts] as t left join [accounts] on 0=1;delete from [accounts] output deleted.* into #out where [id] = ?; select * from #out; drop table #out;',
            [2],
            [
              {
                id: '2',
                first_name: 'Test',
                last_name: 'User',
                email: 'test2@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
              },
            ]
          );
        });
    });
  });
};

'use strict';

const { expect } = require('chai');
const { TEST_TIMESTAMP } = require('../../util/constants');
const { isSQLite, isOracle, isMysql } = require('../../util/db-helpers');
const { isPostgreSQL } = require('../../util/db-helpers.js');

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
          tester(
            'sqlite3',
            'delete from `accounts` where `id` = ? returning *',
            [2],
            [
              {
                id: 2,
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
          tester('oracledb', 'delete from "accounts" where "id" = ?', [2], 1);
          tester(
            'mssql',
            'delete from [accounts] output deleted.* where [id] = ?',
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

    it('#5738 should handle deletes with comments', function () {
      return knex('accounts')
        .where('id', 1)
        .del()
        .comment('removing acccount')
        .testSql(function (tester) {
          tester(
            'mysql',
            '/* removing acccount */ delete from `accounts` where `id` = ?',
            [1],
            0
          );
        });
    });

    describe('Delete with join', function () {
      it('should handle basic delete with join', async function () {
        const query = knex('test_table_two')
          .join('accounts', 'accounts.id', 'test_table_two.account_id')
          .where({ 'accounts.email': 'test3@example.com' })
          .del();
        if (isSQLite(knex) || isOracle(knex)) {
          await expect(query).to.be.rejected;
          return;
        }
        return query.testSql(function (tester) {
          tester(
            'mysql',
            'delete `test_table_two` from `test_table_two` inner join `accounts` on `accounts`.`id` = `test_table_two`.`account_id` where `accounts`.`email` = ?',
            ['test3@example.com'],
            1
          );
          tester(
            'pg',
            'delete from "test_table_two" using "accounts" where "accounts"."email" = ? and "accounts"."id" = "test_table_two"."account_id"',
            ['test3@example.com'],
            1
          );
          tester(
            'mssql',
            'delete [test_table_two] from [test_table_two] inner join [accounts] on [accounts].[id] = [test_table_two].[account_id] where [accounts].[email] = ?;select @@rowcount',
            ['test3@example.com'],
            1
          );
        });
      });

      it('should handle basic delete with join and "using" syntax in PostgreSQL', async function () {
        if (!isPostgreSQL(knex)) {
          this.skip();
        }
        await knex('test_table_two').insert({
          account_id: 4,
          details: '',
          status: 1,
        });
        const query = knex('test_table_two')
          .using('accounts')
          .where({ 'accounts.email': 'test4@example.com' })
          .whereRaw('"accounts"."id" = "test_table_two"."account_id"')
          .del();
        if (!isPostgreSQL(knex)) {
          await expect(query).to.be.rejected;
          return;
        }
        return query.testSql(function (tester) {
          tester(
            'pg',
            'delete from "test_table_two" using "accounts" where "accounts"."email" = ? and "accounts"."id" = "test_table_two"."account_id"',
            ['test4@example.com'],
            1
          );
        });
      });

      it('should handle returning', async function () {
        await knex('test_table_two').insert({
          account_id: 4,
          details: '',
          status: 1,
        });
        const query = knex('test_table_two')
          .join('accounts', 'accounts.id', 'test_table_two.account_id')
          .where({ 'accounts.email': 'test4@example.com' })
          .del('*');
        if (isSQLite(knex) || isOracle(knex)) {
          await expect(query).to.be.rejected;
          return;
        }
        return query.testSql(function (tester) {
          tester(
            'mysql',
            'delete `test_table_two` from `test_table_two` inner join `accounts` on `accounts`.`id` = `test_table_two`.`account_id` where `accounts`.`email` = ?',
            ['test4@example.com'],
            1
          );
          tester(
            'pg',
            'delete from "test_table_two" using "accounts" where "accounts"."email" = ? and "accounts"."id" = "test_table_two"."account_id" returning *',
            ['test4@example.com'],
            [
              {
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                balance: 0,
                id: '4',
                account_id: 4,
                details: '',
                status: 1,
                phone: null,
                logins: 2,
                email: 'test4@example.com',
                first_name: 'Test',
                last_name: 'User',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
              },
            ]
          );
          tester(
            'mssql',
            'delete [test_table_two] output deleted.* from [test_table_two] inner join [accounts] on [accounts].[id] = [test_table_two].[account_id] where [accounts].[email] = ?',
            ['test4@example.com'],
            [{ id: 9, account_id: 4, details: '', status: 1 }]
          );
        });
      });
    });

    describe('Delete with limit', function () {
      it('should support delete with limit in MySQL', async function () {
        if (!isMysql(knex)) {
          return this.skip();
        }

        await knex('accounts').insert([
          {
            first_name: 'LimitDel',
            last_name: 'One',
            email: 'limitdel1@example.com',
            logins: 1,
            balance: 0,
            about: '',
            created_at: TEST_TIMESTAMP,
            updated_at: TEST_TIMESTAMP,
          },
          {
            first_name: 'LimitDel',
            last_name: 'Two',
            email: 'limitdel2@example.com',
            logins: 1,
            balance: 0,
            about: '',
            created_at: TEST_TIMESTAMP,
            updated_at: TEST_TIMESTAMP,
          },
          {
            first_name: 'LimitDel',
            last_name: 'Three',
            email: 'limitdel3@example.com',
            logins: 1,
            balance: 0,
            about: '',
            created_at: TEST_TIMESTAMP,
            updated_at: TEST_TIMESTAMP,
          },
        ]);

        const deleted = await knex('accounts')
          .where('first_name', 'LimitDel')
          .del()
          .limit(2);

        expect(deleted).to.equal(2);

        const remaining = await knex('accounts')
          .where('first_name', 'LimitDel')
          .select();
        expect(remaining).to.have.length(1);

        await knex('accounts').where('first_name', 'LimitDel').del();
      });

      it('should reject delete with limit for non-MySQL dialects', async function () {
        if (isMysql(knex)) {
          return this.skip();
        }

        expect(() => {
          knex('accounts').where('id', 1).del().limit(1).toSQL();
        }).to.throw(/limit.*has no effect.*delete/);
      });
    });
  });
};

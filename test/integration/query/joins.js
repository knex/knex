'use strict';

const { expect } = require('chai');

const { TEST_TIMESTAMP } = require('../../util/constants');
const { isOracle, isMssql } = require('../../util/db-helpers');

module.exports = function (knex) {
  describe('Joins', function () {
    it('uses inner join by default', function () {
      return knex('accounts')
        .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
        .select('accounts.*', 'test_table_two.details')
        .orderBy('accounts.id')
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` order by `accounts`.`id` asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
            ]
          );
          tester(
            'pg',
            'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" order by "accounts"."id" asc',
            [],
            [
              {
                id: '1',
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: '3',
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
            ]
          );
          tester(
            'pg-redshift',
            'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" order by "accounts"."id" asc',
            [],
            [
              {
                id: '1',
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: '3',
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
            ]
          );
          tester(
            'sqlite3',
            'select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` order by `accounts`.`id` asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
            ]
          );
          tester(
            'oracledb',
            'select "accounts".*, "test_table_two"."details" from "accounts" inner join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" order by "accounts"."id" asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null, // Oracle implicitly converted '' to NULL
              },
            ]
          );
          tester(
            'mssql',
            'select [accounts].*, [test_table_two].[details] from [accounts] inner join [test_table_two] on [accounts].[id] = [test_table_two].[account_id] order by [accounts].[id] asc',
            [],
            [
              {
                id: '1',
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: '3',
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
            ]
          );
        });
    });

    it('has a leftJoin method parameter to specify the join type', function () {
      return knex('accounts')
        .leftJoin(
          'test_table_two',
          'accounts.id',
          '=',
          'test_table_two.account_id'
        )
        .select('accounts.*', 'test_table_two.details')
        .orderBy('accounts.id')
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `accounts`.*, `test_table_two`.`details` from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` order by `accounts`.`id` asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
              {
                id: 4,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: 5,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: 7,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
            ]
          );
          tester(
            'pg',
            'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" order by "accounts"."id" asc',
            [],
            [
              {
                id: '1',
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: '3',
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
              {
                id: '4',
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: '5',
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: '7',
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
            ]
          );
          tester(
            'pg-redshift',
            'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" order by "accounts"."id" asc',
            [],
            [
              {
                id: '1',
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: '3',
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
              {
                id: '4',
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: '5',
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: '6',
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
            ]
          );
          tester(
            'sqlite3',
            'select `accounts`.*, `test_table_two`.`details` from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` order by `accounts`.`id` asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
              {
                id: 4,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: 5,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: 6,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
            ]
          );
          tester(
            'oracledb',
            'select "accounts".*, "test_table_two"."details" from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" order by "accounts"."id" asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null, // Oracle implicitly converted '' to NULL
              },
              {
                id: 4,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: 5,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: 7,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
            ]
          );
          tester(
            'mssql',
            'select [accounts].*, [test_table_two].[details] from [accounts] left join [test_table_two] on [accounts].[id] = [test_table_two].[account_id] order by [accounts].[id] asc',
            [],
            [
              {
                id: '1',
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
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
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
              },
              {
                id: '3',
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: '',
              },
              {
                id: '4',
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: '5',
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
              {
                id: '7',
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                details: null,
              },
            ]
          );
        });
    });

    it('accepts a callback as the second argument for advanced joins', function () {
      return knex('accounts')
        .leftJoin('test_table_two', function (join) {
          join.on('accounts.id', '=', 'test_table_two.account_id');
          join.orOn('accounts.email', '=', 'test_table_two.details');
        })
        .select()
        .orderBy('accounts.id')
        .testSql(function (tester) {
          tester(
            'mysql',
            'select * from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` or `accounts`.`email` = `test_table_two`.`details` order by `accounts`.`id` asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 1,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 0,
                json_data: null,
              },
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
                account_id: 2,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 1,
                json_data: null,
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 3,
                details: '',
                status: 1,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
            ]
          );
          tester(
            'pg',
            'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details" order by "accounts"."id" asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 1,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 0,
                json_data: null,
              },
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
                account_id: 2,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 1,
                json_data: null,
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 3,
                details: '',
                status: 1,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
            ]
          );
          tester(
            'pg-redshift',
            'select * from "accounts" left join "test_table_two" on "accounts"."id" = "test_table_two"."account_id" or "accounts"."email" = "test_table_two"."details" order by "accounts"."id" asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 1,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 0,
                json_data: null,
              },
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
                account_id: 2,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 1,
                json_data: null,
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 3,
                details: '',
                status: 1,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
            ]
          );
          tester(
            'sqlite3',
            'select * from `accounts` left join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` or `accounts`.`email` = `test_table_two`.`details` order by `accounts`.`id` asc',
            [],
            [
              {
                id: 1,
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 1,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 0,
                json_data: null,
              },
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
                account_id: 2,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 1,
                json_data: null,
              },
              {
                id: 3,
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 3,
                details: '',
                status: 1,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: null,
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
            ]
          );
          tester(
            'mssql',
            'select * from [accounts] left join [test_table_two] on [accounts].[id] = [test_table_two].[account_id] or [accounts].[email] = [test_table_two].[details] order by [accounts].[id] asc',
            [],
            [
              {
                id: ['1', 1],
                first_name: 'Test',
                last_name: 'User',
                email: 'test@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 1,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 0,
                json_data: null,
              },
              {
                id: ['2', 2],
                first_name: 'Test',
                last_name: 'User',
                email: 'test2@example.com',
                logins: 1,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 2,
                details:
                  'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
                status: 1,
                json_data: null,
              },
              {
                id: ['3', 3],
                first_name: 'Test',
                last_name: 'User',
                email: 'test3@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: 3,
                details: '',
                status: 1,
                json_data: null,
              },
              {
                id: ['4', null],
                first_name: 'Test',
                last_name: 'User',
                email: 'test4@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: ['5', null],
                first_name: 'Test',
                last_name: 'User',
                email: 'test5@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
              {
                id: ['7', null],
                first_name: 'Test',
                last_name: 'User',
                email: 'test6@example.com',
                logins: 2,
                balance: 0,
                about: 'Lorem ipsum Dolore labore incididunt enim.',
                created_at: TEST_TIMESTAMP,
                updated_at: TEST_TIMESTAMP,
                phone: null,
                account_id: null,
                details: null,
                status: null,
                json_data: null,
              },
            ]
          );
        });
    });

    it('supports join aliases', function () {
      //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
      return knex('accounts')
        .join('accounts as a2', 'a2.email', '<>', 'accounts.email')
        .select(['accounts.email as e1', 'a2.email as e2'])
        .where('a2.email', 'test2@example.com')
        .orderBy('e1')
        .limit(5)
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `a2`.`email` <> `accounts`.`email` where `a2`.`email` = ? order by `e1` asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'pg',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'pg-redshift',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'sqlite3',
            'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `a2`.`email` <> `accounts`.`email` where `a2`.`email` = ? order by `e1` asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'oracledb',
            'select * from (select "accounts"."email" "e1", "a2"."email" "e2" from "accounts" inner join "accounts" "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc) where rownum <= ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'mssql',
            'select top (?) [accounts].[email] as [e1], [a2].[email] as [e2] from [accounts] inner join [accounts] as [a2] on [a2].[email] <> [accounts].[email] where [a2].[email] = ? order by [e1] asc',
            [5, 'test2@example.com'],
            [
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
        });
    });

    it('supports join aliases with advanced joins', function () {
      //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
      //But also include the case where the emails are the same, for account 2.
      return knex('accounts')
        .join('accounts as a2', function () {
          this.on('accounts.email', '<>', 'a2.email').orOn(
            'accounts.id',
            '=',
            2
          );
        })
        .where('a2.email', 'test2@example.com')
        .select(['accounts.email as e1', 'a2.email as e2'])
        .limit(5)
        .orderBy('e1')
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `accounts`.`email` <> `a2`.`email` or `accounts`.`id` = 2 where `a2`.`email` = ? order by `e1` asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test2@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'pg',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? order by "e1" asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test2@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'pg-redshift',
            'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? order by "e1" asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test2@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'sqlite3',
            'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `accounts`.`email` <> `a2`.`email` or `accounts`.`id` = 2 where `a2`.`email` = ? order by `e1` asc limit ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test2@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'oracledb',
            'select * from (select "accounts"."email" "e1", "a2"."email" "e2" from "accounts" inner join "accounts" "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? order by "e1" asc) where rownum <= ?',
            ['test2@example.com', 5],
            [
              {
                e1: 'test2@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test6@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
          tester(
            'mssql',
            'select top (?) [accounts].[email] as [e1], [a2].[email] as [e2] from [accounts] inner join [accounts] as [a2] on [accounts].[email] <> [a2].[email] or [accounts].[id] = 2 where [a2].[email] = ? order by [e1] asc',
            [5, 'test2@example.com'],
            [
              {
                e1: 'test@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test2@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test3@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test4@example.com',
                e2: 'test2@example.com',
              },
              {
                e1: 'test5@example.com',
                e2: 'test2@example.com',
              },
            ]
          );
        });
    });

    it('supports cross join without arguments', function () {
      return knex
        .select('account_id')
        .from('accounts')
        .crossJoin('test_table_two')
        .orderBy('account_id')
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `account_id` from `accounts` cross join `test_table_two` order by `account_id` asc',
            [],
            function (res) {
              return res.length === 30;
            }
          );
          tester(
            'pg',
            'select "account_id" from "accounts" cross join "test_table_two" order by "account_id" asc',
            [],
            function (res) {
              return res.length === 30;
            }
          );
          tester(
            'pg-redshift',
            'select "account_id" from "accounts" cross join "test_table_two" order by "account_id" asc',
            [],
            function (res) {
              // redshift, not supporting insert...returning, had to fake 6 of these in previous tests
              return res.length === 24;
            }
          );
          tester(
            'oracledb',
            'select "account_id" from "accounts" cross join "test_table_two" order by "account_id" asc',
            [],
            function (res) {
              return res.length === 30;
            }
          );
          tester(
            'sqlite3',
            'select `account_id` from `accounts` cross join `test_table_two` order by `account_id` asc',
            [],
            function (res) {
              return res.length === 30;
            }
          );
          tester(
            'mssql',
            'select [account_id] from [accounts] cross join [test_table_two] order by [account_id] asc',
            [],
            function (res) {
              return res.length === 30;
            }
          );
        });
    });

    it('supports joins with overlapping column names', function () {
      if (isOracle(knex)) {
        return this.skip();
      }

      return knex('accounts as a1')
        .leftJoin('accounts as a2', function () {
          this.on('a1.email', '<>', 'a2.email');
        })
        .orderBy('a2.id', 'asc')
        .select(['a1.email', 'a2.email'])
        .where(knex.raw('a1.id = 1'))
        .options({
          nestTables: true,
          rowMode: 'array',
        })
        .limit(2)
        .testSql(function (tester) {
          tester(
            'mysql',
            'select `a1`.`email`, `a2`.`email` from `accounts` as `a1` left join `accounts` as `a2` on `a1`.`email` <> `a2`.`email` where a1.id = 1 order by `a2`.`id` asc limit ?',
            [2],
            [
              {
                a1: {
                  email: 'test@example.com',
                },
                a2: {
                  email: 'test2@example.com',
                },
              },
              {
                a1: {
                  email: 'test@example.com',
                },
                a2: {
                  email: 'test3@example.com',
                },
              },
            ]
          );
          tester(
            'pg',
            'select "a1"."email", "a2"."email" from "accounts" as "a1" left join "accounts" as "a2" on "a1"."email" <> "a2"."email" where a1.id = 1 order by "a2"."id" asc limit ?',
            [2],
            [
              {
                0: 'test@example.com',
                1: 'test2@example.com',
              },
              {
                0: 'test@example.com',
                1: 'test3@example.com',
              },
            ]
          );
          tester(
            'pg-redshift',
            'select "a1"."email", "a2"."email" from "accounts" as "a1" left join "accounts" as "a2" on "a1"."email" <> "a2"."email" where a1.id = 1 order by "a2"."id" asc limit ?',
            [2],
            [
              {
                0: 'test@example.com',
                1: 'test2@example.com',
              },
              {
                0: 'test@example.com',
                1: 'test3@example.com',
              },
            ]
          );
          tester(
            'sqlite3',
            'select `a1`.`email`, `a2`.`email` from `accounts` as `a1` left join `accounts` as `a2` on `a1`.`email` <> `a2`.`email` where a1.id = 1 order by `a2`.`id` asc limit ?',
            [2],
            [
              {
                email: 'test2@example.com',
              },
              {
                email: 'test3@example.com',
              },
            ]
          );
          tester(
            'mssql',
            'select top (?) [a1].[email], [a2].[email] from [accounts] as [a1] left join [accounts] as [a2] on [a1].[email] <> [a2].[email] where a1.id = 1 order by [a2].[id] asc',
            [2],
            [
              {
                email: ['test@example.com', 'test2@example.com'],
              },
              {
                email: ['test@example.com', 'test3@example.com'],
              },
            ]
          );
        });
    });

    if (!isMssql(knex)) {
      it('Can use .using()', () => {
        const joinName = 'accounts_join_test';

        return knex.schema
          .dropTableIfExists(joinName)
          .then(() =>
            knex.schema.createTable(joinName, (table) => {
              table.bigint('id');
              table.string('email');
              table.integer('testcolumn');
            })
          )
          .then(() =>
            knex(joinName).insert([
              {
                id: 3,
                email: 'test3@example.com',
                testcolumn: 50,
              },
              {
                id: 3,
                email: 'random@email.com',
                testcolumn: 70,
              },
            ])
          )
          .then(() =>
            knex('accounts').join(joinName, (builder) =>
              builder.using(['id', 'email'])
            )
          )
          .then((rows) => {
            expect(rows.length).to.equal(1);
            expect(rows[0].testcolumn).to.equal(50);

            return knex('accounts')
              .join(joinName, (builder) => builder.using(['id']))
              .orderBy('testcolumn');
          })
          .then((rows) => {
            expect(rows.length).to.equal(2);
            expect(rows[0].testcolumn).to.equal(50);
            expect(rows[1].testcolumn).to.equal(70);

            return true;
          });
      });
    }
  });
};

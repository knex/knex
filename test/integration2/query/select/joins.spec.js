'use strict';

const { expect } = require('chai');

const { TEST_TIMESTAMP } = require('../../../util/constants');
const { isOracle, isMssql } = require('../../../util/db-helpers');
const {
  insertTestTableTwoData,
  insertAccounts,
  insertCities,
  insertCountry,
} = require('../../../util/dataInsertHelper');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');
const {
  dropTables,
  createAccounts,
  createTestTableTwo,
  createCities,
  createCountry,
} = require('../../../util/tableCreatorHelper');
const { assertNumber } = require('../../../util/assertHelper');

describe('Joins', function () {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
        knex = logger(getKnexForDb(db));
        await dropTables(knex);
        await createAccounts(knex);
        await createTestTableTwo(knex);

        await insertTestTableTwoData(knex);
      });

      beforeEach(async () => {
        await knex('accounts').truncate();

        await insertAccounts(knex);
      });

      after(async () => {
        await knex.destroy();
      });

      it('uses inner join by default', async function () {
        await knex('accounts')
          .join(
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
              'select `accounts`.*, `test_table_two`.`details` from `accounts` inner join `test_table_two` on `accounts`.`id` = `test_table_two`.`account_id` order by `accounts`.`id` asc',
              [],
              [
                {
                  id: 1,
                  first_name: 'Test',
                  last_name: 'User',
                  email: 'test1@example.com',
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
                  email: 'test1@example.com',
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
                  email: 'test1@example.com',
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
                  email: 'test1@example.com',
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
                  email: 'test1@example.com',
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
                  email: 'test1@example.com',
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

      it('has a leftJoin method parameter to specify the join type', async function () {
        await knex('accounts')
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
                  email: 'test1@example.com',
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
                {
                  id: 7,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  details: null,
                },
                {
                  id: 8,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
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
                  email: 'test1@example.com',
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
                {
                  id: '7',
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  details: null,
                },
                {
                  id: '8',
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
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
                  email: 'test1@example.com',
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
                {
                  id: '7',
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  details: null,
                },
                {
                  id: '8',
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
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
                  email: 'test1@example.com',
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
                {
                  id: 7,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  details: null,
                },
                {
                  id: 8,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
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
                  email: 'test1@example.com',
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
                {
                  id: 7,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  details: null,
                },
                {
                  id: 8,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
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
                  email: 'test1@example.com',
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
                {
                  id: '7',
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  details: null,
                },
                {
                  id: '8',
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
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

      // FixMe this test started failing for some reason: https://github.com/knex/knex/issues/5751
      it.skip('accepts a callback as the second argument for advanced joins', async function () {
        await knex('accounts')
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
                  email: 'test1@example.com',
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
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
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
                  email: 'test1@example.com',
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
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
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
                  email: 'test1@example.com',
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
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
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
                  email: 'test1@example.com',
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
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
                },
                {
                  id: null,
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
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
                  email: 'test1@example.com',
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
                },
                {
                  id: ['6', null],
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
                },
                {
                  id: ['7', null],
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test7@example.com',
                  logins: 2,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
                },
                {
                  id: ['8', null],
                  first_name: 'Test2',
                  last_name: 'User2',
                  email: 'test8@example.com',
                  logins: 3,
                  balance: 0,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                  account_id: null,
                  details: null,
                  status: null,
                },
              ]
            );
          });
      });

      it('supports join aliases', async function () {
        //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
        await knex('accounts')
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
                  e1: 'test1@example.com',
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
              'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc limit ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
              'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc limit ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
              'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `a2`.`email` <> `accounts`.`email` where `a2`.`email` = ? order by `e1` asc limit ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
              'select * from (select "accounts"."email" "e1", "a2"."email" "e2" from "accounts" inner join "accounts" "a2" on "a2"."email" <> "accounts"."email" where "a2"."email" = ? order by "e1" asc) where rownum <= ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
              'select top (?) [accounts].[email] as [e1], [a2].[email] as [e2] from [accounts] inner join [accounts] as [a2] on [a2].[email] <> [accounts].[email] where [a2].[email] = ? order by [e1] asc',
              [5, 'test2@example.com'],
              [
                {
                  e1: 'test1@example.com',
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

      it('supports join aliases with advanced joins', async function () {
        //Expected output: all pairs of account emails, excluding pairs where the emails are the same.
        //But also include the case where the emails are the same, for account 2.
        await knex('accounts')
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
                  e1: 'test1@example.com',
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
            tester(
              'pg',
              'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? order by "e1" asc limit ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
            tester(
              'pg-redshift',
              'select "accounts"."email" as "e1", "a2"."email" as "e2" from "accounts" inner join "accounts" as "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? order by "e1" asc limit ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
            tester(
              'sqlite3',
              'select `accounts`.`email` as `e1`, `a2`.`email` as `e2` from `accounts` inner join `accounts` as `a2` on `accounts`.`email` <> `a2`.`email` or `accounts`.`id` = 2 where `a2`.`email` = ? order by `e1` asc limit ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
            tester(
              'oracledb',
              'select * from (select "accounts"."email" "e1", "a2"."email" "e2" from "accounts" inner join "accounts" "a2" on "accounts"."email" <> "a2"."email" or "accounts"."id" = 2 where "a2"."email" = ? order by "e1" asc) where rownum <= ?',
              ['test2@example.com', 5],
              [
                {
                  e1: 'test1@example.com',
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
            tester(
              'mssql',
              'select top (?) [accounts].[email] as [e1], [a2].[email] as [e2] from [accounts] inner join [accounts] as [a2] on [accounts].[email] <> [a2].[email] or [accounts].[id] = 2 where [a2].[email] = ? order by [e1] asc',
              [5, 'test2@example.com'],
              [
                {
                  e1: 'test1@example.com',
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

      it('supports cross join without arguments', async function () {
        await knex
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
                return res.length === 24;
              }
            );
            tester(
              'pg',
              'select "account_id" from "accounts" cross join "test_table_two" order by "account_id" asc',
              [],
              function (res) {
                return res.length === 24;
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
                return res.length === 24;
              }
            );
            tester(
              'sqlite3',
              'select `account_id` from `accounts` cross join `test_table_two` order by `account_id` asc',
              [],
              function (res) {
                return res.length === 24;
              }
            );
            tester(
              'mssql',
              'select [account_id] from [accounts] cross join [test_table_two] order by [account_id] asc',
              [],
              function (res) {
                return res.length === 24;
              }
            );
          });
      });

      it('left join with subquery in on clause, #', async function () {
        await knex
          .select('account_id')
          .from('accounts')
          .leftJoin('test_table_two', (j) =>
            j.on(
              'accounts.id',
              '=',
              knex('test_table_two').select('id').limit(1)
            )
          )
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `account_id` from `accounts` left join `test_table_two` on `accounts`.`id` = (select `id` from `test_table_two` limit ?)',
              [1],
              function (res) {
                return res.length === 10;
              }
            );
            tester(
              'pg',
              'select "account_id" from "accounts" left join "test_table_two" on "accounts"."id" = (select "id" from "test_table_two" limit ?)',
              [1],
              function (res) {
                return res.length === 10;
              }
            );
            tester(
              'pg-redshift',
              'select "account_id" from "accounts" left join "test_table_two" on "accounts"."id" = (select "id" from "test_table_two" limit ?)',
              [1],
              function (res) {
                return res.length === 10;
              }
            );
            tester(
              'oracledb',
              'select "account_id" from "accounts" left join "test_table_two" on "accounts"."id" = (select * from (select "id" from "test_table_two") where rownum <= ?)',
              [1],
              function (res) {
                return res.length === 10;
              }
            );
            tester(
              'sqlite3',
              'select `account_id` from `accounts` left join `test_table_two` on `accounts`.`id` = (select `id` from `test_table_two` limit ?)',
              [1],
              function (res) {
                return res.length === 10;
              }
            );
            tester(
              'mssql',
              'select [account_id] from [accounts] left join [test_table_two] on [accounts].[id] = (select top (?) [id] from [test_table_two])',
              [1],
              function (res) {
                return res.length === 10;
              }
            );
          });
      });

      it('supports joins with overlapping column names', async function () {
        if (isOracle(knex)) {
          return this.skip();
        }

        await knex('accounts as a1')
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
                    email: 'test1@example.com',
                  },
                  a2: {
                    email: 'test2@example.com',
                  },
                },
                {
                  a1: {
                    email: 'test1@example.com',
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
                  0: 'test1@example.com',
                  1: 'test2@example.com',
                },
                {
                  0: 'test1@example.com',
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
                  0: 'test1@example.com',
                  1: 'test2@example.com',
                },
                {
                  0: 'test1@example.com',
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
                  email: ['test1@example.com', 'test2@example.com'],
                },
                {
                  email: ['test1@example.com', 'test3@example.com'],
                },
              ]
            );
          });
      });

      it('Can use .using()', async function () {
        if (isMssql(knex)) {
          return this.skip();
        }

        const joinName = 'accounts_join_test';

        await knex.schema.dropTableIfExists(joinName);
        await knex.schema.createTable(joinName, (table) => {
          table.bigint('id');
          table.string('email');
          table.integer('testcolumn');
        });

        const test3 = await knex('accounts')
          .select()
          .where({
            email: 'test3@example.com',
          })
          .first();

        await knex(joinName).insert([
          {
            id: test3.id,
            email: 'test3@example.com',
            testcolumn: 50,
          },
          {
            id: test3.id,
            email: 'random@email.com',
            testcolumn: 70,
          },
        ]);
        const rows = await knex('accounts').join(joinName, (builder) =>
          builder.using(['id', 'email'])
        );

        expect(rows.length).to.equal(1);
        assertNumber(knex, rows[0].testcolumn, 50);

        const rows2 = await knex('accounts')
          .join(joinName, (builder) => builder.using(['id']))
          .orderBy('testcolumn');
        expect(rows2.length).to.equal(2);
        assertNumber(knex, rows2[0].testcolumn, 50);
        assertNumber(knex, rows2[1].testcolumn, 70);
      });

      describe('json joins', () => {
        before(async () => {
          await knex.schema.dropTableIfExists('cities');
          await knex.schema.dropTableIfExists('country');
          await createCities(knex);
          await createCountry(knex);
        });

        beforeEach(async () => {
          await knex('cities').truncate();
          await knex('country').truncate();
          await insertCities(knex);
          await insertCountry(knex);
        });

        it('join on json path value', async () => {
          const result = await knex('cities')
            .select('cities.name as cityName', 'country.name as countryName')
            .join('country', function () {
              this.onJsonPathEquals(
                'temperature',
                '$.desc',
                'climate',
                '$.type'
              );
            });
          expect(result).to.eql([
            {
              cityName: 'Paris',
              countryName: 'France',
            },
            {
              cityName: 'Milan',
              countryName: 'Italy',
            },
          ]);
        });
      });
    });
  });
});

'use strict';

const { expect } = require('chai');

const { TEST_TIMESTAMP } = require('../../../util/constants');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');
const {
  dropTables,
  createAccounts,
} = require('../../../util/tableCreatorHelper');
const { insertAccounts } = require('../../../util/dataInsertHelper');
const { assertNumber } = require('../../../util/assertHelper');

describe('Updates', function () {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      let accountId1;

      before(async () => {
        knex = logger(getKnexForDb(db));
        await dropTables(knex);
        await createAccounts(knex);
      });

      after(async () => {
        await dropTables(knex);
        return knex.destroy();
      });

      beforeEach(async () => {
        await knex('accounts').truncate();
        await insertAccounts(knex);
        const accounts = await knex('accounts').select().where({
          email: 'test1@example.com',
        });
        accountId1 = accounts[0].id;
      });

      it('should handle updates', function () {
        return knex('accounts')
          .where('id', 1)
          .update({
            first_name: 'User',
            last_name: 'Test',
            email: 'test100@example.com',
          })
          .testSql(function (tester) {
            tester(
              'mysql',
              'update `accounts` set `first_name` = ?, `last_name` = ?, `email` = ? where `id` = ?',
              ['User', 'Test', 'test100@example.com', 1],
              1
            );
            tester(
              'pg',
              'update "accounts" set "first_name" = ?, "last_name" = ?, "email" = ? where "id" = ?',
              ['User', 'Test', 'test100@example.com', 1],
              1
            );
            tester(
              'pg-redshift',
              'update "accounts" set "first_name" = ?, "last_name" = ?, "email" = ? where "id" = ?',
              ['User', 'Test', 'test100@example.com', 1],
              1
            );
            tester(
              'sqlite3',
              'update `accounts` set `first_name` = ?, `last_name` = ?, `email` = ? where `id` = ?',
              ['User', 'Test', 'test100@example.com', 1],
              1
            );
            tester(
              'mssql',
              'update [accounts] set [first_name] = ?, [last_name] = ?, [email] = ? where [id] = ?;select @@rowcount',
              ['User', 'Test', 'test100@example.com', 1],
              1
            );
          });
      });

      it('should allow for null updates', function () {
        return knex('accounts')
          .where('id', 1000)
          .update({
            email: 'test100@example.com',
            first_name: null,
            last_name: 'Test',
          })
          .testSql(function (tester) {
            tester(
              'mysql',
              'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
              ['test100@example.com', null, 'Test', 1000],
              0
            );
            tester(
              'mssql',
              'update [accounts] set [email] = ?, [first_name] = ?, [last_name] = ? where [id] = ?;select @@rowcount',
              ['test100@example.com', null, 'Test', 1000],
              0
            );
          });
      });

      it('should immediately return updated value for other connections when updating row to DB returns', function () {
        return knex('accounts').then((res) => {
          function runTest() {
            return Promise.all(
              res.map((origRow) => {
                return Promise.resolve()
                  .then(() => {
                    return knex.transaction((trx) =>
                      trx('accounts')
                        .where('id', origRow.id)
                        .update({ balance: 654 })
                    );
                  })
                  .then(() => {
                    return knex('accounts')
                      .where('id', origRow.id)
                      .then((res) => res[0]);
                  })
                  .then((updatedRow) => {
                    expect(updatedRow.balance).to.equal(654);
                    return knex.transaction((trx) =>
                      trx('accounts')
                        .where('id', origRow.id)
                        .update({ balance: origRow.balance })
                    );
                  })
                  .then(() => {
                    return knex('accounts')
                      .where('id', origRow.id)
                      .then((res) => res[0]);
                  })
                  .then((updatedRow) => {
                    expect(updatedRow.balance).to.equal(origRow.balance);
                  });
              })
            );
          }

          // run few times to try to catch the problem
          return runTest()
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest())
            .then(() => runTest());
        });
      });

      it('should increment a value', function () {
        return knex('accounts')
          .select('logins')
          .where('id', accountId1)
          .then(function (accounts) {
            return knex('accounts')
              .where('id', accountId1)
              .increment('logins')
              .then(function (rowsAffected) {
                expect(rowsAffected).to.equal(1);
                return knex('accounts')
                  .select('logins')
                  .where('id', accountId1);
              })
              .then(function (accounts2) {
                assertNumber(
                  knex,
                  accounts2[0].logins,
                  parseInt(accounts[0].logins) + 1
                );
              });
          });
      });

      it('should increment a negative value', function () {
        return knex('accounts')
          .select('logins')
          .where('id', accountId1)
          .then(function (accounts) {
            return knex('accounts')
              .where('id', accountId1)
              .increment('logins', -2)
              .then(function (rowsAffected) {
                expect(rowsAffected).to.equal(1);
                return knex('accounts')
                  .select('logins')
                  .where('id', accountId1);
              })
              .then(function (accounts2) {
                assertNumber(knex, accounts2[0].logins, accounts[0].logins - 2);
              });
          });
      });

      it('should increment a float value', function () {
        return knex('accounts')
          .select('balance')
          .where('id', accountId1)
          .then(function (accounts) {
            return knex('accounts')
              .where('id', accountId1)
              .increment('balance', 22.53)
              .then(function (rowsAffected) {
                expect(rowsAffected).to.equal(1);
                return knex('accounts')
                  .select('balance')
                  .where('id', accountId1);
              })
              .then(function (accounts2) {
                expect(accounts[0].balance + 22.53).to.be.closeTo(
                  accounts2[0].balance,
                  0.001
                );
              });
          });
      });

      it('should decrement a value', function () {
        return knex('accounts')
          .select('logins')
          .where('id', accountId1)
          .then(function (accounts) {
            return knex('accounts')
              .where('id', accountId1)
              .decrement('logins')
              .then(function (rowsAffected) {
                expect(rowsAffected).to.equal(1);
                return knex('accounts')
                  .select('logins')
                  .where('id', accountId1);
              })
              .then(function (accounts2) {
                assertNumber(knex, accounts2[0].logins, accounts[0].logins - 1);
              });
          });
      });

      it('should decrement a negative value', function () {
        return knex('accounts')
          .select('logins')
          .where('id', accountId1)
          .then(function (accounts) {
            return knex('accounts')
              .where('id', accountId1)
              .decrement('logins', -2)
              .then(function (rowsAffected) {
                expect(rowsAffected).to.equal(1);
                return knex('accounts')
                  .select('logins')
                  .where('id', accountId1);
              })
              .then(function (accounts2) {
                assertNumber(
                  knex,
                  accounts2[0].logins,
                  parseInt(accounts[0].logins) + 2
                );
              });
          });
      });

      it('should decrement a float value', async function () {
        return knex('accounts')
          .select('balance')
          .where('id', accountId1)
          .then(function (accounts) {
            return knex('accounts')
              .where('id', accountId1)
              .decrement('balance', 10.29)
              .then(function (rowsAffected) {
                expect(rowsAffected).to.equal(1);
                return knex('accounts')
                  .select('balance')
                  .where('id', accountId1);
              })
              .then(function (accounts2) {
                expect(accounts[0].balance - 10.29).to.be.closeTo(
                  accounts2[0].balance,
                  0.001
                );
              });
          });
      });

      it('should allow returning for updates', async function () {
        await knex('accounts').where('id', accountId1).update({
          balance: 12.240000000000002,
        });

        await knex('accounts')
          .where('id', accountId1)
          .update(
            {
              email: 'test100@example.com',
              first_name: 'UpdatedUser',
              last_name: 'UpdatedTest',
            },
            '*'
          )
          .testSql(function (tester) {
            tester(
              'mysql',
              'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
              ['test100@example.com', 'UpdatedUser', 'UpdatedTest', 1],
              1
            );
            tester(
              'pg',
              'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ? returning *',
              ['test100@example.com', 'UpdatedUser', 'UpdatedTest', '1'],
              [
                {
                  id: '1',
                  first_name: 'UpdatedUser',
                  last_name: 'UpdatedTest',
                  email: 'test100@example.com',
                  logins: 1,
                  balance: 12.24,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                },
              ]
            );
            tester(
              'cockroachdb',
              'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ? returning *',
              ['test100@example.com', 'UpdatedUser', 'UpdatedTest', accountId1],
              [
                {
                  id: accountId1,
                  first_name: 'UpdatedUser',
                  last_name: 'UpdatedTest',
                  email: 'test100@example.com',
                  logins: '1',
                  balance: 12.24,
                  about: 'Lorem ipsum Dolore labore incididunt enim.',
                  created_at: TEST_TIMESTAMP,
                  updated_at: TEST_TIMESTAMP,
                  phone: null,
                },
              ]
            );
            tester(
              'pg-redshift',
              'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
              ['test100@example.com', 'UpdatedUser', 'UpdatedTest', 1],
              1
            );
            tester(
              'sqlite3',
              'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
              ['test100@example.com', 'UpdatedUser', 'UpdatedTest', 1],
              1
            );
            tester(
              'oracledb',
              'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ? returning "ROWID" into ?',
              [
                'test100@example.com',
                'UpdatedUser',
                'UpdatedTest',
                1,
                (v) => v.toString() === '[object ReturningHelper:ROWID]',
              ],
              1
            );
            tester(
              'mssql',
              'update [accounts] set [email] = ?, [first_name] = ?, [last_name] = ? output inserted.* where [id] = ?',
              ['test100@example.com', 'UpdatedUser', 'UpdatedTest', '1'],
              [
                {
                  id: '1',
                  first_name: 'UpdatedUser',
                  last_name: 'UpdatedTest',
                  email: 'test100@example.com',
                  logins: 1,
                  balance: 12.240000000000002,
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
  });
});

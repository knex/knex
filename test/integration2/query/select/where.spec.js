'use strict';

const { expect } = require('chai');

require('assert');
require('../../../../lib/execution/runner');

const {
  isMysql,
  isPostgreSQL,
  isMssql,
  isSQLite,
  isOracle,
} = require('../../../util/db-helpers');
const {
  createUsers,
  createAccounts,
  createCompositeKeyTable,
  createTestTableTwo,
  dropTables,
  createDefaultTable,
  createCities,
} = require('../../../util/tableCreatorHelper');
const {
  insertAccounts,
  insertCities,
} = require('../../../util/dataInsertHelper');

const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');
const { TEST_TIMESTAMP } = require('../../../util/constants.js');
const { assertJsonEquals } = require('../../../util/assertHelper');

describe('Where', function () {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
        knex = logger(getKnexForDb(db));

        await dropTables(knex);
        await createUsers(knex);
        await createAccounts(knex);
        await createCompositeKeyTable(knex);
        await createTestTableTwo(knex);
        await createDefaultTable(knex);
        await createDefaultTable(knex, true);
      });

      beforeEach(async () => {
        await knex('accounts').truncate();
        await insertAccounts(knex);
      });

      after(async () => {
        return knex.destroy();
      });

      describe('simple "where" cases', function () {
        it('allows key, value', function () {
          return knex('accounts')
            .where('id', 1)
            .select('first_name', 'last_name')
            .testSql(function (tester) {
              tester(
                ['mysql', 'sqlite3'],
                'select `first_name`, `last_name` from `accounts` where `id` = ?',
                [1],
                [
                  {
                    first_name: 'Test',
                    last_name: 'User',
                  },
                ]
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb'],
                'select "first_name", "last_name" from "accounts" where "id" = ?',
                [1],
                [
                  {
                    first_name: 'Test',
                    last_name: 'User',
                  },
                ]
              );
              tester(
                'mssql',
                'select [first_name], [last_name] from [accounts] where [id] = ?',
                [1],
                [
                  {
                    first_name: 'Test',
                    last_name: 'User',
                  },
                ]
              );
            });
        });

        it('allows key, operator, value', function () {
          return knex('accounts')
            .where('id', 1)
            .select('first_name', 'last_name')
            .testSql(function (tester) {
              tester(
                ['mysql', 'sqlite3'],
                'select `first_name`, `last_name` from `accounts` where `id` = ?',
                [1],
                [
                  {
                    first_name: 'Test',
                    last_name: 'User',
                  },
                ]
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb'],
                'select "first_name", "last_name" from "accounts" where "id" = ?',
                [1],
                [
                  {
                    first_name: 'Test',
                    last_name: 'User',
                  },
                ]
              );
              tester(
                'mssql',
                'select [first_name], [last_name] from [accounts] where [id] = ?',
                [1],
                [
                  {
                    first_name: 'Test',
                    last_name: 'User',
                  },
                ]
              );
            });
        });

        it('allows selecting columns with an array', function () {
          return knex('accounts')
            .where('id', '>', 1)
            .select(['email', 'logins'])
            .testSql(function (tester) {
              tester(
                ['mysql', 'sqlite3'],
                'select `email`, `logins` from `accounts` where `id` > ?',
                [1]
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb'],
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

        it('allows a hash of where attrs', function () {
          return knex('accounts')
            .where({ id: 1 })
            .select('*')
            .testSql(function (tester) {
              tester(
                ['mysql', 'sqlite3'],
                'select * from `accounts` where `id` = ?',
                [1],
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
                  },
                ]
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb'],
                'select * from "accounts" where "id" = ?',
                [1],
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
                  },
                ]
              );
              tester(
                'mssql',
                'select * from [accounts] where [id] = ?',
                [1],
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
                  },
                ]
              );
            });
        });

        it('allows where id: undefined or id: null as a where null clause', function () {
          return knex('accounts')
            .where({ id: null })
            .select('first_name', 'email')
            .testSql(function (tester) {
              tester(
                ['mysql', 'sqlite3'],
                'select `first_name`, `email` from `accounts` where `id` is null',
                [],
                []
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb', 'cockroachdb'],
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

        it('allows where id = 0', function () {
          return knex('accounts')
            .where({ id: 0 })
            .select()
            .testSql(function (tester) {
              tester(
                ['mysql', 'sqlite3'],
                'select * from `accounts` where `id` = ?',
                [0],
                []
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb', 'cockroachdb'],
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

      it('does "orWhere" cases', function () {
        return knex('accounts')
          .where('id', 1)
          .orWhere('id', '>', 2)
          .select('first_name', 'last_name');
      });

      it('does "andWhere" cases', function () {
        return knex('accounts')
          .select('first_name', 'last_name', 'about')
          .where('id', 1)
          .andWhere('email', 'test1@example.com');
      });

      it('takes a function to wrap nested where statements', function () {
        return Promise.all([
          knex('accounts')
            .where(function () {
              this.where('id', 2);
              this.orWhere('id', 3);
            })
            .select('*'),
        ]);
      });

      it('handles "where in" cases', function () {
        return Promise.all([
          knex('accounts').whereIn('id', [1, 2, 3]).select(),
        ]);
      });

      it('handles "or where in" cases', function () {
        return knex('accounts')
          .where('email', 'test1@example.com')
          .orWhereIn('id', [2, 3, 4])
          .select();
      });

      it('handles multi-column "where in" cases', async function () {
        await knex('composite_key_test').insert([
          {
            column_a: 1,
            column_b: 1,
            details: 'One, One, One',
            status: 1,
          },
          {
            column_a: 1,
            column_b: 2,
            details: 'One, Two, Zero',
            status: 0,
          },
          {
            column_a: 2,
            column_b: 2,
            details: 'Two, Two, Zero',
            status: 0,
          },
        ]);

        if (!isMssql(knex)) {
          await knex('composite_key_test')
            .whereIn(
              ['column_a', 'column_b'],
              [
                [1, 1],
                [1, 2],
              ]
            )
            .orderBy('status', 'desc')
            .select()
            .testSql(function (tester) {
              tester(
                'mysql',
                'select * from `composite_key_test` where (`column_a`, `column_b`) in ((?, ?), (?, ?)) order by `status` desc',
                [1, 1, 1, 2],
                [
                  {
                    column_a: 1,
                    column_b: 1,
                    details: 'One, One, One',
                    status: 1,
                  },
                  {
                    column_a: 1,
                    column_b: 2,
                    details: 'One, Two, Zero',
                    status: 0,
                  },
                ]
              );
              tester(
                'sqlite3',
                'select * from `composite_key_test` where (`column_a`, `column_b`) in ( values (?, ?), (?, ?)) order by `status` desc',
                [1, 1, 1, 2],
                [
                  {
                    column_a: 1,
                    column_b: 1,
                    details: 'One, One, One',
                    status: 1,
                  },
                  {
                    column_a: 1,
                    column_b: 2,
                    details: 'One, Two, Zero',
                    status: 0,
                  },
                ]
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb'],
                'select * from "composite_key_test" where ("column_a", "column_b") in ((?, ?), (?, ?)) order by "status" desc',
                [1, 1, 1, 2],
                [
                  {
                    column_a: 1,
                    column_b: 1,
                    details: 'One, One, One',
                    status: 1,
                  },
                  {
                    column_a: 1,
                    column_b: 2,
                    details: 'One, Two, Zero',
                    status: 0,
                  },
                ]
              );
              tester(
                'cockroachdb',
                'select * from "composite_key_test" where ("column_a", "column_b") in ((?, ?), (?, ?)) order by "status" desc',
                [1, 1, 1, 2],
                [
                  {
                    column_a: '1',
                    column_b: '1',
                    details: 'One, One, One',
                    status: 1,
                  },
                  {
                    column_a: '1',
                    column_b: '2',
                    details: 'One, Two, Zero',
                    status: 0,
                  },
                ]
              );
            });
        }
      });

      it('handles multi-column "where in" cases with where', function () {
        if (!isSQLite(knex) && !isMssql(knex)) {
          return knex('composite_key_test')
            .where('status', 1)
            .whereIn(
              ['column_a', 'column_b'],
              [
                [1, 1],
                [1, 2],
              ]
            )
            .select()
            .testSql(function (tester) {
              tester(
                'mysql',
                'select * from `composite_key_test` where `status` = ? and (`column_a`, `column_b`) in ((?, ?), (?, ?))',
                [1, 1, 1, 1, 2],
                [
                  {
                    column_a: 1,
                    column_b: 1,
                    details: 'One, One, One',
                    status: 1,
                  },
                ]
              );
              tester(
                ['pg', 'pgnative', 'pg-redshift', 'oracledb'],
                'select * from "composite_key_test" where "status" = ? and ("column_a", "column_b") in ((?, ?), (?, ?))',
                [1, 1, 1, 1, 2],
                [
                  {
                    column_a: 1,
                    column_b: 1,
                    details: 'One, One, One',
                    status: 1,
                  },
                ]
              );
              tester(
                'cockroachdb',
                'select * from "composite_key_test" where "status" = ? and ("column_a", "column_b") in ((?, ?), (?, ?))',
                [1, 1, 1, 1, 2],
                [
                  {
                    column_a: '1',
                    column_b: '1',
                    details: 'One, One, One',
                    status: 1,
                  },
                ]
              );
            });
        }
      });

      it('handles "where exists"', function () {
        return knex('accounts')
          .whereExists(function () {
            this.select('id').from('test_table_two').where({ id: 1 });
          })
          .select();
      });

      it('handles "where between"', function () {
        return knex('accounts').whereBetween('id', [1, 100]).select();
      });

      it('handles "or where between"', function () {
        return knex('accounts')
          .whereBetween('id', [1, 100])
          .orWhereBetween('id', [200, 300])
          .select();
      });

      it('does where(raw)', function () {
        if (isOracle(knex)) {
          // special case for oracle
          return knex('accounts')
            .whereExists(function () {
              this.select(knex.raw(1))
                .from('test_table_two')
                .where(
                  knex.raw('"test_table_two"."account_id" = "accounts"."id"')
                );
            })
            .select();
        } else {
          return knex('accounts')
            .whereExists(function () {
              this.select(knex.raw(1))
                .from('test_table_two')
                .where(knex.raw('test_table_two.account_id = accounts.id'));
            })
            .select();
        }
      });

      it('does sub-selects', function () {
        return knex('accounts')
          .whereIn('id', function () {
            this.select('account_id').from('test_table_two').where('status', 1);
          })
          .select('first_name', 'last_name');
      });

      it('supports the <> operator', function () {
        return knex('accounts').where('id', '<>', 2).select('email', 'logins');
      });

      it('Allows for knex.Raw passed to the `where` clause', function () {
        if (isOracle(knex)) {
          return knex('accounts')
            .where(knex.raw('"id" = 2'))
            .select('email', 'logins');
        } else {
          return knex('accounts')
            .where(knex.raw('id = 2'))
            .select('email', 'logins');
        }
      });

      describe('where like', function () {
        beforeEach(function () {
          if (!(isPostgreSQL(knex) || isMssql(knex) || isMysql(knex))) {
            return this.skip();
          }
        });

        it('finds data using whereILike', async () => {
          const result = await knex('accounts')
            .select('*')
            .whereILike('email', 'test1%');
          expect(result[0].email).to.equal('test1@example.com');
        });

        it('finds data using whereILike when different case sensitivity', async () => {
          const result = await knex('accounts').whereILike('email', 'TEST1%');
          expect(result[0].email).to.equal('test1@example.com');
        });

        it('finds data using whereLike', async () => {
          const result = await knex('accounts')
            .select('*')
            .whereLike('email', 'test1%');
          expect(result[0].email).to.equal('test1@example.com');
        });

        it('finds data using orWhereLike', async () => {
          const result = await knex('accounts')
            .select('*')
            .whereLike('email', 'test1%')
            .orWhereLike('email', 'test2%');
          expect(result[0].email).to.equal('test1@example.com');
          expect(result[1].email).to.equal('test2@example.com');
        });

        it('finds data using andWhereLike', async () => {
          const result = await knex('accounts')
            .select('*')
            .whereLike('first_name', 'Te%')
            .andWhereLike('email', '%example.com');
          expect(result.length).to.equal(8);
          expect(result[0].email).to.equal('test1@example.com');
          expect(result[1].email).to.equal('test2@example.com');
          expect(result[2].email).to.equal('test3@example.com');
          expect(result[3].email).to.equal('test4@example.com');
          expect(result[4].email).to.equal('test5@example.com');
          expect(result[5].email).to.equal('test6@example.com');
          expect(result[6].email).to.equal('test7@example.com');
          expect(result[7].email).to.equal('test8@example.com');
        });

        it('finds data using orWhereILike', async () => {
          const result = await knex('accounts')
            .select('*')
            .whereILike('email', 'TEST1%')
            .orWhereILike('email', 'TeSt2%');
          expect(result[0].email).to.equal('test1@example.com');
          expect(result[1].email).to.equal('test2@example.com');
        });

        it('finds data using andWhereILike', async () => {
          const result = await knex('accounts')
            .select('*')
            .whereILike('first_name', 'te%')
            .andWhereILike('email', '%examPle.COm');
          expect(result.length).to.equal(8);
          expect(result[0].email).to.equal('test1@example.com');
          expect(result[1].email).to.equal('test2@example.com');
          expect(result[2].email).to.equal('test3@example.com');
          expect(result[3].email).to.equal('test4@example.com');
          expect(result[4].email).to.equal('test5@example.com');
          expect(result[5].email).to.equal('test6@example.com');
          expect(result[6].email).to.equal('test7@example.com');
          expect(result[7].email).to.equal('test8@example.com');
        });

        it("doesn't find data using whereLike when different case sensitivity", async () => {
          const result = await knex('accounts').whereLike('email', 'Test1%');
          expect(result).to.deep.equal([]);
        });
      });

      it('Retains array bindings, #228', function () {
        const raw = knex.raw(
          'select * from table t where t.id = ANY( ?::int[] )',
          [[1, 2, 3]]
        );
        const raw2 = knex.raw('select "stored_procedure"(?, ?, ?)', [
          1,
          2,
          ['a', 'b', 'c'],
        ]);
        const expected1 = [[1, 2, 3]];
        const expected2 = [1, 2, ['a', 'b', 'c']];
        expect(raw.toSQL().bindings).to.eql(
          knex.client.prepBindings(expected1)
        );
        expect(raw2.toSQL().bindings).to.eql(
          knex.client.prepBindings(expected2)
        );
        //Also expect raw's bindings to not have been modified by calling .toSQL() (preserving original bindings)
        expect(raw.bindings).to.eql(expected1);
        expect(raw2.bindings).to.eql(expected2);
      });

      describe('json wheres', () => {
        before(async () => {
          await knex.schema.dropTableIfExists('cities');
          await createCities(knex);
        });

        beforeEach(async () => {
          await knex('cities').truncate();
          await insertCities(knex);
        });

        it('where json object', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonObject('descriptions', {
              type: 'bigcity',
              short: 'beautiful city',
              long: 'beautiful and dirty city',
            });
          expect(result[0]).to.eql({
            name: 'Paris',
          });
        });

        it('where json object with string object', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonObject(
              'descriptions',
              `{
              "type": "bigcity",
              "short": "beautiful city",
              "long": "beautiful and dirty city"
            }`
            );
          expect(result[0]).to.eql({
            name: 'Paris',
          });
        });

        it('where not json object', async () => {
          const result = await knex('cities')
            .select('name')
            .whereNotJsonObject('descriptions', {
              type: 'bigcity',
              short: 'beautiful city',
              long: 'beautiful and dirty city',
            });
          expect(result.length).to.equal(2);
          assertJsonEquals(result, [
            {
              name: 'Milan',
            },
            {
              name: 'Oslo',
            },
          ]);
        });

        it('where json path greater than numeric', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonPath('statistics', '$.roads.min', '>', 1000);
          expect(result[0]).to.eql({
            name: 'Paris',
          });
        });

        it('where json path equal numeric', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonPath('statistics', '$.roads.min', '=', 1455);
          expect(result[0]).to.eql({
            name: 'Milan',
          });
        });

        it('where and or where json path equal numeric', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonPath('statistics', '$.roads.min', '=', 1455)
            .orWhereJsonPath('statistics', '$.roads.min', '=', 1655);
          expect(result[0]).to.eql({
            name: 'Milan',
          });
        });

        it('where json path equal string starting with number', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonPath(
              'statistics',
              '$.statisticId',
              '=',
              '6qITEHRUNJ4bdAmA0lk82'
            );
          expect(result[0]).to.eql({
            name: 'Paris',
          });
        });

        it('where multiple json path', async () => {
          const result = await knex('cities')
            .select('name')
            .whereJsonPath('statistics', '$.roads.min', '<', 2000)
            .andWhereJsonPath('temperature', '$.desc', '=', 'cold');
          expect(result.length).to.equal(1);
          assertJsonEquals(result, [
            {
              name: 'Paris',
            },
          ]);
        });

        it('where json superset of', async function () {
          if (!(isPostgreSQL(knex) || isMysql(knex))) {
            this.skip();
          }
          const result = await knex('cities')
            .select('name')
            // where descriptions json object contains type : 'bigcity'
            .whereJsonSupersetOf('descriptions', {
              type: 'bigcity',
            });
          expect(result.length).to.equal(2);
          assertJsonEquals(result, [
            {
              name: 'Paris',
            },
            {
              name: 'Milan',
            },
          ]);
        });

        it('where json superset of with string', async function () {
          if (!(isPostgreSQL(knex) || isMysql(knex))) {
            this.skip();
          }
          const result = await knex('cities')
            .select('name')
            .whereJsonSupersetOf('descriptions', '{"type": "bigcity"}');
          expect(result.length).to.equal(2);
          assertJsonEquals(result, [
            {
              name: 'Paris',
            },
            {
              name: 'Milan',
            },
          ]);
        });

        it('where json subset of', async function () {
          if (!(isPostgreSQL(knex) || isMysql(knex))) {
            this.skip();
          }
          const result = await knex('cities')
            .select('name')
            // where temperature json object is included in given object
            .whereJsonSubsetOf('temperature', {
              desc: 'cold',
              desc2: 'very cold',
            });
          expect(result.length).to.equal(1);
          assertJsonEquals(result, [
            {
              name: 'Paris', // contains only desc: 'cold' but it's matched
            },
          ]);
        });
      });
    });
  });
});

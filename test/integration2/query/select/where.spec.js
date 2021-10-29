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
} = require('../../../util/tableCreatorHelper');
const { insertAccounts } = require('../../../util/dataInsertHelper');

const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');

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
                'pg',
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
                'pgnative',
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
                'pg-redshift',
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
                'oracledb',
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
                'pg',
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
                'pgnative',
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
                'pg-redshift',
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
                'oracledb',
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
    });
  });
});

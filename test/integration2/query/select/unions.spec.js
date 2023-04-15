'use strict';

const expect = require('chai').expect;
const {
  isMssql,
  isOracle,
  isPgBased,
  isSQLite,
  isPostgreSQL,
  isMysql,
} = require('../../../util/db-helpers');
const { assertNumberArray } = require('../../../util/assertHelper');
const {
  dropTables,
  createUsers,
  createAccounts,
  createCompositeKeyTable,
  createTestTableTwo,
  createDefaultTable,
} = require('../../../util/tableCreatorHelper');
const { insertAccounts } = require('../../../util/dataInsertHelper');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');

describe('All Union functions [.union(), .unionAll(), .intersect(), .except()]', function () {
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
        await knex.schema.dropTableIfExists('union_raw_test');
        await knex.schema.createTable('union_raw_test', (table) => {
          table.bigIncrements('id');
          table.string('last_name');
          table.string('phone');
        });
      });

      beforeEach(async () => {
        await knex('accounts').truncate();
        await knex('union_raw_test').truncate();
        await insertAccounts(knex);
      });

      after(async () => {
        await knex.destroy();
      });

      describe('.union()', () => {
        before(async function () {
          await knex.schema.createTable('union_test', function (t) {
            t.integer('id');
            t.integer('test_col_1');
            t.integer('test_col_2');
            t.integer('test_col_3');
          });
        });

        beforeEach(async function () {
          await knex('union_test').insert([
            {
              id: 1,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 1,
            },
            {
              id: 2,
              test_col_1: 2,
              test_col_2: 3,
              test_col_3: 1,
            },
            {
              id: 3,
              test_col_1: 2,
              test_col_2: 3,
              test_col_3: 2,
            },
            {
              id: 4,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 2,
            },
            {
              id: 5,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 1,
            },
          ]);
        });

        after(async function () {
          await knex.schema.dropTable('union_test');
        });

        it('handles unions with a callback', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union(function () {
              this.select('*').from('union_test').where('test_col_2', 2);
            })
            .then(function (result) {
              expect(result.length).to.equal(3);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 4, 5]
              );
            });
        });

        it('handles unions with an array of callbacks', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union([
              function () {
                this.select('*').from('union_test').where('test_col_2', 2);
              },
              function () {
                this.select('*').from('union_test').where('test_col_3', 1);
              },
            ])
            .then(function (result) {
              expect(result.length).to.equal(4);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 2, 4, 5]
              );
            });
        });

        it('handles unions with a list of callbacks', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }

          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union(
              function () {
                this.select('*').from('union_test').where('test_col_2', 2);
              },
              function () {
                this.select('*').from('union_test').where('test_col_3', 1);
              }
            )
            .then(function (result) {
              expect(result.length).to.equal(4);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 2, 4, 5]
              );
            });
        });

        it('handles unions with an array of builders', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union([
              knex.select('*').from('union_test').where('test_col_2', 2),
              knex.select('*').from('union_test').where('test_col_3', 1),
            ])
            .then(function (result) {
              expect(result.length).to.equal(4);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 2, 4, 5]
              );
            });
        });

        it('handles unions with a list of builders', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union(
              knex.select('*').from('union_test').where('test_col_2', 2),
              knex.select('*').from('union_test').where('test_col_3', 1)
            )
            .then(function (result) {
              expect(result.length).to.equal(4);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 2, 4, 5]
              );
            });
        });

        it('handles unions with a raw query', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 2)
            .union(
              knex.raw('select * from ?? where ?? = ?', [
                'union_test',
                'test_col_2',
                3,
              ])
            )
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [2, 3]
              );
            });
        });

        it('handles unions with an array raw queries', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union([
              knex.raw('select * from ?? where ?? = ?', [
                'union_test',
                'test_col_2',
                2,
              ]),
              knex.raw('select * from ?? where ?? = ?', [
                'union_test',
                'test_col_3',
                1,
              ]),
            ])
            .then(function (result) {
              expect(result.length).to.equal(4);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 2, 4, 5]
              );
            });
        });

        it('handles unions with a list of raw queries', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('union_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .union(
              knex.raw('select * from ?? where ?? = ?', [
                'union_test',
                'test_col_2',
                2,
              ]),
              knex.raw('select * from ?? where ?? = ?', [
                'union_test',
                'test_col_3',
                1,
              ])
            )
            .then(function (result) {
              expect(result.length).to.equal(4);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 2, 4, 5]
              );
            });
        });
      });

      describe('.unionAll()', () => {
        it('handles nested unions with limit', async function () {
          if (!isPostgreSQL(knex)) {
            return this.skip();
          }
          const results = await knex('accounts')
            .select('last_name')
            .unionAll(function () {
              this.select('last_name').from('accounts');
            })
            .first();
          expect(results).to.eql({
            last_name: 'User',
          });
        });

        it('nested unions with group by in subqueries and limit and orderby', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex
            .select('last_name')
            .unionAll(
              [
                knex.select('last_name').from('accounts').groupBy('last_name'),
                knex.select('last_name').from('accounts').groupBy('last_name'),
              ],
              true
            )
            .limit(5)
            .orderBy('last_name')
            .testSql(function (tester) {
              tester(
                'pg',
                '(select "last_name" from "accounts" group by "last_name") union all (select "last_name" from "accounts" group by "last_name") order by "last_name" asc limit ?',
                [5],
                [
                  { last_name: 'User' },
                  { last_name: 'User' },
                  { last_name: 'User2' },
                  { last_name: 'User2' },
                ]
              );
              tester(
                'mysql',
                '(select `last_name` from `accounts` group by `last_name`) union all (select `last_name` from `accounts` group by `last_name`) order by `last_name` asc limit ?',
                [5],
                [
                  { last_name: 'User' },
                  { last_name: 'User' },
                  { last_name: 'User2' },
                  { last_name: 'User2' },
                ]
              );
              tester(
                'mysql2',
                '(select `last_name` from `accounts` group by `last_name`) union all (select `last_name` from `accounts` group by `last_name`) order by `last_name` asc limit ?',
                [5],
                [
                  { last_name: 'User' },
                  { last_name: 'User' },
                  { last_name: 'User2' },
                  { last_name: 'User2' },
                ]
              );
            });
        });

        it('nested unions with first', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex
            .unionAll(
              function () {
                this.select('last_name').from('accounts');
              },
              function () {
                this.select('last_name').from('accounts');
              },
              true
            )
            .first()
            .testSql(function (tester) {
              tester(
                'pg',
                '(select "last_name" from "accounts") union all (select "last_name" from "accounts") limit ?',
                [1],
                {
                  last_name: 'User',
                }
              );
              tester(
                'mysql',
                '(select `last_name` from `accounts`) union all (select `last_name` from `accounts`) limit ?',
                [1],
                {
                  last_name: 'User',
                }
              );
              tester(
                'mysql2',
                '(select `last_name` from `accounts`) union all (select `last_name` from `accounts`) limit ?',
                [1],
                {
                  last_name: 'User',
                }
              );
            });
        });

        it('nested unions with order by and limit', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex
            .unionAll(
              function () {
                this.select('last_name').from('accounts');
              },
              function () {
                this.select('last_name').from('accounts');
              },
              true
            )
            .orderBy('last_name')
            .limit(2)
            .testSql(function (tester) {
              tester(
                'pg',
                '(select "last_name" from "accounts") union all (select "last_name" from "accounts") order by "last_name" asc limit ?',
                [2],
                [
                  {
                    last_name: 'User',
                  },
                  {
                    last_name: 'User',
                  },
                ]
              );
              tester(
                'mysql',
                '(select `last_name` from `accounts`) union all (select `last_name` from `accounts`) order by `last_name` asc limit ?',
                [2],
                [
                  {
                    last_name: 'User',
                  },
                  {
                    last_name: 'User',
                  },
                ]
              );
              tester(
                'mysql2',
                '(select `last_name` from `accounts`) union all (select `last_name` from `accounts`) order by `last_name` asc limit ?',
                [2],
                [
                  {
                    last_name: 'User',
                  },
                  {
                    last_name: 'User',
                  },
                ]
              );
            });
        });

        it('nested unions with having and groupby in subqueries', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex
            .unionAll(
              function () {
                this.select('last_name')
                  .from('accounts')
                  .having('last_name', '!=', 'User')
                  .groupBy('last_name');
              },
              function () {
                this.select('last_name')
                  .from('accounts')
                  .having('last_name', '!=', 'User')
                  .groupBy('last_name');
              },
              true
            )
            .testSql(function (tester) {
              tester(
                'pg',
                '(select "last_name" from "accounts" group by "last_name" having "last_name" != ?) union all (select "last_name" from "accounts" group by "last_name" having "last_name" != ?)',
                ['User', 'User'],
                [{ last_name: 'User2' }, { last_name: 'User2' }]
              );
              tester(
                'mysql',
                '(select `last_name` from `accounts` group by `last_name` having `last_name` != ?) union all (select `last_name` from `accounts` group by `last_name` having `last_name` != ?)',
                ['User', 'User'],
                [{ last_name: 'User2' }, { last_name: 'User2' }]
              );
              tester(
                'mysql2',
                '(select `last_name` from `accounts` group by `last_name` having `last_name` != ?) union all (select `last_name` from `accounts` group by `last_name` having `last_name` != ?)',
                ['User', 'User'],
                [{ last_name: 'User2' }, { last_name: 'User2' }]
              );
            });
        });

        it('nested unions all with order by in subqueries and limit', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex
            .unionAll(
              function () {
                this.select('last_name').from('accounts').orderBy('last_name');
              },
              function () {
                this.select('last_name').from('accounts').orderBy('last_name');
              },
              true
            )
            .limit(2)
            .testSql(function (tester) {
              tester(
                'pg',
                '(select "last_name" from "accounts" order by "last_name" asc) union all (select "last_name" from "accounts" order by "last_name" asc) limit ?',
                [2],
                [{ last_name: 'User' }, { last_name: 'User' }]
              );
              tester(
                'mysql',
                '(select `last_name` from `accounts` order by `last_name` asc) union all (select `last_name` from `accounts` order by `last_name` asc) limit ?',
                [2],
                [{ last_name: 'User' }, { last_name: 'User' }]
              );
              tester(
                'mysql2',
                '(select `last_name` from `accounts` order by `last_name` asc) union all (select `last_name` from `accounts` order by `last_name` asc) limit ?',
                [2],
                [{ last_name: 'User' }, { last_name: 'User' }]
              );
            });
        });

        it('nested unions all with limit in each subqueries', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex
            .unionAll(
              [
                knex.select('last_name').from('accounts').limit(1),
                knex.select('last_name').from('accounts').limit(1),
              ],
              true
            )
            .testSql(function (tester) {
              tester(
                'pg',
                '(select "last_name" from "accounts" limit ?) union all (select "last_name" from "accounts" limit ?)',
                [1, 1],
                [
                  {
                    last_name: 'User',
                  },
                  {
                    last_name: 'User',
                  },
                ]
              );
              tester(
                'mysql',
                '(select `last_name` from `accounts` limit ?) union all (select `last_name` from `accounts` limit ?)',
                [1, 1],
                [
                  {
                    last_name: 'User',
                  },
                  {
                    last_name: 'User',
                  },
                ]
              );
              tester(
                'mysql2',
                '(select `last_name` from `accounts` limit ?) union all (select `last_name` from `accounts` limit ?)',
                [1, 1],
                [
                  {
                    last_name: 'User',
                  },
                  {
                    last_name: 'User',
                  },
                ]
              );
            });
        });

        it('nested unions with group by and where in subqueries and limit', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('accounts')
            .count('logins')
            .limit(1)
            .unionAll(function () {
              this.count('logins')
                .from('accounts')
                .groupBy('last_name')
                .where('logins', '>', '1');
            }, true)
            .testSql(function (tester) {
              tester(
                'pg',
                '(select count("logins") from "accounts") union all (select count("logins") from "accounts" where "logins" > ? group by "last_name") limit ?',
                ['1', 1],
                [{ count: '8' }]
              );
              tester(
                'mysql',
                '(select count(`logins`) from `accounts`) union all (select count(`logins`) from `accounts` where `logins` > ? group by `last_name`) limit ?',
                ['1', 1],
                [{ 'count(`logins`)': 8 }]
              );
              tester(
                'mysql2',
                '(select count(`logins`) from `accounts`) union all (select count(`logins`) from `accounts` where `logins` > ? group by `last_name`) limit ?',
                ['1', 1],
                [{ 'count(`logins`)': 8 }]
              );
            });
        });
      });

      describe('.intersect()', function () {
        before(async function () {
          await knex.schema.createTable('intersect_test', function (t) {
            t.integer('id');
            t.integer('test_col_1');
            t.integer('test_col_2');
            t.integer('test_col_3');
          });
        });

        beforeEach(async function () {
          await knex('intersect_test').insert([
            {
              id: 1,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 1,
            },
            {
              id: 2,
              test_col_1: 2,
              test_col_2: 3,
              test_col_3: 1,
            },
            {
              id: 3,
              test_col_1: 2,
              test_col_2: 3,
              test_col_3: 2,
            },
            {
              id: 4,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 2,
            },
            {
              id: 5,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 1,
            },
          ]);
        });

        after(async function () {
          await knex.schema.dropTable('intersect_test');
        });

        it('handles intersects with a callback', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect(function () {
              this.select('*').from('intersect_test').where('test_col_2', 2);
            })
            .then(function (result) {
              expect(result.length).to.equal(3);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 4, 5]
              );
            });
        });

        it('handles intersects with an array of callbacks', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect([
              function () {
                this.select('*').from('intersect_test').where('test_col_2', 2);
              },
              function () {
                this.select('*').from('intersect_test').where('test_col_3', 1);
              },
            ])
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 5]
              );
            });
        });

        it('handles intersects with a list of callbacks', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect(
              function () {
                this.select('*').from('intersect_test').where('test_col_2', 2);
              },
              function () {
                this.select('*').from('intersect_test').where('test_col_3', 1);
              }
            )
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 5]
              );
            });
        });

        it('handles intersects with an array of builders', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect([
              knex.select('*').from('intersect_test').where('test_col_2', 2),
              knex.select('*').from('intersect_test').where('test_col_3', 1),
            ])
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 5]
              );
            });
        });

        it('handles intersects with a list of builders', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect(
              knex.select('*').from('intersect_test').where('test_col_2', 2),
              knex.select('*').from('intersect_test').where('test_col_3', 1)
            )
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 5]
              );
            });
        });

        it('handles intersects with a raw query', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 2)
            .intersect(
              knex.raw('select * from ?? where ?? = ?', [
                'intersect_test',
                'test_col_2',
                3,
              ])
            )
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [2, 3]
              );
            });
        });

        it('handles intersects with an array raw queries', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect([
              knex.raw('select * from ?? where ?? = ?', [
                'intersect_test',
                'test_col_2',
                2,
              ]),
              knex.raw('select * from ?? where ?? = ?', [
                'intersect_test',
                'test_col_3',
                1,
              ]),
            ])
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 5]
              );
            });
        });

        it('handles intersects with a list of raw queries', async function () {
          if (
            !isPgBased(knex) &&
            !isMssql(knex) &&
            !isOracle(knex) &&
            !isSQLite(knex)
          ) {
            return this.skip();
          }

          await knex('intersect_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .intersect(
              knex.raw('select * from ?? where ?? = ?', [
                'intersect_test',
                'test_col_2',
                2,
              ]),
              knex.raw('select * from ?? where ?? = ?', [
                'intersect_test',
                'test_col_3',
                1,
              ])
            )
            .then(function (result) {
              expect(result.length).to.equal(2);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [1, 5]
              );
            });
        });
      });

      describe('.except()', function () {
        before(async function () {
          await knex.schema.createTable('except_test', function (t) {
            t.integer('id');
            t.integer('test_col_1');
            t.integer('test_col_2');
            t.integer('test_col_3');
          });
        });

        beforeEach(async function () {
          await knex('except_test').insert([
            {
              id: 1,
              test_col_1: 1,
              test_col_2: 2,
              test_col_3: 1,
            },
            {
              id: 2,
              test_col_1: 2,
              test_col_2: 3,
              test_col_3: 1,
            },
            {
              id: 3,
              test_col_1: 2,
              test_col_2: 3,
              test_col_3: 2,
            },
            {
              id: 4,
              test_col_1: 2,
              test_col_2: 2,
              test_col_3: 2,
            },
            {
              id: 5,
              test_col_1: 1,
              test_col_2: 3,
              test_col_3: 3,
            },
          ]);
        });

        after(async function () {
          await knex.schema.dropTable('except_test');
        });

        it('handles excepts with a callback', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except(function () {
              this.select('*').from('except_test').where('test_col_2', 2);
            })
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [5]
              );
            });
        });

        it('handles excepts with an array of callbacks', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except([
              function () {
                this.select('*').from('except_test').where('test_col_2', 2);
              },
              function () {
                this.select('*').from('except_test').where('test_col_3', 1);
              },
            ])
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [5]
              );
            });
        });

        it('handles excepts with a list of callbacks', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }

          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except(
              function () {
                this.select('*').from('except_test').where('test_col_2', 2);
              },
              function () {
                this.select('*').from('except_test').where('test_col_3', 1);
              }
            )
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [5]
              );
            });
        });

        it('handles excepts with an array of builders', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except([
              knex.select('*').from('except_test').where('test_col_2', 2),
              knex.select('*').from('except_test').where('test_col_3', 1),
            ])
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [5]
              );
            });
        });

        it('handles excepts with a list of builders', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except(
              knex.select('*').from('except_test').where('test_col_2', 2),
              knex.select('*').from('except_test').where('test_col_3', 1)
            )
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [5]
              );
            });
        });

        it('handles excepts with a raw query', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 2)
            .except(
              knex.raw('select * from ?? where ?? = ?', [
                'except_test',
                'test_col_2',
                3,
              ])
            )
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [4]
              );
            });
        });

        it('handles excepts with an array raw queries', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except([
              knex.raw('select * from ?? where ?? = ?', [
                'except_test',
                'test_col_2',
                2,
              ]),
              knex.raw('select * from ?? where ?? = ?', [
                'except_test',
                'test_col_3',
                1,
              ]),
            ])
            .then(function (result) {
              expect(result.length).to.equal(1);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                [5]
              );
            });
        });

        it('handles excepts with a list of raw queries', async function () {
          if (!isPostgreSQL(knex) && !isMysql(knex)) {
            return this.skip();
          }
          await knex('except_test')
            .select('*')
            .where('test_col_1', '=', 1)
            .except(
              knex.raw('select * from ?? where ?? = ?', [
                'except_test',
                'test_col_2',
                2,
              ]),
              knex.raw('select * from ?? where ?? = ?', [
                'except_test',
                'test_col_3',
                3,
              ])
            )
            .then(function (result) {
              expect(result.length).to.equal(0);
              assertNumberArray(
                knex,
                result.map((r) => r.id),
                []
              );
            });
        });
      });
    });
  });
});

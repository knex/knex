'use strict';

const { expect } = require('chai');

const assert = require('assert');
const Runner = require('../../../../lib/execution/runner');

const {
  isMysql,
  isPostgreSQL,
  isPgNative,
  isMssql,
  isSQLite,
  isOracle,
  isPgBased,
  isCockroachDB,
} = require('../../../util/db-helpers');
const {
  createUsers,
  createAccounts,
  createCompositeKeyTable,
  createTestTableTwo,
  createCities,
  dropTables,
  createDefaultTable,
  createParentAndChildTables,
} = require('../../../util/tableCreatorHelper');
const {
  insertAccounts,
  insertCities,
} = require('../../../util/dataInsertHelper');
const {
  assertNumberArrayStrict,
  assertJsonEquals,
  assertNumber,
} = require('../../../util/assertHelper');
const {
  getAllDbs,
  getKnexForDb,
} = require('../../util/knex-instance-provider');
const logger = require('../../../integration/logger');

describe('Selects', function () {
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
        // ToDo we can do this after other tests are fixed
        // await dropTables(knex);
      });

      it('runs with no conditions', async () => {
        await knex('accounts').select();
      });

      it('returns an array of a single column with `pluck`', async () => {
        await knex
          .pluck('id')
          .orderBy('id')
          .from('accounts')
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `id` from `accounts` order by `id` asc',
              [],
              [1, 2, 3, 4, 5, 6, 7, 8]
            );
            tester(
              'pg',
              'select "id" from "accounts" order by "id" asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
            tester(
              'pgnative',
              'select "id" from "accounts" order by "id" asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
            tester(
              'pg-redshift',
              'select "id" from "accounts" order by "id" asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
            tester(
              'sqlite3',
              'select `id` from `accounts` order by `id` asc',
              [],
              [1, 2, 3, 4, 5, 6, 7, 8]
            );
            tester(
              'oracledb',
              'select "id" from "accounts" order by "id" asc',
              [],
              [1, 2, 3, 4, 5, 6, 7, 8]
            );
            tester(
              'mssql',
              'select [id] from [accounts] order by [id] asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
          });
      });

      it('can pluck a qualified column name, #1619', async () => {
        await knex
          .pluck('accounts.id')
          .from('accounts')
          .orderBy('accounts.id')
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `accounts`.`id` from `accounts` order by `accounts`.`id` asc',
              [],
              [1, 2, 3, 4, 5, 6, 7, 8]
            );
            tester(
              'pg',
              'select "accounts"."id" from "accounts" order by "accounts"."id" asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
            tester(
              'pgnative',
              'select "accounts"."id" from "accounts" order by "accounts"."id" asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
            tester(
              'pg-redshift',
              'select "accounts"."id" from "accounts" order by "accounts"."id" asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
            tester(
              'sqlite3',
              'select `accounts`.`id` from `accounts` order by `accounts`.`id` asc',
              [],
              [1, 2, 3, 4, 5, 6, 7, 8]
            );
            tester(
              'oracledb',
              'select "accounts"."id" from "accounts" order by "accounts"."id" asc',
              [],
              [1, 2, 3, 4, 5, 6, 7, 8]
            );
            tester(
              'mssql',
              'select [accounts].[id] from [accounts] order by [accounts].[id] asc',
              [],
              ['1', '2', '3', '4', '5', '6', '7', '8']
            );
          });
      });

      it('starts selecting at offset', async () => {
        await knex
          .pluck('id')
          .orderBy('id')
          .from('accounts')
          .offset(2)
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `id` from `accounts` order by `id` asc limit 18446744073709551615 offset ?',
              [2],
              [3, 4, 5, 6, 7, 8]
            );
            tester(
              'pg',
              'select "id" from "accounts" order by "id" asc offset ?',
              [2],
              ['3', '4', '5', '6', '7', '8']
            );
            tester(
              'pgnative',
              'select "id" from "accounts" order by "id" asc offset ?',
              [2],
              ['3', '4', '5', '6', '7', '8']
            );
            tester(
              'pg-redshift',
              'select "id" from "accounts" order by "id" asc offset ?',
              [2],
              ['3', '4', '5', '6', '7', '8']
            );
            tester(
              'sqlite3',
              'select `id` from `accounts` order by `id` asc limit ? offset ?',
              [-1, 2],
              [3, 4, 5, 6, 7, 8]
            );
            tester(
              'oracledb',
              'select * from (select row_.*, ROWNUM rownum_ from (select "id" from "accounts" order by "id" asc) row_ where rownum <= ?) where rownum_ > ?',
              [10000000000002, 2],
              [3, 4, 5, 6, 7, 8]
            );
            tester(
              'mssql',
              'select [id] from [accounts] order by [id] asc offset ? rows',
              [2],
              ['3', '4', '5', '6', '7', '8']
            );
          });
      });

      it('#4335 - should throw an error when negative offset provided', function (ok) {
        try {
          knex.from('accounts').limit(20).offset(-20);
          throw new Error('no error was thrown for negative offset!');
        } catch (error) {
          if (
            error.message ===
            'A non-negative integer must be provided to offset.'
          ) {
            ok();
          } else {
            throw error;
          }
        }
      });

      it('#4199 - adheres to hint comments', async function () {
        const expectedErrors = {
          mysql: {
            code: 'ER_QUERY_TIMEOUT',
            errno: 3024,
            sqlMessage:
              'Query execution was interrupted, maximum statement execution time exceeded',
          },
          mysql2: {
            errno: 3024,
            sqlMessage:
              'Query execution was interrupted, maximum statement execution time exceeded',
          },
        };
        if (!expectedErrors[knex.client.driverName]) {
          return this.skip();
        }
        const baseQuery = knex('accounts')
          .select('id', knex.raw('sleep(0.1)'))
          .limit(2);
        await expect(
          baseQuery.clone()
        ).to.eventually.be.fulfilled.and.to.have.lengthOf(2);
        await expect(
          baseQuery.clone().hintComment('max_execution_time(10)')
        ).to.eventually.be.rejected.and.to.deep.include(
          expectedErrors[knex.client.driverName]
        );
      });

      it('#4199 - ignores invalid hint comments', async function () {
        await knex
          .select('id')
          .orderBy('id')
          .from('accounts')
          .hintComment('invalid()')
          .testSql(function (tester) {
            tester(
              'mysql',
              'select /*+ invalid() */ `id` from `accounts` order by `id` asc',
              [],
              [
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 },
                { id: 6 },
                { id: 7 },
                { id: 8 },
              ]
            );
            tester(
              'pg',
              'select /*+ invalid() */ "id" from "accounts" order by "id" asc',
              [],
              [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '4' },
                { id: '5' },
                { id: '6' },
                { id: '7' },
                { id: '8' },
              ]
            );
            tester(
              'pgnative',
              'select /*+ invalid() */ "id" from "accounts" order by "id" asc',
              [],
              [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '4' },
                { id: '5' },
                { id: '6' },
                { id: '7' },
                { id: '8' },
              ]
            );
            tester(
              'pg-redshift',
              'select /*+ invalid() */ "id" from "accounts" order by "id" asc',
              [],
              [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '4' },
                { id: '5' },
                { id: '6' },
                { id: '7' },
                { id: '8' },
              ]
            );
            tester(
              'sqlite3',
              'select /*+ invalid() */ `id` from `accounts` order by `id` asc',
              [],
              [
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 },
                { id: 6 },
                { id: 7 },
                { id: 8 },
              ]
            );
            tester(
              'oracledb',
              'select /*+ invalid() */ "id" from "accounts" order by "id" asc',
              [],
              [
                { id: 1 },
                { id: 2 },
                { id: 3 },
                { id: 4 },
                { id: 5 },
                { id: 6 },
                { id: 7 },
                { id: 8 },
              ]
            );
            tester(
              'mssql',
              'select /*+ invalid() */ [id] from [accounts] order by [id] asc',
              [],
              [
                { id: '1' },
                { id: '2' },
                { id: '3' },
                { id: '4' },
                { id: '5' },
                { id: '6' },
                { id: '7' },
                { id: '8' },
              ]
            );
          });
      });

      it('returns a single entry with first', async () => {
        await knex
          .first('id', 'first_name')
          .orderBy('id')
          .from('accounts')
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `id`, `first_name` from `accounts` order by `id` asc limit ?',
              [1],
              { id: 1, first_name: 'Test' }
            );
            tester(
              'pg',
              'select "id", "first_name" from "accounts" order by "id" asc limit ?',
              [1],
              { id: '1', first_name: 'Test' }
            );
            tester(
              'pgnative',
              'select "id", "first_name" from "accounts" order by "id" asc limit ?',
              [1],
              { id: '1', first_name: 'Test' }
            );
            tester(
              'pg-redshift',
              'select "id", "first_name" from "accounts" order by "id" asc limit ?',
              [1],
              { id: '1', first_name: 'Test' }
            );
            tester(
              'sqlite3',
              'select `id`, `first_name` from `accounts` order by `id` asc limit ?',
              [1],
              { id: 1, first_name: 'Test' }
            );
            tester(
              'oracledb',
              'select * from (select "id", "first_name" from "accounts" order by "id" asc) where rownum <= ?',
              [1],
              { id: 1, first_name: 'Test' }
            );
            tester(
              'mssql',
              'select top (?) [id], [first_name] from [accounts] order by [id] asc',
              [1],
              { id: '1', first_name: 'Test' }
            );
          });
      });

      it('allows you to stream', async function () {
        if (isPgNative(knex)) {
          return this.skip();
        }
        let count = 0;
        await knex('accounts').stream(function (rowStream) {
          rowStream.on('data', function () {
            count++;
          });
        });
        assert(count === 8, 'Eight rows should have been streamed');
      });

      it('returns a stream if not passed a function', function (done) {
        if (isPgNative(knex)) {
          return this.skip();
        }

        let count = 0;
        const stream = knex('accounts').stream();
        stream.on('data', function () {
          count++;
          if (count === 6) done();
        });
      });

      it('allows you to stream with mysql dialect options', async function () {
        if (!isMysql(knex)) {
          return this.skip();
        }
        const rows = [];
        await knex('accounts')
          .options({
            typeCast(field, next) {
              let val;
              if (field.type === 'VAR_STRING') {
                val = field.string();
                return val == null ? val : val.toUpperCase();
              }
              return next();
            },
          })
          .stream(function (rowStream) {
            rowStream.on('data', function (row) {
              rows.push(row);
            });
          });
        expect(rows).to.have.lengthOf(8);
        rows.forEach((row) => {
          ['first_name', 'last_name', 'email'].forEach((field) =>
            expect(row[field]).to.equal(row[field].toUpperCase())
          );
        });
      });

      it('emits error on the stream, if not passed a function, and connecting fails', function () {
        const expected = new Error();
        const original = Runner.prototype.ensureConnection;
        Runner.prototype.ensureConnection = function () {
          return Promise.reject(expected);
        };

        const restore = () => {
          Runner.prototype.ensureConnection = original;
        };

        const promise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout'));
          }, 5000);

          const stream = knex('accounts').stream();
          stream.on('error', function (actual) {
            clearTimeout(timeout);

            if (actual === expected) {
              resolve();
            } else {
              reject(new Error('Stream emitted unexpected error'));
            }
          });
        });

        promise.then(restore, restore);
        return promise;
      });

      it('emits error on the stream, if not passed a function, and query fails', function (done) {
        const stream = knex('accounts').select('invalid_field').stream();
        stream.on('error', function (err) {
          assert(err instanceof Error);
          done();
        });
      });

      it('emits error if not passed a function and the query has wrong bindings', function (done) {
        const stream = knex('accounts')
          .whereRaw('id = ? and first_name = ?', ['2'])
          .stream();
        stream.on('error', function (err) {
          assert(err instanceof Error);
          done();
        });
      });

      it('properly escapes postgres queries on streaming', async function () {
        const result = await knex('accounts').select();

        let count = 0;
        await knex('accounts')
          .where('id', result[0].id)
          .stream(function (rowStream) {
            rowStream.on('data', function () {
              count++;
            });
          });
        assert(count === 1, 'One row should have been streamed');
      });

      it('throws errors on the asCallback if uncaught in the last block', function (ok) {
        const listeners = process.listeners('uncaughtException');

        process.removeAllListeners('uncaughtException');

        process.on('uncaughtException', function () {
          process.removeAllListeners('uncaughtException');
          for (let i = 0, l = listeners.length; i < l; i++) {
            process.on('uncaughtException', listeners[i]);
          }
          ok();
        });

        knex('accounts')
          .select()
          .asCallback(function () {
            this.undefinedVar.test;
          });
      });

      it('uses "orderBy"', async function () {
        await knex('accounts')
          .pluck('id')
          .orderBy('id', 'desc')
          .testSql(function (tester) {
            tester(
              'oracledb',
              'select "id" from "accounts" order by "id" desc',
              [],
              [8, 7, 6, 5, 4, 3, 2, 1]
            );
            tester(
              'mssql',
              'select [id] from [accounts] order by [id] desc',
              [],
              ['8', '7', '6', '5', '4', '3', '2', '1']
            );
          });
      });

      it('order by with null', async () => {
        await knex.schema
          .dropTableIfExists('OrderByNullTest')
          .createTable('OrderByNullTest', function (table) {
            table.increments('id').primary();
            table.string('null_col').nullable().defaultTo(null);
            // string col to have some order of records with nulls
            table.string('string_col');
          });

        await knex('OrderByNullTest').insert([
          {
            null_col: 'test',
            string_col: 'a',
          },
          {
            null_col: null,
            string_col: 'b',
          },
          {
            null_col: 'test2',
            string_col: 'c',
          },
          {
            null_col: null,
            string_col: 'd',
          },
        ]);

        await knex('OrderByNullTest')
          .pluck('id')
          .orderBy([
            { column: 'null_col', order: 'asc', nulls: 'first' },
            { column: 'string_col' },
          ])
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `id` from `OrderByNullTest` order by (`null_col` is not null) asc, `string_col` asc',
              [],
              [2, 4, 1, 3]
            );
            tester(
              'pg',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls first, "string_col" asc',
              [],
              [2, 4, 1, 3]
            );
            tester(
              'pgnative',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls first, "string_col" asc',
              [],
              [2, 4, 1, 3]
            );
            tester(
              'pg-redshift',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls first, "string_col" asc',
              [],
              ['2', '4', '1', '3']
            );
            tester(
              'sqlite3',
              'select `id` from `OrderByNullTest` order by (`null_col` is not null) asc, `string_col` asc',
              [],
              [2, 4, 1, 3]
            );
            tester(
              'oracledb',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls first, "string_col" asc',
              [],
              [2, 4, 1, 3]
            );
            tester(
              'mssql',
              'select [id] from [OrderByNullTest] order by IIF([null_col] is null,0,1) asc, [string_col] asc',
              [],
              [2, 4, 1, 3]
            );
          });

        await knex('OrderByNullTest')
          .pluck('id')
          .orderBy([
            { column: 'null_col', order: 'asc', nulls: 'last' },
            { column: 'string_col' },
          ])
          .testSql(function (tester) {
            tester(
              'mysql',
              'select `id` from `OrderByNullTest` order by (`null_col` is null) asc, `string_col` asc',
              [],
              [1, 3, 2, 4]
            );
            tester(
              'pg',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls last, "string_col" asc',
              [],
              [1, 3, 2, 4]
            );
            tester(
              'pgnative',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls last, "string_col" asc',
              [],
              [1, 3, 2, 4]
            );
            tester(
              'pg-redshift',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls last, "string_col" asc',
              [],
              ['1', '3', '2', '4']
            );
            tester(
              'sqlite3',
              'select `id` from `OrderByNullTest` order by (`null_col` is null) asc, `string_col` asc',
              [],
              [1, 3, 2, 4]
            );
            tester(
              'oracledb',
              'select "id" from "OrderByNullTest" order by "null_col" asc nulls last, "string_col" asc',
              [],
              [1, 3, 2, 4]
            );
            tester(
              'mssql',
              'select [id] from [OrderByNullTest] order by IIF([null_col] is null,1,0) asc, [string_col] asc',
              [],
              [1, 3, 2, 4]
            );
          });
        await knex.schema.dropTable('OrderByNullTest');
      });

      it('#1276 - Dates NULL should be returned as NULL, not as new Date(null)', async function () {
        await knex.schema
          .dropTableIfExists('DatesTest')
          .createTable('DatesTest', function (table) {
            table.increments('id').primary();
            table.dateTime('dateTimeCol');
            table.timestamp('timeStampCol').nullable().defaultTo(null); // MySQL defaults TIMESTAMP columns to current timestamp
            table.date('dateCol');
            table.time('timeCol');
          });
        await knex('DatesTest').insert([
          {
            dateTimeCol: null,
            timeStampCol: null,
            dateCol: null,
            timeCol: null,
          },
        ]);
        const rows = await knex('DatesTest').select();
        expect(rows[0].dateTimeCol).to.equal(null);
        expect(rows[0].timeStampCol).to.equal(null);
        expect(rows[0].dateCol).to.equal(null);
        expect(rows[0].timeCol).to.equal(null);
      });

      it('has a "distinct" clause', async function () {
        await knex('accounts')
          .select()
          .distinct('email')
          .where('logins', 2)
          .orderBy('email');
        await knex('accounts').distinct('email').select().orderBy('email');
      });

      it('supports "distinct on"', async function () {
        const builder = knex('accounts')
          .select('email', 'logins')
          .distinctOn('id')
          .orderBy('id');
        if (!isPgBased(knex)) {
          let error;
          try {
            await builder;
          } catch (e) {
            error = e;
          }
          expect(error.message).to.eql(
            '.distinctOn() is currently only supported on PostgreSQL'
          );
          return;
        }
        return builder.testSql(function (tester) {
          tester(
            'pg',
            'select distinct on ("id") "email", "logins" from "accounts" order by "id" asc',
            [],
            [
              {
                email: 'test1@example.com',
                logins: 1,
              },
              {
                email: 'test2@example.com',
                logins: 1,
              },
              {
                email: 'test3@example.com',
                logins: 2,
              },
              {
                email: 'test4@example.com',
                logins: 2,
              },
              {
                email: 'test5@example.com',
                logins: 2,
              },
              {
                email: 'test6@example.com',
                logins: 2,
              },
              {
                email: 'test7@example.com',
                logins: 2,
              },
              {
                email: 'test8@example.com',
                logins: 3,
              },
            ]
          );
          tester(
            'pgnative',
            'select distinct on ("id") "email", "logins" from "accounts" order by "id" asc',
            [],
            [
              {
                email: 'test1@example.com',
                logins: 1,
              },
              {
                email: 'test2@example.com',
                logins: 1,
              },
              {
                email: 'test3@example.com',
                logins: 2,
              },
              {
                email: 'test4@example.com',
                logins: 2,
              },
              {
                email: 'test5@example.com',
                logins: 2,
              },
              {
                email: 'test6@example.com',
                logins: 2,
              },
              {
                email: 'test7@example.com',
                logins: 2,
              },
              {
                email: 'test8@example.com',
                logins: 3,
              },
            ]
          );
        });
      });

      it('#1982 - Allow comments in db', async function () {
        await knex('accounts')
          .comment('Integration Comment')
          .select('first_name', 'email')
          .limit(1)
          .then(function (results) {
            expect(results).to.have.length(1);
          });
      });

      describe('recursive CTE support', function () {
        before(async function () {
          await knex.schema.dropTableIfExists('rcte');
          await knex.schema.createTable('rcte', (table) => {
            table.string('name');
            table.string('parentName').nullable();
          });

          // We will check later that this name was found by chaining up parentId using an rCTE.
          await knex('rcte').insert({ name: 'parent' });
          let parentName = 'parent';
          for (const name of ['child', 'grandchild']) {
            await knex('rcte').insert({ name, parentName });
            parentName = name;
          }

          // We will check later that this name is not returned.
          await knex('rcte').insert({ name: 'nope' });
        });
        it('supports recursive CTEs', async function () {
          const results = await knex
            .withRecursive('family', ['name', 'parentName'], (qb) => {
              qb.select('name', 'parentName')
                .from('rcte')
                .where({ name: 'grandchild' })
                .unionAll((qb) =>
                  qb
                    .select('rcte.name', 'rcte.parentName')
                    .from('rcte')
                    .join(
                      'family',
                      knex.ref('family.parentName'),
                      knex.ref('rcte.name')
                    )
                );
            })
            .select('name')
            .from('family');
          const names = results.map(({ name }) => name);

          expect(names).to.have.length(
            'parent child grandchild'.split(' ').length
          );
          expect(names).to.contain('parent');
          expect(names).not.to.contain('nope');
        });
      });

      it('always returns the response object from raw', async function () {
        if (isPostgreSQL(knex)) {
          const resp = await knex.raw('select id from accounts');
          assert(Array.isArray(resp.rows) === true);
        }
      });

      it('properly escapes identifiers, #737', function () {
        if (isPostgreSQL(knex)) {
          const query = knex.select('id","name').from('test').toSQL();
          assert(query.sql === 'select "id"",""name" from "test"');
        }
      });

      it('knex.ref() as column in .select()', async function () {
        const result = await knex('accounts').select();

        const row = await knex('accounts')
          .select([knex.ref('accounts.id').as('userid')])
          .select(['accounts.id'])
          .where(knex.ref('accounts.id'), result[0].id)
          .first();
        expect(String(row.userid)).to.equal(String(result[0].id));
      });

      it.skip('select forUpdate().first() bug in oracle (--------- TODO: FIX)', function () {
        return knex('accounts').where('id', 1).forUpdate().first();
      });

      it('select for update locks selected row', async function () {
        if (isSQLite(knex)) {
          return this.skip();
        }

        await knex('test_default_table').insert({
          string: 'making sure there is a row to lock',
        });
        try {
          await knex.transaction((trx) => {
            // select all from test table and lock
            return trx('test_default_table')
              .forUpdate()
              .then((res) => {
                // try to select stuff from table in other connection should just hang...
                return knex('test_default_table').forUpdate().timeout(100);
              });
          });
        } catch (err) {
          expect(err.message).to.be.contain(
            'Defined query timeout of 100ms exceeded when running query'
          );
          return;
        }
        expect('Second query should have timed out').to.be.false;
      });

      it('select for update locks only some tables, #2834', async function () {
        if (!isPostgreSQL(knex)) {
          return this.skip();
        }

        await knex('test_default_table').insert({
          string: 'making sure there is a row to lock',
          tinyint: 1,
        });
        await knex('test_default_table2').insert({
          string: 'making sure there is a row to lock',
          tinyint: 1,
        });
        try {
          await knex.transaction((trx) => {
            // select all from two test tables and lock only one table
            return trx('test_default_table')
              .innerJoin(
                'test_default_table2',
                'test_default_table.tinyint',
                'test_default_table2.tinyint'
              )
              .forUpdate('test_default_table')
              .then((res) => {
                // try to select stuff from unlocked table should not hang...
                return knex('test_default_table2').forUpdate().timeout(150);
              })
              .then((res) => {
                // try to select stuff from table in other connection should just hang...
                return knex('test_default_table').forUpdate().timeout(100);
              });
          });
        } catch (err) {
          expect(err.message).to.be.contain(
            'Defined query timeout of 100ms exceeded when running query'
          );
          return;
        }
        expect('Second query should have timed out').to.be.false;
      });

      it('select for no key update doesnt stop other transactions from inserting into tables that have a foreign key relationship', async function () {
        if (!isPostgreSQL(knex)) {
          return this.skip();
        }

        await createParentAndChildTables(knex);
        await knex('parent').insert({
          id: 1,
        });
        await knex('child').insert({
          id: 1,
          parent_id: 1,
        });
        await knex.transaction((trx) => {
          // select all from the parent table in the for no key update mode
          return trx('parent')
            .forNoKeyUpdate()
            .then((res) => {
              // Insert should into the child table not hang
              return knex('child')
                .insert({
                  id: 2,
                  parent_id: 1,
                })
                .timeout(150);
            });
        });
      });

      it('select for key share blocks select for update but not select for no key update', async function () {
        if (!isPostgreSQL(knex)) {
          return this.skip();
        }

        await knex('test_default_table').insert({
          string: 'making sure there is a row to lock',
        });
        try {
          await knex.transaction((trx) => {
            // select all from test table and lock
            return trx('test_default_table')
              .forKeyShare()
              .then((res) => {
                // trying to select stuff from table in other connection should succeed with for no key update
                return knex('test_default_table').forNoKeyUpdate().timeout(200);
              })
              .then((res) => {
                // trying to select stuff from table in other connection should hang with for update
                return knex('test_default_table').forUpdate().timeout(100);
              });
          });
        } catch (err) {
          expect(err.message).to.be.contain(
            'Defined query timeout of 100ms exceeded when running query'
          );
          return;
        }
        expect('Second query should have timed out').to.be.false;
      });

      it('select for share prevents updating in other transaction', async function () {
        // Query cancellation is not yet implemented for CockroachDB
        if (isSQLite(knex) || isOracle(knex) || isCockroachDB(knex)) {
          return this.skip();
        }
        await knex('test_default_table').insert({
          string: 'making sure there is a row to lock',
        });
        try {
          await knex.transaction((trx) => {
            // select all from test table and lock
            return trx('test_default_table')
              .forShare()
              .then((res) => {
                // try to update row that was selected for share should just hang...
                return knex.transaction((trx2) => {
                  return trx2('test_default_table')
                    .update({ string: 'foo' })
                    .timeout(100);
                });
              });
          });
        } catch (err) {
          // mssql fails because it tries to rollback at the same time when update query is running
          // hopefully for share really works though...
          if (isMssql(knex)) {
            expect(err.message).to.be.contain(
              "Can't rollback transaction. There is a request in progress"
            );
          } else {
            expect(err.message).to.be.contain(
              'Defined query timeout of 100ms exceeded when running query'
            );
          }
          return;
        }
        expect('Second query should have timed out').to.be.false;
      });

      it('forUpdate().skipLocked() with order by should return the first non-locked row', async function () {
        // Note: this test doesn't work properly on MySQL - see https://bugs.mysql.com/bug.php?id=67745
        if (!isPostgreSQL(knex)) {
          return this.skip();
        }

        const rowName = 'row for skipLocked() test #1';
        await knex('test_default_table').delete().where({ string: rowName });
        await knex('test_default_table').insert([
          { string: rowName, tinyint: 1 },
          { string: rowName, tinyint: 2 },
        ]);

        const res = await knex.transaction(async (trx) => {
          // lock the first row in the test
          await trx('test_default_table')
            .where({ string: rowName })
            .orderBy('tinyint', 'asc')
            .forUpdate()
            .first();

          // try to lock the next available row from outside of the transaction
          return await knex('test_default_table')
            .where({ string: rowName })
            .orderBy('tinyint', 'asc')
            .forUpdate()
            .skipLocked()
            .first();
        });

        // assert that we got the second row because the first one was locked
        expect(res.tinyint).to.equal(2);
      });

      it('forUpdate().skipLocked() should return an empty set when all rows are locked', async function () {
        if (!isPostgreSQL(knex) && !isMysql(knex)) {
          return this.skip();
        }

        const rowName = 'row for skipLocked() test #2';
        await knex('test_default_table').delete().where({ string: rowName });
        await knex('test_default_table').insert([
          { string: rowName, tinyint: 1 },
          { string: rowName, tinyint: 2 },
        ]);

        const res = await knex.transaction(async (trx) => {
          // lock all of the test rows
          await trx('test_default_table')
            .where({ string: rowName })
            .forUpdate();

          // try to aquire the lock on one more row (which isn't available) from another transaction
          return await knex('test_default_table')
            .where({ string: rowName })
            .forUpdate()
            .skipLocked()
            .first();
        });

        expect(res).to.be.undefined;
      });

      it('forUpdate().noWait() should throw an error immediately when a row is locked', async function () {
        if (!isPostgreSQL(knex) && !isMysql(knex)) {
          return this.skip();
        }

        const rowName = 'row for noWait() test';
        await knex('test_default_table').delete().where({ string: rowName });
        await knex('test_default_table').insert([
          { string: rowName, tinyint: 1 },
          { string: rowName, tinyint: 2 },
        ]);

        try {
          await knex.transaction(async (trx) => {
            // select and lock the first row from this test
            // note: MySQL may lock both rows depending on how the results are fetched
            await trx('test_default_table')
              .where({ string: rowName })
              .orderBy('tinyint', 'asc')
              .forUpdate()
              .first();

            // try to lock it again (it should fail here)
            await knex('test_default_table')
              .where({ string: rowName })
              .orderBy('tinyint', 'asc')
              .forUpdate()
              .noWait()
              .first();
          });

          // fail the test if the query finishes with no errors
          throw new Error(
            'The query should have been cancelled when trying to select a locked row with .noWait()'
          );
        } catch (err) {
          // check if we got the correct error from each db
          if (isPostgreSQL(knex)) {
            expect(err.message).to.contain('could not obtain lock on row');
          } else if (isMysql(knex)) {
            // mysql
            expect(err.message).to.contain(
              'lock(s) could not be acquired immediately'
            );
            // mariadb
            // TODO: detect if test is being run on mysql or mariadb to check for the correct error message
            // expect(err.message).to.contain('Lock wait timeout exceeded');
          } else {
            // unsupported database
            throw err;
          }
        }
      });

      it('select from subquery', async function () {
        const result = await knex('accounts').select().orderBy('id');

        const subquery = knex
          .from('accounts')
          .whereBetween('id', [result[0].id, result[2].id]);

        try {
          const rows = await knex.pluck('id').orderBy('id').from(subquery);

          expect(knex.client.driverName).to.oneOf([
            'sqlite3',
            'oracledb',
            'cockroachdb',
            'better-sqlite3',
          ]);

          if (knex.client.driverName !== 'cockroachdb') {
            assertNumberArrayStrict(knex, rows, [
              result[0].id,
              result[1].id,
              result[2].id,
            ]);
          } else {
            expect(rows.length).to.equal(3);
          }
        } catch (err) {
          if (isMysql(knex)) {
            expect(err.errno).to.equal(1248);
          } else if (isPostgreSQL(knex)) {
            expect(err.message).to.contain('must have an alias');
          } else if (isMssql(knex)) {
            expect(err.message).to.contain(
              "Incorrect syntax near the keyword 'order'"
            );
          } else {
            throw err;
          }
        }
      });

      describe('"with" tests', () => {
        beforeEach(async () => {
          await knex.schema
            .dropTableIfExists('with_table')
            .createTable('with_table', function (table) {
              table.integer('test');
            });
          await knex('with_table').insert([{ test: 1 }]);
        });

        it('with', async () => {
          const withQuery = await knex
            .with('t', knex('with_table'))
            .from('t')
            .first();
          assertNumber(knex, withQuery.test, 1);
        });

        it('with materialized', async function () {
          if (!isPostgreSQL(knex) && !isSQLite(knex)) {
            return this.skip();
          }
          const materialized = await knex('t')
            .withMaterialized('t', knex('with_table'))
            .first();
          assertNumber(knex, materialized.test, 1);
        });

        it('with not materialized', async function () {
          if (!isPostgreSQL(knex) && !isSQLite(knex)) {
            return this.skip();
          }
          const notMaterialized = await knex('t')
            .withNotMaterialized('t', knex('with_table'))
            .first();
          assertNumber(knex, notMaterialized.test, 1);
        });
      });

      describe('json selections', () => {
        before(async () => {
          await knex.schema.dropTableIfExists('cities');
          await createCities(knex);
        });

        beforeEach(async () => {
          await knex('cities').truncate();
          await insertCities(knex);
        });

        it('json extract', async () => {
          const res = await knex
            .jsonExtract('descriptions', '$.short', 'shortDescription')
            .from('cities');
          expect(res).to.eql([
            { shortDescription: 'beautiful city' },
            { shortDescription: 'large city' },
            { shortDescription: 'cold city' },
          ]);
        });

        it('json multiple extract', async () => {
          const res = await knex
            .jsonExtract([
              ['descriptions', '$.short', 'shortDescription'],
              ['population', '$.current.value', 'currentPop'],
              ['statistics', '$.roads.min', 'minRoads'],
              ['statistics', '$.hotYears[0]', 'firstHotYear'],
            ])
            .from('cities');
          assertJsonEquals(
            [res[0], res[1]],
            [
              {
                shortDescription: 'beautiful city',
                currentPop: 10000000,
                minRoads: 1234,
                firstHotYear: null,
              },
              {
                shortDescription: 'large city',
                currentPop: 1500000,
                minRoads: 1455,
                firstHotYear: 2012,
              },
            ]
          );
        });

        it('json set', async function () {
          // jsonSet is only for Oracle21c
          if (isOracle(knex)) {
            this.skip();
          }
          const res = await knex
            .jsonSet('population', '$.minMax.max', '999999999', 'maxUpdated')
            .from('cities');
          assertJsonEquals(
            [res[0].maxUpdated, res[1].maxUpdated],
            [
              {
                current: { value: 10000000 },
                minMax: {
                  min: 50000,
                  max: '999999999',
                },
              },
              {
                current: { value: 1500000 },
                minMax: {
                  min: 44000,
                  max: '999999999',
                },
              },
            ]
          );
        });

        it('json insert', async function () {
          // jsonInsert is only for Oracle21c
          if (isOracle(knex)) {
            this.skip();
          }
          const res = await knex
            .jsonInsert('population', '$.year2021', '747477', 'popIn2021Added')
            .from('cities');
          assertJsonEquals(
            [res[0].popIn2021Added, res[1].popIn2021Added],
            [
              {
                current: {
                  value: 10000000,
                },
                minMax: {
                  min: 50000,
                  max: 12000000,
                },
                year2021: '747477',
              },
              {
                current: {
                  value: 1500000,
                },
                minMax: {
                  min: 44000,
                  max: 1200000,
                },
                year2021: '747477',
              },
            ]
          );
        });

        it('json remove', async function () {
          // jsonRemove is only for Oracle21c
          if (isOracle(knex)) {
            this.skip();
          }
          const res = await knex
            .jsonRemove('population', '$.minMax.min', 'popMinRemoved')
            .from('cities');
          assertJsonEquals(
            [res[0].popMinRemoved, res[1].popMinRemoved],
            [
              {
                current: {
                  value: 10000000,
                },
                minMax: {
                  max: 12000000,
                },
              },
              {
                current: {
                  value: 1500000,
                },
                minMax: {
                  max: 1200000,
                },
              },
            ]
          );
        });

        it('json insert then extract', async function () {
          if (isOracle(knex)) {
            this.skip();
          }
          const res = await knex
            .jsonExtract(
              knex.jsonInsert('population', '$.test', '1234'),
              '$.test',
              'insertExtract'
            )
            .from('cities');
          assertJsonEquals(
            [res[0], res[1]],
            [{ insertExtract: '1234' }, { insertExtract: '1234' }]
          );
        });

        it('json remove then extract', async function () {
          if (isOracle(knex)) {
            this.skip();
          }
          await knex
            .jsonExtract(
              knex.jsonRemove('population', '$.minMax.min'),
              '$.minMax.max',
              'maxPop'
            )
            .from('cities')
            .testSql(function (tester) {
              tester(
                'mysql',
                'select json_unquote(json_extract(json_remove(`population`,?), ?)) as `maxPop` from `cities`',
                ['$.minMax.min', '$.minMax.max'],
                [
                  { maxPop: '12000000' },
                  { maxPop: '1200000' },
                  { maxPop: '1450000' },
                ]
              );
              tester(
                'pg',
                'select jsonb_path_query("population" #- ?, ?) as "maxPop" from "cities"',
                ['{minMax,min}', '$.minMax.max'],
                [{ maxPop: 12000000 }, { maxPop: 1200000 }, { maxPop: 1450000 }]
              );
              tester(
                'pgnative',
                'select jsonb_path_query("population" #- ?, ?) as "maxPop" from "cities"',
                ['{minMax,min}', '$.minMax.max'],
                [{ maxPop: 12000000 }, { maxPop: 1200000 }, { maxPop: 1450000 }]
              );
              tester(
                'pg-redshift',
                'select jsonb_path_query("population" #- ?, ?) as "maxPop" from "cities"',
                ['{minMax,min}', '$.minMax.max'],
                [
                  { maxPop: '12000000' },
                  { maxPop: 1200000 },
                  { maxPop: 1450000 },
                ]
              );
              tester(
                'sqlite3',
                'select json_extract(json_remove(`population`,?), ?) as `maxPop` from `cities`',
                ['$.minMax.min', '$.minMax.max'],
                [{ maxPop: 12000000 }, { maxPop: 1200000 }, { maxPop: 1450000 }]
              );
              tester(
                'mssql',
                'select JSON_VALUE(JSON_MODIFY([population],?, NULL), ?) as [maxPop] from [cities]',
                ['$.minMax.min', '$.minMax.max'],
                [
                  { maxPop: '12000000' },
                  { maxPop: '1200000' },
                  { maxPop: '1450000' },
                ]
              );
            });
        });

        it('json remove, set then extract', async function () {
          if (isOracle(knex)) {
            this.skip();
          }
          const res = await knex
            .jsonExtract(
              [
                [
                  knex.jsonRemove('population', '$.minMax.min'),
                  '$.minMax',
                  'withoutMin',
                ],
                [
                  knex.jsonRemove('population', '$.minMax.max'),
                  '$.minMax',
                  'withoutMax',
                ],
                [
                  knex.jsonSet('population', '$.current.value', '1234'),
                  '$.current',
                  'currentModified',
                ],
              ],
              false
            )
            .from('cities');
          assertJsonEquals(res[0].currentModified, {
            value: '1234',
          });
          assertJsonEquals(res[0].withoutMax, {
            min: 50000,
          });
          assertJsonEquals(res[0].withoutMin, {
            max: 12000000,
          });

          assertJsonEquals(res[1].currentModified, {
            value: '1234',
          });
          assertJsonEquals(res[1].withoutMax, { min: 44000 });
          assertJsonEquals(res[1].withoutMin, {
            max: 1200000,
          });

          assertJsonEquals(res[2].currentModified, {
            value: 1234,
          });
          assertJsonEquals(res[2].withoutMax, { min: 44000 });
          assertJsonEquals(res[2].withoutMin, {
            max: 1450000,
          });
        });
      });
    });
  });
});

'use strict';

const { expect } = require('chai');

require('lodash');

const { isSQLite, isMssql } = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const logger = require('../../integration/logger');

describe('Checks', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
        knex = logger(getKnexForDb(db));
      });

      after(async () => {
        return knex.destroy();
      });

      /**
       * Perform a check constraint with two tests : test the check constraint don't trigger on valid insert and
       * test the constraint trigger on invalid insert.
       *
       * @param validInsert the valid insert object.
       * @param invalidInsert the valid insert object.
       * @returns {Promise<void>}
       */
      async function checkTest(validInsert, invalidInsert) {
        try {
          await knex('check_test').insert([validInsert]);
        } catch (err) {
          expect(
            err,
            `valid insert ${JSON.stringify(
              validInsert
            )} thrown error (${err.toString()}) instead of pass`
          ).to.undefined;
        }

        let res;
        try {
          res = await knex('check_test').insert([invalidInsert]);
        } catch (err) {
          expect(err).to.not.undefined;
        }
        expect(
          res,
          `invalid insert ${JSON.stringify(invalidInsert)} pass instead of fail`
        ).to.undefined;
      }

      it('create table with raw check on table', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.string('col1');
            table.string('col2');
            table.check('?? = ??', ['col1', 'col2']);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb'],
              [
                'create table "check_test" ("col1" varchar(255), "col2" varchar(255), check ("col1" = "col2"))',
              ]
            );
            tester(
              ['oracledb'],
              [
                'create table "check_test" ("name" varchar2(255) check ("name" LIKE \'%val%\'))',
              ]
            );
            tester('mysql', [
              'create table `check_test` (`col1` varchar(255), `col2` varchar(255), check (`col1` = `col2`)) default character set utf8',
            ]);
            tester('sqlite3', [
              'create table `check_test` (`col1` varchar(255), `col2` varchar(255), check (`col1` = `col2`))',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([col1] nvarchar(255), [col2] nvarchar(255), check ([col1] = [col2]))',
            ]);
          });

        await checkTest(
          { col1: 'test', col2: 'test' },
          { col1: 'test', col2: 'test2' }
        );
      });

      it('create table with numeric positive check', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.integer('price').checkPositive();
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
              [
                'create table "check_test" ("price" integer check ("price" > 0))',
              ]
            );
            tester('mysql', [
              'create table `check_test` (`price` int check (`price` > 0)) default character set utf8',
            ]);
            tester('sqlite3', [
              'create table `check_test` (`price` integer check (`price` > 0))',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([price] int check ([price] > 0))',
            ]);
          });

        await checkTest({ price: 10 }, { price: -5 });
      });

      it('create table with numeric negative check', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.integer('price').checkNegative();
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
              [
                'create table "check_test" ("price" integer check ("price" < 0))',
              ]
            );
            tester('mysql', [
              'create table `check_test` (`price` int check (`price` < 0)) default character set utf8',
            ]);
            tester('sqlite3', [
              'create table `check_test` (`price` integer check (`price` < 0))',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([price] int check ([price] < 0))',
            ]);
          });

        await checkTest({ price: -5 }, { price: 10 });
      });

      it('create table with check in', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.string('animal').checkIn(['dog', 'cat']);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb'],
              [
                'create table "check_test" ("animal" varchar(255) check ("animal" in (\'dog\',\'cat\')))',
              ]
            );
            tester('oracledb', [
              'create table "check_test" ("animal" varchar2(255) check ("animal" in (\'dog\', \'cat\')))',
            ]);
            tester('mysql', [
              "create table `check_test` (`animal` varchar(255) check (`animal` in ('dog','cat'))) default character set utf8",
            ]);
            tester('sqlite3', [
              "create table `check_test` (`animal` varchar(255) check (`animal` in ('dog','cat')))",
            ]);
            tester('mssql', [
              "CREATE TABLE [check_test] ([animal] nvarchar(255) check ([animal] in ('dog','cat')))",
            ]);
          });

        await checkTest({ animal: 'dog' }, { animal: 'pig' });
        await checkTest({ animal: 'cat' }, { animal: 'pig' });
      });

      it('create table with check not in', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.string('animal').checkNotIn(['dog', 'cat']);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb'],
              [
                'create table "check_test" ("animal" varchar(255) check ("animal" not in (\'dog\',\'cat\')))',
              ]
            );
            tester('oracledb', [
              'create table "check_test" ("animal" varchar2(255) check ("animal" not in (\'dog\',\'cat\')))',
            ]);
            tester('mysql', [
              "create table `check_test` (`animal` varchar(255) check (`animal` not in ('dog','cat'))) default character set utf8",
            ]);
            tester('sqlite3', [
              "create table `check_test` (`animal` varchar(255) check (`animal` not in ('dog','cat')))",
            ]);
            tester('mssql', [
              "CREATE TABLE [check_test] ([animal] nvarchar(255) check ([animal] not in ('dog','cat')))",
            ]);
          });

        await checkTest({ animal: 'pg' }, { animal: 'cat' });
        await checkTest({ animal: 'mammoth' }, { animal: 'cat' });
      });

      it('create table with check between', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.integer('price').checkBetween([10, 20]);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
              [
                'create table "check_test" ("price" integer check ("price" between 10 and 20))',
              ]
            );
            tester('mysql', [
              'create table `check_test` (`price` int check (`price` between 10 and 20)) default character set utf8',
            ]);
            tester('sqlite3', [
              'create table `check_test` (`price` integer check (`price` between 10 and 20))',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([price] int check ([price] between 10 and 20))',
            ]);
          });

        await checkTest({ price: 10 }, { price: 25 });
      });

      it('create table with check between with multiple intervals', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.integer('price').checkBetween([
              [10, 20],
              [30, 40],
            ]);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
              [
                'create table "check_test" ("price" integer check ("price" between 10 and 20 or "price" between 30 and 40))',
              ]
            );
            tester('mysql', [
              'create table `check_test` (`price` int check (`price` between 10 and 20 or `price` between 30 and 40)) default character set utf8',
            ]);
            tester('sqlite3', [
              'create table `check_test` (`price` integer check (`price` between 10 and 20 or `price` between 30 and 40))',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([price] int check ([price] between 10 and 20 or [price] between 30 and 40))',
            ]);
          });

        await checkTest({ price: 15 }, { price: 25 });
        await checkTest({ price: 35 }, { price: 45 });
      });

      it('create table with check length', async () => {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.string('year').checkLength('=', 4);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb'],
              [
                'create table "check_test" ("year" varchar(255) check (length("year") = 4))',
              ]
            );
            tester('oracledb', [
              'create table "check_test" ("year" varchar2(255) check (length("year") = 4))',
            ]);
            tester('mysql', [
              'create table `check_test` (`year` varchar(255) check (length(`year`) = 4)) default character set utf8',
            ]);
            tester('sqlite3', [
              'create table `check_test` (`year` varchar(255) check (length(`year`) = 4))',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([year] nvarchar(255) check (LEN([year]) = 4))',
            ]);
          });

        await checkTest({ year: '2021' }, { year: '21' });
      });

      it('create table with check regex', async function () {
        if (isMssql(knex) || isSQLite(knex)) {
          this.skip();
        }
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', function (table) {
            table.string('date').checkRegex('[0-9]{2}-[0-9]{2}-[0-9]{4}');
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb'],
              [
                'create table "check_test" ("date" varchar(255) check ("date" ~ \'[0-9]{2}-[0-9]{2}-[0-9]{4}\'))',
              ]
            );
            tester('oracledb', [
              'create table "check_test" ("date" varchar2(255) check (REGEXP_LIKE("date",\'[0-9]{2}-[0-9]{2}-[0-9]{4}\')))',
            ]);
            tester('mysql', [
              "create table `check_test` (`date` varchar(255) check (`date` REGEXP '[0-9]{2}-[0-9]{2}-[0-9]{4}')) default character set utf8",
            ]);
          });

        await checkTest({ date: '01-02-2021' }, { date: '01/02/2021' });
        await checkTest({ date: '01-02-2021' }, { date: '01-02-221' });
      });

      it('drop checks', async function () {
        if (isSQLite(knex)) {
          this.skip();
        }
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema.createTable('check_test', function (table) {
          table.integer('price').checkPositive('price_pos_check');
        });
        await checkTest({ price: 10 }, { price: -5 });
        await knex.schema
          .table('check_test', function (table) {
            table.dropChecks('price_pos_check');
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
              ['alter table "check_test" drop constraint price_pos_check']
            );
            tester('mysql', [
              'alter table `check_test` drop constraint price_pos_check',
            ]);
          });
        // Now, insert negative value work.
        expect(await knex('check_test').insert([{ price: -5 }])).to.not.throw;
      });

      it('create table with custom check', async function () {
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema
          .createTable('check_test', (table) => {
            table.integer('price_min');
            table.integer('price_max');
            table
              .check(
                '?? < ??',
                ['price_min', 'price_max'],
                'price_min_lower_max'
              )
              .check('?? > 5', ['price_min']);
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift', 'cockroachdb'],
              [
                'create table "check_test" ("price_min" integer, "price_max" integer, constraint price_min_lower_max check ("price_min" < "price_max"), check ("price_min" > 5))',
              ]
            );
            tester('oracledb', [
              'create table "check_test" ("price_min" integer, "price_max" integer, constraint price_min_lower_max check ("price_min" < "price_max"), check ("price_min" > 5))',
            ]);
            tester('mysql', [
              'create table `check_test` (`price_min` int, `price_max` int, constraint price_min_lower_max check (`price_min` < `price_max`), check (`price_min` > 5)) default character set utf8',
            ]);
            tester('mssql', [
              'CREATE TABLE [check_test] ([price_min] int, [price_max] int, constraint price_min_lower_max check ([price_min] < [price_max]), check ([price_min] > 5))',
            ]);
          });

        await checkTest(
          { price_min: 10, price_max: 20 },
          { price_min: 10, price_max: 5 }
        );
        await checkTest(
          { price_min: 10, price_max: 20 },
          { price_min: 0, price_max: 5 }
        );
      });

      it('create table with checks then alter', async function () {
        if (isSQLite(knex)) {
          this.skip();
        }
        await knex.schema.dropTableIfExists('check_test');
        await knex.schema.createTable('check_test', (table) => {
          table.integer('price');
        });
        expect(await knex('check_test').insert([{ price: -5 }])).to.not.throw;
        // Alter table with check constraint fail, we have row that violated the constraint
        let error;
        try {
          await knex.schema.table('check_test', (table) => {
            table.integer('price').checkPositive().alter();
          });
        } catch (e) {
          error = e;
        }
        expect(error.message).to.not.undefined;

        // empty the table to add the constraint
        await knex('check_test').truncate();
        await knex.schema
          .table('check_test', (table) => {
            table.integer('price').checkPositive().alter();
          })
          .testSql((tester) => {
            tester(
              ['pg', 'pg-redshift'],
              [
                'alter table "check_test" alter column "price" drop default',
                'alter table "check_test" alter column "price" drop not null',
                'alter table "check_test" alter column "price" type integer using ("price"::integer)',
                'alter table "check_test" add constraint check_test_price_1 check("price" > 0)',
              ]
            );
            tester('cockroachdb', [
              'SET enable_experimental_alter_column_type_general = true',
              'alter table "check_test" alter column "price" drop default',
              'alter table "check_test" alter column "price" drop not null',
              'alter table "check_test" alter column "price" type integer using ("price"::integer)',
              'alter table "check_test" add constraint check_test_price_1 check("price" > 0)',
            ]);
            tester('oracledb', [
              'alter table "check_test" modify "price" integer',
              'alter table "check_test" add constraint check_test_price_1 check("price" > 0)',
            ]);
            tester('mysql', [
              'alter table `check_test` modify `price` int',
              'alter table `check_test` add constraint check_test_price_1 check(`price` > 0)',
            ]);
          });
        await checkTest({ price: 10 }, { price: -10 });
      });
    });
  });
});

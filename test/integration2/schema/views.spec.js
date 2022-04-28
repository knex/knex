'use strict';

const { expect } = require('chai');

require('lodash');

const { isOracle, isSQLite, isMssql } = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const logger = require('../../integration/logger');
const { isMysql, isCockroachDB } = require('../../util/db-helpers.js');
const { assertNumber } = require('../../util/assertHelper');

describe('Views', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
        knex = logger(getKnexForDb(db));
      });

      after(async () => {
        return knex.destroy();
      });

      describe('view', () => {
        beforeEach(async () => {
          await knex.schema.dropViewIfExists('view_test');
          await knex.schema.dropTableIfExists('table_view');
          await knex.schema.createTable('table_view', (t) => {
            t.string('a');
            t.integer('b');
          });
          await knex('table_view').insert([
            { a: 'test', b: 5 },
            { a: 'test2', b: 12 },
            { a: 'test3', b: 45 },
          ]);
        });

        afterEach(async () => {
          await knex.schema.dropViewIfExists('view_test');
          await knex.schema.dropViewIfExists('new_view');
          if (!isMssql(knex) && !isSQLite(knex) && !isMysql(knex)) {
            await knex.schema.dropMaterializedViewIfExists('mat_view');
          }
          await knex.schema.dropTableIfExists('table_view');
        });

        it('create view', async () => {
          await knex.schema
            .createView('view_test', function (view) {
              view.columns(['a', 'b']);
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
            })
            .testSql((tester) => {
              tester(
                ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
                [
                  'create view "view_test" ("a", "b") as select "a", "b" from "table_view" where "b" > \'10\'',
                ]
              );
              tester(
                ['sqlite3', 'mysql'],
                [
                  "create view `view_test` (`a`, `b`) as select `a`, `b` from `table_view` where `b` > '10'",
                ]
              );
              tester('mssql', [
                "CREATE VIEW [view_test] ([a], [b]) AS select [a], [b] from [table_view] where [b] > '10'",
              ]);
            });

          // We test if the select on the view works and if results are good
          await knex
            .select(['a', 'b'])
            .from('view_test')
            .then(function (results) {
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
            });
        });

        it('create view without columns', async () => {
          await knex.schema
            .createView('view_test', function (view) {
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
            })
            .testSql((tester) => {
              tester(
                ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
                [
                  'create view "view_test" as select "a", "b" from "table_view" where "b" > \'10\'',
                ]
              );
              tester(
                ['sqlite3', 'mysql'],
                [
                  "create view `view_test` as select `a`, `b` from `table_view` where `b` > '10'",
                ]
              );
              tester('mssql', [
                "CREATE VIEW [view_test] AS select [a], [b] from [table_view] where [b] > '10'",
              ]);
            });

          // We test if the select on the view works and if results are good
          await knex
            .select(['a', 'b'])
            .from('view_test')
            .then(function (results) {
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
            });
        });

        it('create or replace view', async () => {
          // We create the view and test if all is ok
          await knex.schema.createView('view_test', (view) => {
            view.as(knex('table_view').select('a', 'b'));
          });
          await knex
            .select(['a', 'b'])
            .from('view_test')
            .then(function (results) {
              expect(results.length).to.equal(3);
              expect(results[0].a).to.be.equal('test');
              expect(results[1].a).to.be.equal('test2');
              expect(results[2].a).to.be.equal('test3');
              assertNumber(knex, results[0].b, 5);
              assertNumber(knex, results[1].b, 12);
              assertNumber(knex, results[2].b, 45);
            });
          // Now we test that the new view is replaced
          await knex.schema
            .createViewOrReplace('view_test', function (view) {
              view.columns(['a', 'b']);
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
            })
            .testSql((tester) => {
              tester(
                ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
                [
                  'create or replace view "view_test" ("a", "b") as select "a", "b" from "table_view" where "b" > \'10\'',
                ]
              );
              tester(
                ['mysql'],
                [
                  "create or replace view `view_test` (`a`, `b`) as select `a`, `b` from `table_view` where `b` > '10'",
                ]
              );
              tester(
                ['sqlite3'],
                [
                  'drop view if exists `view_test`',
                  "create view `view_test` (`a`, `b`) as select `a`, `b` from `table_view` where `b` > '10'",
                ]
              );
              tester('mssql', [
                "CREATE OR ALTER VIEW [view_test] ([a], [b]) AS select [a], [b] from [table_view] where [b] > '10'",
              ]);
            });

          // We test if the select on the view works and if results are good
          await knex
            .select(['a', 'b'])
            .from('view_test')
            .then(function (results) {
              expect(results.length).to.equal(2);
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
            });
        });

        it('create or replace view without columns', async () => {
          // We create the view and test if all is ok
          await knex.schema.createView('view_test', (view) => {
            view.as(knex('table_view').select('a', 'b'));
          });
          await knex
            .select(['a', 'b'])
            .from('view_test')
            .then(function (results) {
              expect(results.length).to.equal(3);
              expect(results[0].a).to.be.equal('test');
              expect(results[1].a).to.be.equal('test2');
              expect(results[2].a).to.be.equal('test3');
              assertNumber(knex, results[0].b, 5);
              assertNumber(knex, results[1].b, 12);
              assertNumber(knex, results[2].b, 45);
            });
          // Now we test that the new view is replaced
          await knex.schema
            .createViewOrReplace('view_test', function (view) {
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
            })
            .testSql((tester) => {
              tester(
                ['pg', 'pg-redshift', 'cockroachdb', 'oracledb'],
                [
                  'create or replace view "view_test" as select "a", "b" from "table_view" where "b" > \'10\'',
                ]
              );
              tester(
                ['mysql'],
                [
                  "create or replace view `view_test` as select `a`, `b` from `table_view` where `b` > '10'",
                ]
              );
              tester(
                ['sqlite3'],
                [
                  'drop view if exists `view_test`',
                  "create view `view_test` as select `a`, `b` from `table_view` where `b` > '10'",
                ]
              );
              tester('mssql', [
                "CREATE OR ALTER VIEW [view_test] AS select [a], [b] from [table_view] where [b] > '10'",
              ]);
            });

          // We test if the select on the view works and if results are good
          await knex
            .select(['a', 'b'])
            .from('view_test')
            .then(function (results) {
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
            });
        });

        it('create materialized view', async function () {
          if (isMssql(knex) || isSQLite(knex) || isMysql(knex)) {
            return this.skip();
          }
          await knex.schema
            .createMaterializedView('mat_view', function (view) {
              view.columns(['a', 'b']);
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
            })
            .testSql((tester) => {
              tester(
                ['pg', 'cockroachdb', 'pg-redshift', 'oracledb'],
                [
                  'create materialized view "mat_view" ("a", "b") as select "a", "b" from "table_view" where "b" > \'10\'',
                ]
              );
            });

          await knex
            .select(['a', 'b'])
            .from('mat_view')
            .then(function (results) {
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
            });

          await knex('table_view').insert([{ a: 'test', b: 32 }]);

          // We test we have same values, because the view is not refreshed
          await knex
            .select(['a', 'b'])
            .from('mat_view')
            .then(function (results) {
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
            });

          await knex.schema.refreshMaterializedView('mat_view');

          // Materialized view is refreshed
          await knex
            .select(['a', 'b'])
            .from('mat_view')
            .then(function (results) {
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
              expect(results[2].a).to.be.equal('test');
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
              assertNumber(knex, results[2].b, 32);
            });
          await knex.schema.dropMaterializedView('mat_view');
        });

        it('alter column view', async function () {
          if (
            isOracle(knex) ||
            isSQLite(knex) ||
            isMysql(knex) ||
            isCockroachDB(knex)
          ) {
            return this.skip();
          }
          await knex.schema.createView('view_test', function (view) {
            view.columns(['a', 'b']);
            view.as(knex('table_view').select('a', 'b').where('b', '>', '10'));
          });

          await knex.schema.alterView('view_test', function (view) {
            view.column('a').rename('new_a');
          });

          await knex
            .select(['new_a', 'b'])
            .from('view_test')
            .then(function (results) {
              expect(results[0].new_a).to.be.equal('test2');
              expect(results[1].new_a).to.be.equal('test3');
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
            });
        });

        it('alter view rename', async function () {
          if (isOracle(knex) || isSQLite(knex)) {
            return this.skip();
          }
          await knex.schema.createView('view_test', function (view) {
            view.columns(['a', 'b']);
            view.as(knex('table_view').select('a', 'b').where('b', '>', '10'));
          });

          await knex.schema.renameView('view_test', 'new_view');

          await knex
            .select(['a', 'b'])
            .from('new_view')
            .then(function (results) {
              expect(results[0].a).to.be.equal('test2');
              expect(results[1].a).to.be.equal('test3');
              assertNumber(knex, results[0].b, 12);
              assertNumber(knex, results[1].b, 45);
            });
          await knex.schema.dropView('new_view');
        });

        it('create view with check options', async function () {
          if (isMssql(knex) || isCockroachDB(knex) || isSQLite(knex)) {
            return this.skip();
          }

          await knex.schema
            .createView('view_test', function (view) {
              view.columns(['a', 'b']);
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
              view.checkOption();
            })
            .testSql((tester) => {
              tester(
                ['oracledb'],
                [
                  'create view "view_test" ("a", "b") as select "a", "b" from "table_view" where "b" > \'10\' with check option',
                ]
              );
            });

          if (isOracle(knex)) {
            return this.skip();
          }
          await knex.schema.dropView('view_test');
          await knex.schema
            .createView('view_test', function (view) {
              view.columns(['a', 'b']);
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
              view.localCheckOption();
            })
            .testSql((tester) => {
              tester(
                ['pg', 'cockroachdb', 'pg-redshift'],
                [
                  'create view "view_test" ("a", "b") as select "a", "b" from "table_view" where "b" > \'10\' with local check option',
                ]
              );
              tester(
                ['mysql'],
                [
                  "create view `view_test` (`a`, `b`) as select `a`, `b` from `table_view` where `b` > '10' with local check option",
                ]
              );
            });
          await knex.schema.dropView('view_test');
          await knex.schema
            .createView('view_test', function (view) {
              view.columns(['a', 'b']);
              view.as(
                knex('table_view').select('a', 'b').where('b', '>', '10')
              );
              view.cascadedCheckOption();
            })
            .testSql((tester) => {
              tester(
                ['pg', 'cockroachdb', 'pg-redshift'],
                [
                  'create view "view_test" ("a", "b") as select "a", "b" from "table_view" where "b" > \'10\' with cascaded check option',
                ]
              );
              tester(
                ['mysql'],
                [
                  "create view `view_test` (`a`, `b`) as select `a`, `b` from `table_view` where `b` > '10' with cascaded check option",
                ]
              );
            });
        });
      });
    });
  });
});

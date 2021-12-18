const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const {
  isSQLite,
  isPostgreSQL,
  isMysql,
  isBetterSQLite3,
  isOracle,
} = require('../../util/db-helpers');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('alter nullable', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;

        before(function () {
          sinon.stub(Math, 'random').returns(0.1);
          knex = getKnexForDb(db);
        });

        after(() => {
          sinon.restore();
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema.createTable('primary_table', (table) => {
            table.integer('id_nullable').nullable();
            table.integer('id_not_nullable').notNull();
          });
        });

        afterEach(async () => {
          await knex.schema.dropTable('primary_table');
        });

        describe('setNullable', () => {
          it('should generate correct SQL for set nullable operation', async () => {
            const builder = knex.schema.table('primary_table', (table) => {
              table.setNullable('id_not_nullable');
            });
            const queries = await builder.generateDdlCommands();

            if (isSQLite(knex)) {
              expect(queries.sql).to.eql([
                'CREATE TABLE `_knex_temp_alter111` (`id_nullable` integer NULL, `id_not_nullable` integer)',
                'INSERT INTO _knex_temp_alter111 SELECT * FROM primary_table;',
                "DROP TABLE 'primary_table'",
                "ALTER TABLE '_knex_temp_alter111' RENAME TO 'primary_table'",
              ]);
            }

            if (isPostgreSQL(knex)) {
              expect(queries.sql).to.eql([
                {
                  bindings: [],
                  sql: 'alter table "primary_table" alter column "id_not_nullable" drop not null',
                },
              ]);
            }
          });

          it('sets column to be nullable', async () => {
            await knex.schema.table('primary_table', (table) => {
              table.setNullable('id_not_nullable');
            });

            await knex('primary_table').insert({
              id_nullable: null,
              id_not_nullable: null,
            });
          });
        });

        describe('dropNullable', () => {
          it('sets column to be not nullable', async () => {
            await knex.schema.table('primary_table', (table) => {
              table.dropNullable('id_nullable');
            });

            let errorMessage;
            if (isPostgreSQL(knex)) {
              errorMessage = 'violates not-null constraint';
            } else if (isMysql(knex)) {
              errorMessage = 'cannot be null';
            } else if (isOracle(knex)) {
              errorMessage = 'ORA-01400: cannot insert NULL into';
            } else if (isBetterSQLite3(knex)) {
              errorMessage =
                'insert into `primary_table` (`id_not_nullable`, `id_nullable`) values (1, NULL) - NOT NULL constraint failed: primary_table.id_nullable';
            } else if (isSQLite(knex)) {
              errorMessage =
                'insert into `primary_table` (`id_not_nullable`, `id_nullable`) values (1, NULL) - SQLITE_CONSTRAINT_NOTNULL: NOT NULL constraint failed: primary_table.id_nullable';
            }

            await expect(
              knex('primary_table').insert({
                id_nullable: null,
                id_not_nullable: 1,
              })
            ).to.eventually.be.rejectedWith(errorMessage);
          });
        });
      });
    });
  });
});

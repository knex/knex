const { expect } = require('chai');
const sinon = require('sinon');
const {
  Db,
  getAllDbs,
  getKnexForDb,
} = require('../util/knex-instance-provider');
const { isMysql } = require('../../util/db-helpers');

const QUERY_TABLE =
  'SELECT sql FROM sqlite_master WHERE type="table" AND tbl_name="alter_table"';

describe('Schema', () => {
  describe('Alter', () => {
    getAllDbs()
      .filter((db) => db === Db.SQLite)
      .forEach((db) => {
        describe(db, () => {
          let knex;
          before(async () => {
            sinon.stub(Math, 'random').returns(0.1);
            knex = getKnexForDb(db);
          });

          after(() => {
            sinon.restore();
            return knex.destroy();
          });

          beforeEach(async () => {
            await knex.schema.createTable('alter_table', (table) => {
              table.integer('column_integer');
              table.string('column_string');
              table.dateTime('column_datetime');

              table.integer('column_defaultTo').defaultTo(0);
              table.boolean('column_boolean_defaultTo').defaultTo(false);
              table.string('column_notNullable').notNullable();
              table
                .dateTime('column_defaultToAndNotNullable')
                .defaultTo(0)
                .notNullable();

              table.boolean('column_nullable').nullable();
            });

            await knex('alter_table').insert({
              column_integer: 1,
              column_string: '1',
              column_datetime: 1614349736,
              column_notNullable: 'text',
              column_nullable: true,
            });
          });

          afterEach(async () => {
            await knex.schema.dropTable('alter_table');
          });

          describe('indexes and unique keys', () => {
            it('alter table add indexes', async function () {
              if (!isMysql(knex)) {
                this.skip();
              }
              await knex.schema
                .alterTable('alter_table', (table) => {
                  table.index(['column_string', 'column_datetime'], 'idx_1', {
                    indexType: 'FULLTEXT',
                    storageEngineIndexType: 'BTREE',
                  });
                  table.unique('column_notNullable', {
                    indexName: 'idx_2',
                    storageEngineIndexType: 'HASH',
                  });
                })
                .testSql((tester) => {
                  tester('mysql', [
                    'alter table `alter_table` add FULLTEXT index `idx_1`(`column_string`, `column_datetime`) using BTREE',
                    'alter table `alter_table` add unique `idx_2`(`column_notNullable`) using HASH',
                  ]);
                });
            });
          });

          describe('alterColumns', () => {
            it('alters the type of columns', async () => {
              await knex.schema.alterTable('alter_table', (table) => {
                table.string('column_integer').alter();
                table.integer('column_string').alter();
                table.date('column_datetime').alter();
              });

              const item_one = (await knex('alter_table'))[0];
              const tableAfter = (await knex.raw(QUERY_TABLE))[0].sql;

              expect(item_one.column_integer).to.be.a('string');
              expect(item_one.column_string).to.be.a('number');
              expect(item_one.column_datetime).to.be.a('number');
              expect(tableAfter).to.equal(
                "CREATE TABLE \"alter_table\" (`column_integer` varchar(255), `column_string` integer, `column_datetime` date, `column_defaultTo` integer DEFAULT '0', `column_boolean_defaultTo` boolean DEFAULT '0', `column_notNullable` varchar(255) NOT NULL, `column_defaultToAndNotNullable` datetime NOT NULL DEFAULT '0', `column_nullable` boolean NULL)"
              );
            });

            it('adds default and not null constraints', async () => {
              await knex.schema.alterTable('alter_table', (table) => {
                table.integer('column_integer').defaultTo(0).alter();
                table.string('column_string').notNullable().alter();
                table
                  .dateTime('column_datetime')
                  .defaultTo(0)
                  .notNullable()
                  .alter();
              });

              await knex('alter_table').insert({
                column_string: '1',
                column_notNullable: 'text',
              });

              const item_two = (await knex('alter_table'))[1];
              const tableAfter = (await knex.raw(QUERY_TABLE))[0].sql;

              expect(item_two.column_integer).to.equal(0);
              expect(item_two.column_datetime).to.equal(0);
              await expect(
                knex('alter_table').insert({ column_notNullable: 'text' })
              ).to.be.rejectedWith(
                Error,
                "insert into `alter_table` (`column_notNullable`) values ('text') - SQLITE_CONSTRAINT: NOT NULL constraint failed: alter_table.column_string"
              );
              expect(tableAfter).to.equal(
                "CREATE TABLE \"alter_table\" (`column_integer` integer DEFAULT '0', `column_string` varchar(255) NOT NULL, `column_datetime` datetime NOT NULL DEFAULT '0', `column_defaultTo` integer DEFAULT '0', `column_boolean_defaultTo` boolean DEFAULT '0', `column_notNullable` varchar(255) NOT NULL, `column_defaultToAndNotNullable` datetime NOT NULL DEFAULT '0', `column_nullable` boolean NULL)"
              );
            });

            it('removes not specified default and not null constraints', async () => {
              await knex.schema.alterTable('alter_table', (table) => {
                table.integer('column_defaultTo').alter();
                table.boolean('column_boolean_defaultTo').alter();
                table.string('column_notNullable').alter();
                table.dateTime('column_defaultToAndNotNullable').alter();
              });

              await knex('alter_table').insert({});

              const item_two = (await knex('alter_table'))[1];
              const tableAfter = (await knex.raw(QUERY_TABLE))[0].sql;

              expect(item_two.column_defaultTo).to.be.null;
              expect(item_two.column_boolean_defaultTo).to.be.null;
              expect(item_two.column_notNullable).to.be.null;
              expect(item_two.column_defaultToAndNotNullable).to.be.null;
              expect(tableAfter).to.equal(
                'CREATE TABLE "alter_table" (`column_integer` integer, `column_string` varchar(255), `column_datetime` datetime, `column_defaultTo` integer, `column_boolean_defaultTo` boolean, `column_notNullable` varchar(255), `column_defaultToAndNotNullable` datetime, `column_nullable` boolean NULL)'
              );
            });

            it('removes an existing null constraint if a not null constraint is added to a column', async () => {
              await knex.schema.alterTable('alter_table', (table) => {
                table.boolean('column_nullable').notNullable().alter();
              });

              const tableAfter = (await knex.raw(QUERY_TABLE))[0].sql;

              await expect(
                knex('alter_table').insert({ column_notNullable: 'text' })
              ).to.be.rejectedWith(
                Error,
                "insert into `alter_table` (`column_notNullable`) values ('text') - SQLITE_CONSTRAINT: NOT NULL constraint failed: alter_table.column_nullable"
              );
              expect(tableAfter).to.equal(
                "CREATE TABLE \"alter_table\" (`column_integer` integer, `column_string` varchar(255), `column_datetime` datetime, `column_defaultTo` integer DEFAULT '0', `column_boolean_defaultTo` boolean DEFAULT '0', `column_notNullable` varchar(255) NOT NULL, `column_defaultToAndNotNullable` datetime NOT NULL DEFAULT '0', `column_nullable` boolean NOT NULL)"
              );
            });

            it('properly changes the default value of a boolean column', async () => {
              await knex.schema.alterTable('alter_table', (table) => {
                table
                  .boolean('column_boolean_defaultTo')
                  .defaultTo(true)
                  .alter();
              });

              await knex('alter_table').insert({
                column_notNullable: 'text',
              });

              const item_two = (await knex('alter_table'))[1];
              const tableAfter = (await knex.raw(QUERY_TABLE))[0].sql;

              expect(item_two.column_boolean_defaultTo).to.equal(1);
              expect(tableAfter).to.equal(
                "CREATE TABLE \"alter_table\" (`column_integer` integer, `column_string` varchar(255), `column_datetime` datetime, `column_defaultTo` integer DEFAULT '0', `column_boolean_defaultTo` boolean DEFAULT '1', `column_notNullable` varchar(255) NOT NULL, `column_defaultToAndNotNullable` datetime NOT NULL DEFAULT '0', `column_nullable` boolean NULL)"
              );
            });

            it('generates correct SQL commands when altering columns', async () => {
              const builder = knex.schema.alterTable('alter_table', (table) => {
                table.string('column_integer').alter();
              });

              const queries = await builder.generateDdlCommands();

              expect(queries.sql).to.deep.equal([
                "CREATE TABLE `_knex_temp_alter111` (`column_integer` varchar(255), `column_string` varchar(255), `column_datetime` datetime, `column_defaultTo` integer DEFAULT '0', `column_boolean_defaultTo` boolean DEFAULT '0', `column_notNullable` varchar(255) NOT NULL, `column_defaultToAndNotNullable` datetime NOT NULL DEFAULT '0', `column_nullable` boolean NULL)",
                'INSERT INTO "_knex_temp_alter111" SELECT * FROM "alter_table";',
                'DROP TABLE "alter_table"',
                'ALTER TABLE "_knex_temp_alter111" RENAME TO "alter_table"',
              ]);
            });
          });
        });
      });
  });
});

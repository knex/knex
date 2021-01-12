const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('Foreign keys', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        before(() => {
          knex = getKnexForDb(db);
        });

        after(() => {
          return knex.destroy();
        });

        beforeEach(async () => {
          await knex.schema
            .createTable('foreign_keys_table_two', (table) => {
              table.increments();
            })
            .createTable('foreign_keys_table_three', (table) => {
              table.increments();
            })
            .createTable('foreign_keys_table_one', (table) => {
              table.increments();
              table.integer('fkey_two').unsigned().notNull();
              table.integer('fkey_three').unsigned().notNull();
            });
        });

        afterEach(async () => {
          await knex.schema
            .dropTable('foreign_keys_table_one')
            .dropTable('foreign_keys_table_two')
            .dropTable('foreign_keys_table_three');
        });

        describe('createForeignKey', () => {
          it('generates correct SQL for the new foreign key operation', async () => {
            await knex('foreign_keys_table_two').insert({});
            await knex('foreign_keys_table_three').insert({});
            await knex('foreign_keys_table_one').insert({
              fkey_two: 1,
              fkey_three: 1,
            });
            await knex('foreign_keys_table_one').insert({
              fkey_two: 1,
              fkey_three: 1,
            });

            const builder = knex.schema.alterTable(
              'foreign_keys_table_one',
              (table) => {
                table
                  .foreign('fkey_three')
                  .references('foreign_keys_table_three.id')
                  .withKeyName('fk_fkey_threeee');
              }
            );
            const queries = await builder.generateDdlCommands();

            if (isSQLite(knex)) {
              expect(queries).to.eql([
                'CREATE TABLE `_knex_temp_alter111` (`id` integer not null primary key autoincrement, `fkey_two` integer not null, `fkey_three` integer not null)',
                'INSERT INTO _knex_temp_alter111 SELECT * FROM foreign_keys_table_one;',
                'DROP TABLE "foreign_keys_table_one"',
                'CREATE TABLE `foreign_keys_table_one` (`id` integer not null primary key autoincrement, `fkey_two` integer not null, `fkey_three` integer not null, CONSTRAINT fk_fkey_threeee FOREIGN KEY (`fkey_three`)  REFERENCES `foreign_keys_table_three` (`id`))',
                'INSERT INTO foreign_keys_table_one SELECT * FROM _knex_temp_alter111;',
                'DROP TABLE "_knex_temp_alter111"',
              ]);
            }

            if (isPostgreSQL(knex)) {
              expect(queries).to.eql([
                {
                  bindings: [],
                  sql:
                    'alter table "foreign_keys_table_one" add constraint "fk_fkey_threeee" foreign key ("fkey_three") references "foreign_keys_table_three" ("id")',
                },
              ]);
            }
          });

          it('generates correct SQL for the new foreign key operation with an on delete clause', async () => {
            if (!isSQLite(knex)) {
              return;
            }

            const builder = knex.schema.alterTable(
              'foreign_keys_table_one',
              (table) => {
                table
                  .foreign('fkey_three')
                  .references('foreign_keys_table_three.id')
                  .withKeyName('fk_fkey_threeee')
                  .onDelete('CASCADE');
              }
            );

            const queries = await builder.generateDdlCommands();

            expect(queries).to.eql([
              'CREATE TABLE `_knex_temp_alter111` (`id` integer not null primary key autoincrement, `fkey_two` integer not null, `fkey_three` integer not null)',
              'INSERT INTO _knex_temp_alter111 SELECT * FROM foreign_keys_table_one;',
              'DROP TABLE "foreign_keys_table_one"',
              'CREATE TABLE `foreign_keys_table_one` (`id` integer not null primary key autoincrement, `fkey_two` integer not null, `fkey_three` integer not null, CONSTRAINT fk_fkey_threeee FOREIGN KEY (`fkey_three`)  REFERENCES `foreign_keys_table_three` (`id`) ON DELETE CASCADE)',
              'INSERT INTO foreign_keys_table_one SELECT * FROM _knex_temp_alter111;',
              'DROP TABLE "_knex_temp_alter111"',
            ]);
          });

          it('generates correct SQL for the new foreign key operation with an on update clause', async () => {
            if (!isSQLite(knex)) {
              return;
            }

            const builder = knex.schema.alterTable(
              'foreign_keys_table_one',
              (table) => {
                table
                  .foreign('fkey_three')
                  .references('foreign_keys_table_three.id')
                  .withKeyName('fk_fkey_threeee')
                  .onUpdate('CASCADE');
              }
            );

            const queries = await builder.generateDdlCommands();

            expect(queries).to.eql([
              'CREATE TABLE `_knex_temp_alter111` (`id` integer not null primary key autoincrement, `fkey_two` integer not null, `fkey_three` integer not null)',
              'INSERT INTO _knex_temp_alter111 SELECT * FROM foreign_keys_table_one;',
              'DROP TABLE "foreign_keys_table_one"',
              'CREATE TABLE `foreign_keys_table_one` (`id` integer not null primary key autoincrement, `fkey_two` integer not null, `fkey_three` integer not null, CONSTRAINT fk_fkey_threeee FOREIGN KEY (`fkey_three`)  REFERENCES `foreign_keys_table_three` (`id`) ON UPDATE CASCADE)',
              'INSERT INTO foreign_keys_table_one SELECT * FROM _knex_temp_alter111;',
              'DROP TABLE "_knex_temp_alter111"',
            ]);
          });

          it('creates new foreign key', async () => {
            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              table
                .foreign('fkey_three')
                .references('foreign_keys_table_three.id')
                .withKeyName('fk_fkey_threeee');
            });

            await knex('foreign_keys_table_two').insert({});
            await knex('foreign_keys_table_three').insert({});
            await knex('foreign_keys_table_one').insert({
              fkey_two: 1,
              fkey_three: 1,
            });
            try {
              await knex('foreign_keys_table_one').insert({
                fkey_two: 9999,
                fkey_three: 99,
              });
              throw new Error("Shouldn't reach this");
            } catch (err) {
              if (knex.client.driverName === 'sqlite3') {
                expect(err.message).to.equal(
                  `insert into \`foreign_keys_table_one\` (\`fkey_three\`, \`fkey_two\`) values (99, 9999) - SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`
                );
              }
              if (knex.client.driverName === 'pg') {
                expect(err.message).to.equal(
                  `insert into "foreign_keys_table_one" ("fkey_three", "fkey_two") values ($1, $2) - insert or update on table "foreign_keys_table_one" violates foreign key constraint "fk_fkey_threeee"`
                );
              }
              expect(err.message).to.include('constraint');
            }
          });
        });
      });
    });
  });
});

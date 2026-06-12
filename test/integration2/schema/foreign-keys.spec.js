const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const {
  isPostgreSQL,
  isSQLite,
  isCockroachDB,
  isBetterSQLite3,
} = require('../../util/db-helpers');

describe('Schema', () => {
  describe('Foreign keys', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        before(async () => {
          sinon.stub(Math, 'random').returns(0.1);
          knex = getKnexForDb(db);
          await knex.schema.dropTableIfExists('foreign_keys_table_one');
          await knex.schema.dropTableIfExists('foreign_keys_table_two');
          await knex.schema.dropTableIfExists('foreign_keys_table_three');
        });

        after(() => {
          sinon.restore();
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
          await knex.schema.dropTable('foreign_keys_table_one');
          await knex.schema.dropTable('foreign_keys_table_two');
          await knex.schema.dropTable('foreign_keys_table_three');
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
              expect(queries.sql).to.eql([
                'CREATE TABLE `_knex_temp_alter111` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `fkey_two` integer NOT NULL, `fkey_three` integer NOT NULL, CONSTRAINT `fk_fkey_threeee` FOREIGN KEY (`fkey_three`) REFERENCES `foreign_keys_table_three` (`id`))',
                'INSERT INTO "_knex_temp_alter111" SELECT * FROM "foreign_keys_table_one";',
                'DROP TABLE "foreign_keys_table_one"',
                'ALTER TABLE "_knex_temp_alter111" RENAME TO "foreign_keys_table_one"',
              ]);
            }

            if (isPostgreSQL(knex)) {
              expect(queries.sql).to.eql([
                {
                  bindings: [],
                  sql: 'alter table "foreign_keys_table_one" add constraint "fk_fkey_threeee" foreign key ("fkey_three") references "foreign_keys_table_three" ("id")',
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

            expect(queries.sql).to.eql([
              'CREATE TABLE `_knex_temp_alter111` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `fkey_two` integer NOT NULL, `fkey_three` integer NOT NULL, CONSTRAINT `fk_fkey_threeee` FOREIGN KEY (`fkey_three`) REFERENCES `foreign_keys_table_three` (`id`) ON DELETE CASCADE)',
              'INSERT INTO "_knex_temp_alter111" SELECT * FROM "foreign_keys_table_one";',
              'DROP TABLE "foreign_keys_table_one"',
              'ALTER TABLE "_knex_temp_alter111" RENAME TO "foreign_keys_table_one"',
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

            expect(queries.sql).to.eql([
              'CREATE TABLE `_knex_temp_alter111` (`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, `fkey_two` integer NOT NULL, `fkey_three` integer NOT NULL, CONSTRAINT `fk_fkey_threeee` FOREIGN KEY (`fkey_three`) REFERENCES `foreign_keys_table_three` (`id`) ON UPDATE CASCADE)',
              'INSERT INTO "_knex_temp_alter111" SELECT * FROM "foreign_keys_table_one";',
              'DROP TABLE "foreign_keys_table_one"',
              'ALTER TABLE "_knex_temp_alter111" RENAME TO "foreign_keys_table_one"',
            ]);
          });

          it('creates new foreign key', async () => {
            await knex('foreign_keys_table_two').insert({});
            await knex('foreign_keys_table_three').insert({});

            const rowsTwo = await knex('foreign_keys_table_two').select();
            const rowsThree = await knex('foreign_keys_table_three').select();
            const idTwo = rowsTwo[0].id;
            const idThree = rowsThree[0].id;

            await knex('foreign_keys_table_one').insert({
              fkey_two: idTwo,
              fkey_three: idThree,
            });
            await knex('foreign_keys_table_one').insert({
              fkey_two: idTwo,
              fkey_three: idThree,
            });

            const rowsOne = await knex('foreign_keys_table_one').select();
            const idOne1 = rowsOne[0].id;
            const idOne2 = rowsOne[1].id;

            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              table
                .foreign('fkey_three')
                .references('foreign_keys_table_three.id')
                .withKeyName('fk_fkey_threeee');
            });

            const existingRows = await knex('foreign_keys_table_one').select();
            expect(existingRows).to.eql([
              {
                fkey_three: idThree,
                fkey_two: idTwo,
                id: idOne1,
              },
              {
                fkey_three: idThree,
                fkey_two: idTwo,
                id: idOne2,
              },
            ]);

            await knex('foreign_keys_table_two').insert({});
            await knex('foreign_keys_table_three').insert({});
            await knex('foreign_keys_table_one').insert({
              fkey_two: idTwo,
              fkey_three: idThree,
            });
            try {
              await knex('foreign_keys_table_one').insert({
                fkey_two: 9999,
                fkey_three: 99,
              });
              throw new Error("Shouldn't reach this");
            } catch (err) {
              if (isBetterSQLite3(knex)) {
                expect(err.message).to.equal(
                  `insert into \`foreign_keys_table_one\` (\`fkey_three\`, \`fkey_two\`) values (99, 9999) - FOREIGN KEY constraint failed`
                );
              } else if (isSQLite(knex)) {
                expect(err.message).to.equal(
                  `insert into \`foreign_keys_table_one\` (\`fkey_three\`, \`fkey_two\`) values (99, 9999) - SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`
                );
              }
              if (isPostgreSQL(knex)) {
                expect(err.message).to.equal(
                  `insert into "foreign_keys_table_one" ("fkey_three", "fkey_two") values ($1, $2) - insert or update on table "foreign_keys_table_one" violates foreign key constraint "fk_fkey_threeee"`
                );
              }
              if (isCockroachDB(knex)) {
                expect(err.message).to.equal(
                  `insert into "foreign_keys_table_one" ("fkey_three", "fkey_two") values ($1, $2) - insert on table "foreign_keys_table_one" violates foreign key constraint "fk_fkey_threeee"`
                );
              }
              expect(err.message).to.include('constraint');
            }
          });

          it('can add a new column with a foreign key constraint', async () => {
            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              table
                .integer('fkey_new')
                .unsigned()
                .notNull()
                .references('foreign_keys_table_two.id');
            });

            await knex('foreign_keys_table_two').insert({});
            await knex('foreign_keys_table_three').insert({});

            await expect(
              knex('foreign_keys_table_one').insert({
                fkey_two: 1,
                fkey_three: 1,
                fkey_new: 2,
              })
            ).to.be.eventually.rejected;
          });

          it('can drop added foreign keys in sqlite after a table rebuild', async () => {
            if (!isSQLite(knex)) {
              return;
            }

            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              table
                .foreign('fkey_three')
                .references('foreign_keys_table_three.id');
            });

            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              // In sqlite this rebuilds a new foreign_keys_table_one table
              table.foreign('fkey_two').references('foreign_keys_table_two.id');
            });

            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              table.dropForeign('fkey_three');
            });

            const fks = await knex.raw(
              `PRAGMA foreign_key_list('foreign_keys_table_one');`
            );
            expect(fks.length).to.equal(1);
          });

          it('can alter a table in sqlite while another table has a foreign key constraint on this table', async () => {
            if (!isSQLite(knex)) {
              return;
            }

            await knex.schema.alterTable('foreign_keys_table_two', (table) => {
              table.integer('alter_column');
            });
            await knex.schema.alterTable('foreign_keys_table_one', (table) => {
              table.foreign('fkey_two').references('foreign_keys_table_two.id');
            });

            await knex('foreign_keys_table_two').insert({ alter_column: 1 });
            await knex('foreign_keys_table_one').insert({
              fkey_two: 1,
              fkey_three: 1,
            });

            await expect(
              knex.schema.alterTable('foreign_keys_table_two', (table) => {
                table.dropColumn('alter_column');
              })
            ).to.not.be.eventually.rejected;
          });
        });

        describe('Schema (Foreign keys)', () => {
          beforeEach(async () => {
            await knex.schema
              .dropTableIfExists('foreign_keys_table_one')
              .dropTableIfExists('foreign_keys_table_four');

            await knex.schema
              .createTable('foreign_keys_table_four', (table) => {
                table.string('col1').notNull();
                table.string('col2').notNull();
                table.primary(['col1', 'col2']);
              })
              .createTable('foreign_keys_table_one', (table) => {
                table.increments();
                table.integer('fkey_two').unsigned().notNull();
                table
                  .foreign('fkey_two')
                  .references('foreign_keys_table_two.id');
                table.string('fkey_four_part1');
                table.string('fkey_four_part2');
                table
                  .foreign(['fkey_four_part1', 'fkey_four_part2'])
                  .references(['col1', 'col2'])
                  .inTable('foreign_keys_table_four');
                table.integer('fkey_three').unsigned().notNull();
                table
                  .foreign('fkey_three')
                  .references('foreign_keys_table_three.id')
                  .withKeyName('fk_fkey_threeee');
              });
          });
          afterEach(async () => {
            await knex.schema.dropTableIfExists('foreign_keys_table_four');
          });

          describe('drop foreign key', () => {
            it('correctly drops foreign key', async () => {
              await knex('foreign_keys_table_two').insert({});
              await knex('foreign_keys_table_three').insert({});
              await knex('foreign_keys_table_four').insert({
                col1: 'a',
                col2: 'b',
              });
              const tableTwoEntry = await knex(
                'foreign_keys_table_two'
              ).select();
              const tableThreeEntry = await knex(
                'foreign_keys_table_three'
              ).select();
              await knex('foreign_keys_table_one').insert({
                fkey_two: tableTwoEntry[0].id,
                fkey_three: tableThreeEntry[0].id,
                fkey_four_part1: 'a',
                fkey_four_part2: 'b',
              });
              try {
                await knex('foreign_keys_table_one').insert({
                  fkey_two: 9999,
                  fkey_three: 99,
                  fkey_four_part1: 'a',
                  fkey_four_part2: 'b',
                });
                throw new Error("Shouldn't reach this");
              } catch (err) {
                if (isBetterSQLite3(knex)) {
                  expect(err.message).to.equal(
                    `insert into \`foreign_keys_table_one\` (\`fkey_four_part1\`, \`fkey_four_part2\`, \`fkey_three\`, \`fkey_two\`) values ('a', 'b', 99, 9999) - FOREIGN KEY constraint failed`
                  );
                } else if (isSQLite(knex)) {
                  expect(err.message).to.equal(
                    `insert into \`foreign_keys_table_one\` (\`fkey_four_part1\`, \`fkey_four_part2\`, \`fkey_three\`, \`fkey_two\`) values ('a', 'b', 99, 9999) - SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`
                  );
                }
                if (isPostgreSQL(knex)) {
                  expect(err.message).to.equal(
                    `insert into "foreign_keys_table_one" ("fkey_four_part1", "fkey_four_part2", "fkey_three", "fkey_two") values ($1, $2, $3, $4) - insert or update on table "foreign_keys_table_one" violates foreign key constraint "foreign_keys_table_one_fkey_two_foreign"`
                  );
                }
                if (isCockroachDB(knex)) {
                  expect(err.message).to.equal(
                    `insert into "foreign_keys_table_one" ("fkey_four_part1", "fkey_four_part2", "fkey_three", "fkey_two") values ($1, $2, $3, $4) - insert on table "foreign_keys_table_one" violates foreign key constraint "foreign_keys_table_one_fkey_two_foreign"`
                  );
                }
                expect(err.message).to.include('constraint');
              }

              await knex.schema.alterTable(
                'foreign_keys_table_one',
                (table) => {
                  table.dropForeign(['fkey_two']);
                  table.dropForeign([], 'fk_fkey_threeee');
                  table.dropForeign(['fkey_four_part1', 'fkey_four_part2']);
                }
              );

              await knex('foreign_keys_table_one').insert({
                fkey_two: 999,
                fkey_three: 999,
                fkey_four_part1: 'e',
                fkey_four_part2: 'f',
              });
            });
          });
        });
      });
    });
  });
});

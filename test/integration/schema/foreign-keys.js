const { expect } = require('chai');
const { isSQLite, isPostgreSQL } = require('../../util/db-helpers');

module.exports = (knex) => {
  describe('Schema', () => {
    beforeEach(async () => {
      await knex.schema
        .createTable('foreign_keys_table_two', (table) => {
          table.increments();
        })
        .createTable('foreign_keys_table_three', (table) => {
          table.increments();
        })
        .createTable('foreign_keys_table_four', (table) => {
          table.string('col1');
          table.string('col2');
          table.primary(['col1', 'col2']);
        })
        .createTable('foreign_keys_table_one', (table) => {
          table.increments();
          table.integer('fkey_two').unsigned().notNull();
          table.foreign('fkey_two').references('foreign_keys_table_two.id');
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
      await knex.schema
        .dropTable('foreign_keys_table_one')
        .dropTable('foreign_keys_table_two')
        .dropTable('foreign_keys_table_three')
        .dropTable('foreign_keys_table_four');
    });

    describe('drop foreign key', () => {
      it('correctly drops foreign key', async () => {
        await knex('foreign_keys_table_two').insert({});
        await knex('foreign_keys_table_three').insert({});
        await knex('foreign_keys_table_four').insert({
          col1: 'a',
          col2: 'b',
        });
        await knex('foreign_keys_table_one').insert({
          fkey_two: 1,
          fkey_three: 1,
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
          if (isSQLite(knex)) {
            expect(err.message).to.equal(
              `insert into \`foreign_keys_table_one\` (\`fkey_four_part1\`, \`fkey_four_part2\`, \`fkey_three\`, \`fkey_two\`) values ('a', 'b', 99, 9999) - SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`
            );
          }
          if (isPostgreSQL(knex)) {
            expect(err.message).to.equal(
              `insert into "foreign_keys_table_one" ("fkey_four_part1", "fkey_four_part2", "fkey_three", "fkey_two") values ($1, $2, $3, $4) - insert or update on table "foreign_keys_table_one" violates foreign key constraint "foreign_keys_table_one_fkey_two_foreign"`
            );
          }
          expect(err.message).to.include('constraint');
        }

        await knex.schema.alterTable('foreign_keys_table_one', (table) => {
          table.dropForeign(['fkey_two']);
          table.dropForeign([], 'fk_fkey_threeee');
          table.dropForeign(['fkey_four_part1', 'fkey_four_part2']);
        });

        await knex('foreign_keys_table_one').insert({
          fkey_two: 999,
          fkey_three: 999,
          fkey_four_part1: 'e',
          fkey_four_part2: 'f',
        });
      });
    });
  });
};

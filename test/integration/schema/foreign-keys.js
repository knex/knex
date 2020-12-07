const { expect } = require('chai');

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
        .createTable('foreign_keys_table_one', (table) => {
          table.increments();
          table.integer('fkey_two').unsigned().notNull();
          table.foreign('fkey_two').references('foreign_keys_table_two.id');
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
        .dropTable('foreign_keys_table_three');
    });

    describe('drop foreign key', () => {
      it('correctly drops foreign key', async () => {
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
          if (knex.client.driverName === 'postgres') {
            expect(err.message).to.equal(
              `insert into "foreign_keys_table_one" ("fkey_three", "fkey_two") values ($1, $2) - insert or update on table "foreign_keys_table_one" violates foreign key constraint "foreign_keys_table_one_fkey_two_foreign"`
            );
          }
          expect(err.message).to.include('constraint');
        }

        await knex.schema.alterTable('foreign_keys_table_one', (table) => {
          table.dropForeign(['fkey_two']);
          table.dropForeign([], 'fk_fkey_threeee');
        });

        await knex('foreign_keys_table_one').insert({
          fkey_two: 9999,
          fkey_three: 99,
        });
      });
    });
  });
};

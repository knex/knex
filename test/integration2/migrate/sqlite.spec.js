const { expect } = require('chai');
const { withDbs, Db } = require('../util/knex-instance-provider');

withDbs([Db.SQLite, Db.BetterSqlite3], (knex) => {
  describe('Migrations', () => {
    const id = 29448; // arbitrarily chosen to be unique to this file
    const parent = `test_parent_${id}`;
    const child = `test_child_${id}`;

    const migrationSource = (() => {
      const migrations = {
        one: {
          up: async (knex) => {
            // create the table we will alter
            await knex.schema.createTable(parent, (tb) => {
              tb.increments('id');
              tb.string('foo');
            });

            await knex.schema.createTable(child, (tb) => {
              tb.increments('id');
              tb.integer('parent_id')
                .references('id')
                .inTable(parent)
                .onDelete('cascade');
            });
          },
          down: () => {},
        },
        two: {
          up: async (knex) => {
            await knex.schema.alterTable(parent, (tb) => {
              tb.dropColumn('foo');
            });
          },
          down: () => {},
        },
      };

      return {
        getMigrations: () => Promise.resolve(Object.keys(migrations)),
        getMigrationName: (v) => v,
        getMigration: (name) => migrations[name],
      };
    })();

    beforeEach(async () => {
      await knex.raw('PRAGMA foreign_keys = ON');

      await knex.schema.dropTableIfExists(child);
      await knex.schema.dropTableIfExists(parent);
    });

    afterEach(async () => {
      await knex.schema.dropTableIfExists(child);
      await knex.schema.dropTableIfExists(parent);
    });

    // https://github.com/knex/knex/issues/6213
    it('Does not cascade deletes when re-creating a table to satisfy a schema alteration', async () => {
      await knex.migrate.up({ migrationSource, disableTransactions: true });
      const parentId = (
        await knex.insert({ id: null, foo: 'bar' }).into(parent).returning('id')
      )[0].id;

      const childId = (
        await knex
          .insert({ id: null, parent_id: parentId })
          .into(child)
          .returning('id')
      )[0].id;

      await knex.migrate.up({ migrationSource, disableTransactions: true });

      const childRows = await knex.select('*').from(child);
      expect(childRows).to.deep.equal([{ id: childId, parent_id: parentId }]);
    });
  });
});

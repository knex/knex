const { expect } = require('chai');

module.exports = (knex) => {
  const testUpdateWithJoin = true;

  describe.only('Updates with joins', () => {
    beforeEach(async () => {
      await knex.schema
        .createTable('foreign_keys_table_two', (table) => {
          table.increments();
          table.string('name');
        })
        .createTable('foreign_keys_table_three', (table) => {
          table.increments();
          table.string('name');
        })
        .createTable('foreign_keys_table_one', (table) => {
          table.increments();
          table.string('name');
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

    it('allows to narrow down updated rows by where in join', async () => {
      if (!testUpdateWithJoin) {
        return this.skip();
      }

      await knex('foreign_keys_table_two').insert({ name: 'fk_two-1' });
      await knex('foreign_keys_table_three').insert({ name: 'fk_three-1' });
      await knex('foreign_keys_table_two').insert({ name: 'fk_two-2' });
      await knex('foreign_keys_table_three').insert({ name: 'fk_three-2' });

      await knex('foreign_keys_table_one').insert({
        fkey_two: 1,
        fkey_three: 1,
      });
      await knex('foreign_keys_table_one').insert({
        fkey_two: 2,
        fkey_three: 2,
      });

      await knex('foreign_keys_table_one')
        .update({ name: 'updated name' })
        .join(
          'foreign_keys_table_three',
          'foreign_keys_table_three.id',
          '=',
          'foreign_keys_table_one.fkey_three'
        )
        .where('foreign_keys_table_three.name', 'fk_three-2');

      const updatedEntity = await knex('foreign_keys_table_one')
        .select()
        .where({
          fkey_three: 2,
        });

      const notUpdatedEntity = await knex('foreign_keys_table_one')
        .select()
        .where({
          fkey_three: 1,
        });

      expect(updatedEntity.name).to.equal('updated name');
      expect(notUpdatedEntity.name).to.equal(null);
    });
  });
};

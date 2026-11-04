const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;
const { camelCase } = require('lodash');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

function mapResponse(response, mapKey) {
  if (Array.isArray(response)) {
    return response.map((value) => mapResponse(value, mapKey));
  }
  if (response && typeof response === 'object') {
    return Object.fromEntries(
      Object.entries(response).map(([key, value]) => [mapKey(key), value])
    );
  }
  return response;
}

describe('MySQL renameColumn with postProcessResponse', () => {
  getAllDbs()
    .filter((db) => ['mysql', 'mysql2', 'mariadb'].includes(db))
    .forEach((db) => {
      describe(db, () => {
        let knex;

        before(() => {
          knex = getKnexForDb(db, { pool: { min: 0, max: 1 } });
        });

        beforeEach(async () => {
          await knex.schema.createTable('rename_response_parent', (table) => {
            table.increments('parent_id');
            table
              .integer('ancestor_id')
              .unsigned()
              .references('parent_id')
              .inTable('rename_response_parent')
              .onUpdate('CASCADE')
              .onDelete('SET NULL');
            table.string('display_name').defaultTo('default name');
          });
          await knex.schema.createTable('rename_response_child', (table) => {
            table
              .integer('owner_id')
              .unsigned()
              .references('parent_id')
              .inTable('rename_response_parent')
              .onUpdate('CASCADE')
              .onDelete('CASCADE');
          });
        });

        afterEach(async () => {
          delete knex.client.config.postProcessResponse;
          await knex.schema.dropTableIfExists('rename_response_child');
          await knex.schema.dropTableIfExists('rename_response_parent');
        });

        after(() => knex.destroy());

        for (const [name, mapKey] of [
          ['unchanged', (key) => key],
          ['camelCase', camelCase],
          ['custom field names', (key) => `mapped_${key}`],
        ]) {
          it(`preserves foreign keys and column properties with ${name}`, async () => {
            knex.client.config.postProcessResponse = (response) =>
              mapResponse(response, mapKey);

            await knex('rename_response_parent').insert({ parent_id: 1 });
            await knex('rename_response_parent').insert({
              parent_id: 2,
              ancestor_id: 1,
            });
            await knex('rename_response_parent').insert({ parent_id: 3 });
            await knex('rename_response_child').insert({ owner_id: 3 });

            await knex.schema.alterTable('rename_response_parent', (table) => {
              table.renameColumn('parent_id', 'entity_id');
            });
            await knex.schema.alterTable('rename_response_parent', (table) => {
              table.renameColumn('display_name', 'renamed_name');
            });

            const rows = await knex('rename_response_parent')
              .select('entity_id', 'renamed_name')
              .orderBy('entity_id');
            expect(rows).to.deep.equal([
              {
                [mapKey('entity_id')]: 1,
                [mapKey('renamed_name')]: 'default name',
              },
              {
                [mapKey('entity_id')]: 2,
                [mapKey('renamed_name')]: 'default name',
              },
              {
                [mapKey('entity_id')]: 3,
                [mapKey('renamed_name')]: 'default name',
              },
            ]);

            // Both the external and self-referencing constraints must survive.
            await expect(
              knex('rename_response_child').insert({ owner_id: 999 })
            ).to.be.rejectedWith(/foreign key constraint fails/i);
            await expect(
              knex('rename_response_parent').insert({ ancestor_id: 999 })
            ).to.be.rejectedWith(/foreign key constraint fails/i);

            await knex('rename_response_parent')
              .where('entity_id', 3)
              .update({ entity_id: 10 });
            expect(
              await knex('rename_response_child').first('owner_id')
            ).to.deep.equal({
              [mapKey('owner_id')]: 10,
            });
            expect(
              await knex('rename_response_parent')
                .where('entity_id', 2)
                .first('ancestor_id')
            ).to.deep.equal({ [mapKey('ancestor_id')]: 1 });

            await knex('rename_response_parent').where('entity_id', 10).del();
            expect(await knex('rename_response_child')).to.deep.equal([]);
            await knex('rename_response_parent').where('entity_id', 1).del();
            expect(
              await knex('rename_response_parent')
                .where('entity_id', 2)
                .first('ancestor_id')
            ).to.deep.equal({ [mapKey('ancestor_id')]: null });

            // The renamed primary key must still auto-increment.
            await knex('rename_response_parent').insert({ renamed_name: null });
            expect(
              await knex('rename_response_parent').whereNull('renamed_name')
            ).to.have.length(1);
          });
        }
      });
    });
});

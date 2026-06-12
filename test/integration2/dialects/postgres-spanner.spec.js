'use strict';

const { expect } = require('chai');
const {
  Db,
  getKnexForDb,
  getAllDbs,
} = require('../util/knex-instance-provider');

// Spanner supports only a subset of PostgreSQL, so it runs this focused spec
// against the emulator instead of the shared integration suite.
describe('PostgreSQL Spanner dialect', () => {
  getAllDbs()
    .filter((db) => db === Db.PostgresSpanner)
    .forEach((db) => {
      describe(db, () => {
        let knex;

        before(async () => {
          knex = getKnexForDb(db);
          await knex.raw('DROP TABLE IF EXISTS spanner_test');
          // raw DDL: Spanner needs the PRIMARY KEY inline at creation.
          await knex.raw(
            'CREATE TABLE spanner_test (id bigint NOT NULL, name varchar, value bigint, PRIMARY KEY (id))'
          );
        });

        after(async () => {
          await knex.raw('DROP TABLE IF EXISTS spanner_test');
          await knex.destroy();
        });

        it('hasTable / hasColumn reflect the live schema', async () => {
          expect(await knex.schema.hasTable('spanner_test')).to.equal(true);
          expect(await knex.schema.hasTable('does_not_exist')).to.equal(false);
          expect(await knex.schema.hasColumn('spanner_test', 'name')).to.equal(
            true
          );
          expect(
            await knex.schema.hasColumn('spanner_test', 'missing_column')
          ).to.equal(false);
        });

        it('inserts and selects rows', async () => {
          await knex('spanner_test').insert([
            { id: 1, name: 'alice', value: 10 },
            { id: 2, name: 'bob', value: 20 },
          ]);
          const names = (
            await knex('spanner_test').orderBy('id').select('name')
          ).map((row) => row.name);
          expect(names).to.eql(['alice', 'bob']);
        });

        it('filters rows with where', async () => {
          const rows = await knex('spanner_test')
            .where('name', 'bob')
            .select('name');
          expect(rows.map((row) => row.name)).to.eql(['bob']);
        });

        it('updates and deletes rows', async () => {
          await knex('spanner_test').where('id', 1).update({ name: 'alice2' });
          const updated = await knex('spanner_test')
            .where('id', 1)
            .first('name');
          expect(updated.name).to.equal('alice2');

          await knex('spanner_test').where('id', 2).del();
          const remaining = await knex('spanner_test').select('id');
          expect(remaining.length).to.equal(1);
        });

        it('columnInfo returns metadata for each column', async () => {
          const info = await knex('spanner_test').columnInfo();
          expect(Object.keys(info)).to.include.members(['id', 'name', 'value']);
          expect(info.name).to.have.property('type');
        });
      });
    });
});

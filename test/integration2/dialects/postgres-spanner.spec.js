'use strict';

const { expect } = require('chai');
const {
  Db,
  getKnexForDb,
  getAllDbs,
} = require('../util/knex-instance-provider');

// Spanner's PostgreSQL interface only implements a subset of PostgreSQL (no
// schemas, stricter typing, no migrations), so it does not run the shared
// integration suite. These tests cover the operations Spanner does support and
// exercise the dialect's own query/schema compiler overrides (columnInfo,
// hasTable, hasColumn) against the Spanner emulator via PGAdapter.
describe('PostgreSQL Spanner dialect', () => {
  getAllDbs()
    .filter((db) => db === Db.PostgresSpanner)
    .forEach((db) => {
      describe(db, () => {
        let knex;

        before(async () => {
          knex = getKnexForDb(db);
          await knex.raw('DROP TABLE IF EXISTS spanner_test');
          // Created with raw DDL: Spanner requires the PRIMARY KEY inline at
          // table creation and does not support ALTER TABLE ADD PRIMARY KEY.
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

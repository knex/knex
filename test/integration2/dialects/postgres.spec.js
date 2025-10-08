// const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
// const { getDriverName } = require('../../util/db-helpers');
const tableName = 'users_lolz_jsonb';

describe.only('Postgres dialect', () => {
  const db = getAllDbs().filter((db) => db.startsWith('postgres'))

  db.forEach((db) => {
    describe(db, () => {
      describe('Postgres', () => {
        let knex;

        before(async () => {
          knex = getKnexForDb(db);


          await knex.schema.dropTableIfExists(tableName);

          await knex.schema.createTable(tableName, t => {
            t.increments('id').primary();
            t.string('name').notNullable();
            t.string('email').notNullable();
            t.string('password').notNullable();
            t.jsonb('json_key').notNullable();
          });
        });

        after(() => {
          return knex.destroy();
        });

        // As it stands, this throws an error
        xit('Should correctly interpret string literal in JSONB raw SQL', async () => {
          const binding = 'bar_bind';
          const k = knex.select('*')
            .from(tableName)
            .whereRaw('json_key.json_value @\\? \'$.*.bar \\? (@ == "?")\'', binding);

          await k;
        });

        // https://github.com/knex/knex/issues/5189
        // This now passes
        it('Should correctly interpret ? in where clause as JSONB query clause', async () => {
          const k = knex.select('*')
            .from(tableName)
            .where('json_key', '\\?', 'json_value')

          await k;
        });

        // https://github.com/knex/knex/issues/6011
        // This works without pg-format
        it('Should correctly map json key & value in JSONB raw SQL', async () => {
          const binding = ['json_key', 'json_value'];
          const k = knex.select('*')
            .from(tableName)
            .where('id', '=', 1)
            .whereRaw('?? \\? ?', binding)

          // console.log({ toSQL: k.toSQL(), toQuery: k.toQuery() });
          const r = await k;
          console.log(r, 'r');
        });
      });
    });
  });
});
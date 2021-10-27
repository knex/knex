const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');
const {
  isPostgreSQL,
  isCockroachDB,
  isPgBased,
  isSQLite,
} = require('../../util/db-helpers');

describe('Schema', () => {
  describe('geometry columns', () => {
    getAllDbs().forEach((db) => {
      describe(db, () => {
        let knex;
        const tblName = 'table_with_geo';

        beforeEach(async () => {
          knex = getKnexForDb(db);
          await knex.schema.dropTableIfExists(tblName);
        });

        after(async () => {
          return knex.destroy();
        });

        it('Creates POINT column for supported databases', async function () {
          if (isCockroachDB(knex)) {
            return this.skip();
          }

          await knex.schema.createTable(tblName, (table) => {
            table.point('pointColumn');
          });

          if (isPostgreSQL(knex)) {
            await knex(tblName).insert({
              pointColumn: '2, 3',
            });

            const result = await knex(tblName).select('*');
            expect(result).to.eql([
              {
                pointColumn: {
                  x: 2,
                  y: 3,
                },
              },
            ]);
          }
        });

        it('Creates GEOMETRY column for supported databases', async function () {
          if (isPgBased(knex)) {
            return this.skip();
          }

          await knex.schema.createTable(tblName, (table) => {
            table.geometry('geometryColumn');
          });

          if (isPostgreSQL(knex)) {
            await knex(tblName).insert({
              geometryColumn: '2, 3',
            });

            const result = await knex(tblName).select('*');
            expect(result).to.eql([
              {
                geometryColumn: {
                  x: 2,
                  y: 3,
                },
              },
            ]);
          }

          if (isSQLite(knex)) {
            await knex(tblName).insert({
              geometryColumn: '2, 3',
            });

            const result = await knex(tblName).select('*');
            expect(result).to.eql([
              {
                geometryColumn: '2, 3',
              },
            ]);
          }
        });

        it('Creates GEOGRAPHY column for supported databases', async function () {
          if (!isSQLite(knex)) {
            return this.skip();
          }

          await knex.schema.createTable(tblName, (table) => {
            table.geography('geoColumn');
          });

          await knex(tblName).insert({
            geoColumn: '2, 3',
          });

          const result = await knex(tblName).select('*');
          expect(result).to.eql([
            {
              geoColumn: '2, 3',
            },
          ]);
        });
      });
    });
  });
});

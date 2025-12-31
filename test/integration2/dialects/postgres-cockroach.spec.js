/** @typedef {import('../../../types/index').Knex} Knex */

const { expect } = require('chai');
const {
  getKnexForDb,
  Db,
  getAllDbs,
} = require('../util/knex-instance-provider');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('PostgreSQL & Cockroach DB', () => {
  const dbs = getAllDbs().filter((db) =>
    [Db.PostgresSQL, Db.PgNative, Db.CockroachDB].includes(db)
  );

  dbs.forEach((db) => {
    describe(db, () => {
      /** @type {Knex} */
      let knex;
      before(() => {
        knex = getKnexForDb(db);
      });

      after(async () => {
        await knex.destroy();
      });

      describe('when schema building', () => {
        describe('with default datetime precision specified', () => {
          const CONFIGURED_DEFAULT_DATETIME_PRECISION = 2;

          /** @type {Knex} */
          let knex;
          before(() => {
            knex = getKnexForDb(db, {
              connection: {
                defaultDateTimePrecision: CONFIGURED_DEFAULT_DATETIME_PRECISION,
              },
            });
          });

          after(async () => {
            await knex.destroy();
          });

          const checkColMetadata = async (tableName) => {
            const result = await knex.schema.raw(`
            SELECT * FROM information_schema.columns WHERE table_name = '${tableName}'
            `);

            const keyedResults = {};
            for (const row of result.rows || []) {
              // cast datetime_precision to number, since it gets returned as a string for some reason on cockroachdb
              if (row['datetime_precision']) {
                row['datetime_precision'] = parseInt(row['datetime_precision']);
              }

              keyedResults[row['column_name']] = row;
            }

            return keyedResults;
          };

          it('if default datetime precision specified, it gets used when creating datetime/timestamp fields', async () => {
            const tableName = 'default_datetime_precision_test_' + Date.now();
            const colTimestamp = 'timestamp_field';
            const colDatetime = 'datetime_field';
            const colCreatedAt = 'created_at';
            const colUpdatedAt = 'updated_at';

            await knex.schema.createTable(tableName, (table) => {
              table.timestamp(colTimestamp);
              table.datetime(colDatetime);
              table.timestamps();
            });

            const metaData = await checkColMetadata(tableName);
            expect(metaData[colTimestamp]['datetime_precision']).to.eq(
              CONFIGURED_DEFAULT_DATETIME_PRECISION
            );
            expect(metaData[colDatetime]['datetime_precision']).to.eq(
              CONFIGURED_DEFAULT_DATETIME_PRECISION
            );
            expect(metaData[colCreatedAt]['datetime_precision']).to.eq(
              CONFIGURED_DEFAULT_DATETIME_PRECISION
            );
            expect(metaData[colUpdatedAt]['datetime_precision']).to.eq(
              CONFIGURED_DEFAULT_DATETIME_PRECISION
            );
          });

          it('if default datetime precision specified, it gets used when altering datetime/timestamp fields', async function () {
            const tableName = 'default_datetime_precision_test_' + Date.now();
            const colTimestamp = 'timestamp_field';
            const colDatetime = 'datetime_field';

            const initialPrecision = 5;

            await knex.schema.createTable(tableName, (table) => {
              table.timestamp(colTimestamp, {
                precision: initialPrecision,
              });
              table.datetime(colDatetime, { precision: initialPrecision });
            });

            const metaData = await checkColMetadata(tableName);
            expect(metaData[colTimestamp]['datetime_precision']).to.eq(
              initialPrecision
            );
            expect(metaData[colDatetime]['datetime_precision']).to.eq(
              initialPrecision
            );

            for (let i = 0; i < 5; i++) {
              try {
                await knex.schema.alterTable(tableName, (table) => {
                  table.timestamp(colTimestamp).alter();
                  table.datetime(colDatetime).alter();
                });
                break;
              } catch (e) {
                // this test could be flaky; it's unclear if there's a way to wait
                // on schema changes to propagate, so we'll just retry after a delay
                // for the time being
                if (/currently undergoing a schema change/.test(e.message)) {
                  console.warn(
                    `waiting for crdb changes to propagate ${i + 1}/5`
                  );
                  await delay(200);
                } else {
                  throw e;
                }
              }
            }

            const newMetaData = await checkColMetadata(tableName);
            expect(newMetaData[colTimestamp]['datetime_precision']).to.eq(
              CONFIGURED_DEFAULT_DATETIME_PRECISION
            );
            expect(newMetaData[colDatetime]['datetime_precision']).to.eq(
              CONFIGURED_DEFAULT_DATETIME_PRECISION
            );
          });
        });
      });
    });
  });
});

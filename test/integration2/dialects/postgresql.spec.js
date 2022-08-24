const { expect } = require('chai');
const {
  getAllDbs,
  getKnexForDb,
  Db,
  getDbTestConfig,
} = require('../util/knex-instance-provider');

describe('PostgreSQL dialect', () => {
  const dbs = getAllDbs().filter((db) => db === Db.PostgresSQL);

  dbs.forEach((db) => {
    describe(db, () => {
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

          let knex;
          before(() => {
            const testConfig = getDbTestConfig(db);
            testConfig.connection.defaultDateTimePrecision =
              CONFIGURED_DEFAULT_DATETIME_PRECISION;
            knex = getKnexForDb(db, testConfig);
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

          it('if default datetime precision specified, it gets used when updating datetime/timestamp fields', async () => {
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

            await knex.schema.alterTable(tableName, (table) => {
              table.timestamp(colTimestamp).alter();
              table.datetime(colDatetime).alter();
            });

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

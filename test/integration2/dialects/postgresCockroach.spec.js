const { expect } = require('chai');
const {
  getKnexForDb,
  Db,
  getDbTestConfig,
} = require('../util/knex-instance-provider');

describe('PostgreSQL & Cockroach DB', () => {
  const dbs = [Db.PostgresSQL, Db.CockroachDB];

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

          // cockroachdb doesn't support altering columns at this point in time? https://github.com/cockroachdb/cockroach/issues/49329
          it('if default datetime precision specified, it gets used when altering datetime/timestamp fields', async function () {
            if (db !== Db.CockroachDB) {
              this.skip();
              return;
            }

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

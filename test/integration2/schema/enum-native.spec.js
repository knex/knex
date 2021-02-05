const { expect } = require('chai');
const {
  Db,
  getAllDbs,
  getKnexForDb,
} = require('../util/knex-instance-provider');

describe('Schema', () => {
  describe('native enum columns', () => {
    getAllDbs()
      // enum useNative is only supported by Postgres
      .filter((db) => db === Db.PostgresSQL)
      .forEach((db) => {
        describe(db, () => {
          let knex;
          const tblName = 'table_with_native_enum';
          const enumColumns = [
            {
              column: 'enum_col1',
              values: ['foo', 'bar'],
              typeName: 'test_enum1',
            },
            {
              column: 'enum_col2',
              values: ['baz', 'qux'],
              typeName: 'test_enum2',
            },
          ];

          before(async () => {
            knex = getKnexForDb(db);
            await knex.schema.dropTableIfExists(tblName);

            for (const enumColumn of enumColumns) {
              await knex.raw(`DROP TYPE IF EXISTS ${enumColumn.typeName}`);
            }

            await knex.schema.createTable(tblName, (table) => {
              for (const enumColumn of enumColumns) {
                table.enum(enumColumn.column, enumColumn.values, {
                  useNative: true,
                  enumName: enumColumn.typeName,
                });
              }
            });
          });

          after(async () => {
            await knex.schema.dropTable(tblName);

            for (const enumColumn of enumColumns) {
              await knex.raw(`DROP TYPE ${enumColumn.typeName}`);
            }

            return knex.destroy();
          });

          it('Creates native enums', async () => {
            for (const enumColumn of enumColumns) {
              const res = await knex
                .select('data_type', 'udt_name')
                .from('information_schema.columns')
                .where({ table_name: tblName, column_name: enumColumn.column });

              expect(res[0].data_type).to.equal('USER-DEFINED');
              expect(res[0].udt_name).to.equal(enumColumn.typeName);
            }
          });

          describe('Altering', async () => {
            const enumColumn = enumColumns[0].column;
            const enumTypeName = 'alter_test_enum';

            before(async () => {
              await knex.raw(`DROP TYPE IF EXISTS ${enumTypeName}`);
            });

            after(async () => {
              await knex.schema.alterTable(tblName, (table) => {
                table.dropColumn(enumColumn);
              });
              await knex.raw(`DROP TYPE ${enumTypeName}`);
            });

            it('Allows altering native enums', async () => {
              await knex.schema.alterTable(tblName, (table) => {
                table
                  .enum(enumColumn, ['altered', 'values'], {
                    useNative: true,
                    enumName: enumTypeName,
                  })
                  .alter();
              });

              const res = await knex
                .select('data_type', 'udt_name')
                .from('information_schema.columns')
                .where({ table_name: tblName, column_name: enumColumn });

              expect(res[0].data_type).to.equal('USER-DEFINED');
              expect(res[0].udt_name).to.equal(enumTypeName);
            });
          });
        });
      });
  });
});

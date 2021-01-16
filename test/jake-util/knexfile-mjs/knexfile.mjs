/** @type {import("../../../").Config} */
const config = {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite3',
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'mjs',
    loadExtensions: ['.mjs']
  },
  seeds: {
    extension: 'mjs',
    loadExtensions: ['.mjs']
  }
};
/** ignored by knex */
export default config;
/** Named exports: or knex won't find them */
export const { client, connection, useNullAsDefault, migrations , seeds } = config;
/** @type {import("../../../").Config} */
const config = {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite3',
  },
  useNullAsDefault: true,
};
export default config;
/** Named exports: or knex won't find them */
export const { client, connection, useNullAsDefault } = config;

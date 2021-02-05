/** @type {import("../../../").Config} */
const config = {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite3',
  },
  useNullAsDefault: true,
};
/** Named export */
export const { client, connection, useNullAsDefault } = config;

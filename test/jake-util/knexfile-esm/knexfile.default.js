/** @type {import("../../../").Config} */
export default {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite3',
  },
  useNullAsDefault: true,
};

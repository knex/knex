/** @type {import("../../../").Config} */
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: './test.sqlite3',
  },
  useNullAsDefault: true,
};

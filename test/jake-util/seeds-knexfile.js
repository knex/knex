module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/../test.sqlite3',
  },
  seeds: {
    directory: __dirname + '/seeds',
  },
};

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/../test.sqlite3',
  },
  migrations: {
    directory: __dirname + '/../knexfile-stubs',
    stub: 'table.stub',
  },
  seeds: {
    directory: __dirname + '/../knexfile-stubs',
    stub: 'seed.stub',
  },
};

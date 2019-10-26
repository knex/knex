module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/../test.sqlite3',
  },
  migrations: {
    directory: __dirname + '/../knexfile_migrations',
  },
  seeds: {
    directory: __dirname + '/../knexfile_seeds',
  },
};

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/../test.sqlite3',
  },
  useNullAsDefault: true,
  migrations: {
    directory: './knexfile_migrations',
  },
  seeds: {
    directory: './knexfile_seeds',
  },
};

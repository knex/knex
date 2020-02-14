// This knexfile recreates the issue that was identified here:
//
//   https://github.com/knex/knex/issues/3660
//

const path = require('path');

// Notice: this path will resolve relative to `process.cwd()` .
// This will cause a problem if the Knex CLI opens the knexfile
// before changing the cwd.
const MIGRATIONS_DIR = path.resolve('knexfile_migrations');

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/../test.sqlite3',
  },
  migrations: {
    directory: MIGRATIONS_DIR,
  },
  seeds: {
    directory: './knexfile_seeds',
  },
};

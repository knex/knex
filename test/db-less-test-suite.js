const { initTests } = require('./testInitializer');

initTests();

describe('Util Tests', function () {
  // Unit Tests for utilities.
  require('./unit/query/string');
  require('./unit/util/fs');
});

describe('Query Building Tests', function () {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);

  require('./unit/query/builder');
  require('./unit/schema/mysql')('mysql');
  require('./unit/schema/mysql')('mysql2');
  require('./unit/schema/postgres');
  require('./unit/schema/redshift');
  require('./unit/schema/sqlite3');
  require('./unit/schema/oracle');
  require('./unit/schema/mssql');
  require('./unit/schema/oracledb');
  require('./unit/migrate/migration-list-resolver');
  require('./unit/seed/seeder');
  // require('./unit/interface'); ToDo Uncomment after fixed
  require('./unit/knex');
});

const config = require('./knexfile');
if (config.oracledb) {
  describe('Oracledb driver tests', function () {
    this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
    require('./unit/dialects/oracledb');
  });
}

if (config.postgres) {
  require('./unit/dialects/postgres');
}

if (config.sqlite3) {
  describe('Sqlite driver tests', function () {
    this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
    require('./unit/dialects/sqlite3');
  });
}

describe('CLI tests', function () {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  require('./cli/help.spec');
  require('./cli/knexfile-test.spec');
  require('./cli/migrate.spec');
  require('./cli/migrate-make.spec');
  require('./cli/seed.spec');
  require('./cli/seed-make.spec');
  require('./cli/version.spec');
});

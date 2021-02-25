const { initTests } = require('./testInitializer');

initTests();

describe('Util Tests', function () {
  // Unit Tests for utilities.
  require('./unit/query/string');
  require('./unit/migrations/util/fs');
  require('./unit/migrations/util/is-module-type');
  require('./unit/util/nanoid');
  require('./unit/util/save-async-stack');
  require('./unit/util/comma-no-paren-regex');
});

describe('Query Building Tests', function () {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);

  require('./unit/query/builder');
  require('./unit/query/formatter');
  require('./unit/query/string');
  require('./unit/schema-builder/mysql')('mysql');
  require('./unit/schema-builder/mysql')('mysql2');
  require('./unit/schema-builder/postgres');
  require('./unit/schema-builder/redshift');
  require('./unit/schema-builder/sqlite3');
  require('./unit/schema-builder/oracle');
  require('./unit/schema-builder/mssql');
  require('./unit/schema-builder/oracledb');
  require('./unit/migrations/migrate/migration-list-resolver');
  require('./unit/migrations/seed/seeder');
  // require('./unit/interface'); ToDo Uncomment after fixed
  require('./unit/knex');
});

const config = require('./knexfile');
if (config.mssql) {
  describe('MSSQL driver tests', function () {
    this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
    require('./unit/dialects/mssql');
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
  require('./cli/esm-interop.spec');
});

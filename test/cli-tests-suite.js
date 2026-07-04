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
  require('./cli/migrate-disable-transactions.spec');
});

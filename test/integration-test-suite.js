const { initTests } = require('./testInitializer');

initTests();

describe('Integration Tests', function () {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  require('./integration');
});

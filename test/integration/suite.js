'use strict';

const { isOracle } = require('../util/db-helpers');

module.exports = function (knex) {
  describe(knex.client.dialect + ' | ' + knex.client.driverName, function () {
    this.client = knex.client.dialect;
    this.driverName = knex.client.driverName;

    after(function () {
      return knex.destroy();
    });

    if (isOracle(knex)) {
      describe('Oracledb driver tests', function () {
        this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
        require('./dialects/oracledb');
      });
    }

    require('./seed')(knex);
    require('./query/aggregate')(knex);
    require('./execution/transaction')(knex);
    require('./query/deletes')(knex);
    require('./query/trigger-inserts')(knex);
    require('./query/trigger-updates')(knex);
    require('./query/trigger-deletes')(knex);
    require('./datatype/bigint')(knex);
    require('./datatype/decimal')(knex);
    require('./datatype/double')(knex);
  });
};

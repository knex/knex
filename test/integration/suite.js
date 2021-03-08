'use strict';

const { expect } = require('chai');
const { isOracle } = require('../util/db-helpers');

module.exports = function (knex) {
  const sinon = require('sinon');

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

    require('./schema')(knex);
    require('./schema/foreign-keys')(knex);
    require('./migrate/migration-integration-tests')(knex);

    require('./seed')(knex);
    require('./query/inserts')(knex);
    require('./query/selects')(knex);
    require('./query/unions')(knex);
    require('./query/joins')(knex);
    require('./query/aggregate')(knex);
    require('./query/updates')(knex);
    require('./execution/transaction')(knex);
    require('./query/deletes')(knex);
    require('./query/trigger-inserts')(knex);
    require('./query/trigger-updates')(knex);
    require('./query/trigger-deletes')(knex);
    require('./query/additional')(knex);
    require('./datatype/bigint')(knex);
    require('./datatype/decimal')(knex);
    require('./datatype/double')(knex);

    describe('knex.destroy', function () {
      it('should allow destroying the pool with knex.destroy', function () {
        const spy = sinon.spy(knex.client.pool, 'destroy');
        return knex
          .destroy()
          .then(function () {
            expect(spy).to.have.callCount(1);
            expect(knex.client.pool).to.equal(undefined);
            return knex.destroy();
          })
          .then(function () {
            expect(spy).to.have.callCount(1);
          });
      });
    });
  });

  describe('knex.initialize', function () {
    it('should allow initialize the pool with knex.initialize', function () {
      expect(knex.client.pool).to.equal(undefined);
      knex.initialize();
      expect(knex.client.pool.destroyed).to.equal(false);
      const waitForDestroy = knex.destroy();
      expect(knex.client.pool.destroyed).to.equal(true);
      return waitForDestroy.then(() => {
        expect(knex.client.pool).to.equal(undefined);
        knex.initialize();
        expect(knex.client.pool.destroyed).to.equal(false);
      });
    });
  });
};

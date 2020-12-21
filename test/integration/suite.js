'use strict';

const { expect } = require('chai');

module.exports = function (knex) {
  const sinon = require('sinon');

  describe(knex.client.dialect + ' | ' + knex.client.driverName, function () {
    this.client = knex.client.dialect;
    this.driverName = knex.client.driverName;

    after(function () {
      return knex.destroy();
    });

    if (this.driverName === 'oracledb') {
      describe('Oracledb driver tests', function () {
        this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
        require('./dialects/oracledb');
      });
    }

    require('./schema')(knex);
    require('./schema/foreign-keys')(knex);
    require('./migrate/migration-integration-tests')(knex);

    require('./seed')(knex);
    require('./builder/inserts')(knex);
    require('./builder/selects')(knex);
    require('./builder/unions')(knex);
    require('./builder/joins')(knex);
    require('./builder/aggregate')(knex);
    require('./builder/updates')(knex);
    require('./builder/transaction')(knex);
    require('./builder/deletes')(knex);
    require('./builder/trigger-inserts')(knex);
    require('./builder/trigger-updates')(knex);
    require('./builder/trigger-deletes')(knex);
    require('./builder/additional')(knex);
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

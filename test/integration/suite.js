'use strict';

const { expect } = require('chai');

module.exports = function(knex) {
  const sinon = require('sinon');

  describe(knex.client.dialect + ' | ' + knex.client.driverName, function() {
    this.client = knex.client.dialect;
    this.driverName = knex.client.driverName;

    after(function() {
      return knex.destroy();
    });

    require('./schema')(knex);
    require('./migrate')(knex);

    require('./seed')(knex);
    require('./builder/inserts')(knex);
    require('./builder/selects')(knex);
    require('./builder/unions')(knex);
    require('./builder/joins')(knex);
    require('./builder/aggregate')(knex);
    require('./builder/updates')(knex);
    require('./builder/transaction')(knex);
    require('./builder/deletes')(knex);
    require('./builder/additional')(knex);
    require('./datatype/bigint')(knex);

    describe('knex.destroy', function() {
      it('should allow destroying the pool with knex.destroy', function() {
        const spy = sinon.spy(knex.client.pool, 'destroy');
        return knex
          .destroy()
          .then(function() {
            expect(spy).to.have.callCount(1);
            expect(knex.client.pool).to.equal(undefined);
            return knex.destroy();
          })
          .then(function() {
            expect(spy).to.have.callCount(1);
          });
      });
    });
  });

  describe('knex.initialize', function() {
    it('should allow initialize the pool with knex.initialize', function() {
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

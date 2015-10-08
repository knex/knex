/*global expect, describe, it*/

'use strict';

module.exports = function(knex) {
  var sinon = require('sinon');
  var Pool2 = require('pool2');

  describe(knex.client.dialect + ' | ' + knex.client.driverName, function() {

    this.dialect    = knex.client.dialect;
    this.driverName = knex.client.driverName;

    before(function () {
      return knex.initialize(knex.client.config)
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

    describe('knex.initialize', function() {
      it('should allow reinitializing the pool with knex.initialize', function() {
        var spy = sinon.spy(knex.client.pool, 'end');
        return knex.initialize(knex.client.config)
        .then(function () {
          expect(knex.client.pool).to.be.an.instanceof(Pool2);
          expect(spy).to.have.callCount(1);
        });
      });
    });

    describe('knex.destroy', function() {
      it('should allow destroying the pool with knex.destroy', function() {
        var spy = sinon.spy(knex.client.pool, 'end');
        return knex.destroy().then(function() {
          expect(spy).to.have.callCount(1);
          expect(knex.client.pool).to.equal(undefined);
          return knex.destroy();
        }).then(function() {
          expect(spy).to.have.callCount(1);
        });
      });
    });
  });

};

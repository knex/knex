var _           = require('lodash');
var Promise     = testPromise;
var Pool        = require('../../../clients/pool').Pool;
var GenericPool = require('generic-pool-redux').Pool;

describe('Pool', function () {

  var connStub = function() {
    return Promise.fulfilled({end: function() {}});
  };

  describe('constructor', function() {

    it('creates an instance of the pool in the `poolInstance` property', function() {

      var pool = new Pool({}, {getRawConnection: function() { return connStub(); }});

      expect(pool.poolInstance).to.be.an.instanceOf(GenericPool);

    });

  });

  describe('destroy', function() {

    it('removes the poolInstance', function() {

      var pool = new Pool({}, {getRawConnection: function() { return connStub(); }});

      pool.destroy();

      expect(pool.poolInstance).to.be.undefined;

    });

    it('calls a callback on success', function(ok) {

      var pool = new Pool({}, {getRawConnection: function() { return connStub(); }});

      pool.destroy(function() {
        ok();
      });

    });

    it('does not fail with subsequent destroy calls', function(ok) {

      var pool = new Pool({}, {getRawConnection: function() { return connStub(); }});

      pool.destroy();

      pool.destroy(function() {
        ok();
      });

    });

  });

});

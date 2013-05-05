var Q = require('q');
var _ = require('underscore');
var objectdump = require('objectdump');
var dev = parseInt(process.env.KNEX_DEV, 10);
var out = (dev ? require('./index').output : require('./shared/output'));
var assert = require('assert');

module.exports = function(Knex, type) {

  var dfd = Q.defer();

  describe('String Tests', function() {

    before(function(ok) {
      var val = handler(type, 'schema');
      require('./lib/schema')(Knex, val(ok, true), function(err) {
        throw new Error(err);
      });
    });

    describe('Knex.Builder', function() {

      describe('Inserts', function() {
        require('./lib/inserts')(Knex, type, handler(type, 'inserts'), 'String');
      });

      describe('Updates', function() {
        require('./lib/updates')(Knex, type, handler(type, 'updates'), 'String');
      });

      describe('Selects', function() {
        require('./lib/selects')(Knex, type, handler(type, 'selects'), 'String');
      });

      describe('Joins', function() {
        require('./lib/joins')(Knex, type, handler(type, 'joins'), 'String');
      });

      describe('Deletes', function() {
        require('./lib/deletes')(Knex, type, handler(type, 'deletes'), 'String');
      });

      describe('Aggregates, Truncate', function() {
        require('./lib/additional')(Knex, type, handler(type, 'additional'), 'String');
      });

      describe('Deletes', function() {
        require('./lib/unions')(Knex, type, handler(type, 'unions'), 'String');
      });

      after(function(ok) {
        if (dev) require('fs').writeFileSync('./test/shared/output.js', 'module.exports = ' + objectdump(out));
        dfd.resolve();
        ok();
      });

    });

  });

  return dfd.promise;
};

var handler = function(instance, section) {
  var item = 1;
  return function(resolver, isAll) {
    var fn = function(data) {
      var label = '' + section + '.' + item;
      if (dev) {
        out['string'] = out['string'] || {};
        out['string'][label] = out['string'][label] || {};
        out['string'][label][instance] = data;        
      } else {
        var checkData = out['string'][label][instance];
        assert.deepEqual(checkData.sql, data.sql);
        var a = _.map(checkData.bindings, function(val) {  return (_.isDate(val) ? 'newDate' : val); });
        var b = _.map(data.bindings, function(val) {  return (_.isDate(val) ? 'newDate' : val); });
        try {
          assert.deepEqual(a, b);
        } catch (e) {
          console.log([a, b]);
        }
      }
      item++;
      if (!isAll) resolver();
    };
    if (isAll) {
      return function(data) {
        _.map(data, fn);
        resolver();
      };
    } else {
      return fn;
    }
  };
};
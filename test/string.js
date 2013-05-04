var Q      = require('q');
var _      = require('underscore');
var objectdump = require('objectdump');
var out = require('./index').output;

var handler = function(instance, section) {
  var item = 1;
  return function(resolver) {
    return function(data) {
      var label = '' + section + '.' + item;
      out['string'] = out['string'] || {};
      out['string'][label] = out['string'][label] || {};
      out['string'][label][instance] = data;
      item++;
      resolver();
    };
  };
};

module.exports = function(Knex, type) {

  var dfd = Q.defer();

  describe('String Tests', function() {

    describe('Knex.SchemaBuilder', function() {
      require('./lib/schema')(Knex, type, handler(type, 'schema'), 'String');
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

      describe('Deletes', function() {
        require('./lib/deletes')(Knex, type, handler(type, 'deletes'), 'String');
      });

      describe('Aggregates, Truncate', function() {
        // require('./lib/aggregate')(Knex, type, handler(type, 'aggregate'), 'String');
      });

      describe('Deletes', function() {
        require('./lib/unions')(Knex, type, handler(type, 'unions'), 'String');
      });

      after(function(ok) {
        require('fs').writeFileSync('./test/shared/output.js', 'module.exports = ' + objectdump(out));
        dfd.resolve();
        ok();
      });

    });

  });

  return dfd.promise;
};
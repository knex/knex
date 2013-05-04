var Q      = require('q');
var _      = require('underscore');

var handler = function(instance, section) {
  var item = 1;
  return function(resolver) {
    return function(data) {
      // if (_.isArray(data)) console.log(data);
      var label = '' + section + '.' + item;
      obj[label] = obj[label] || {};
      obj[label][instance] = data;
      item++;
      resolver();
    };
  };
};

module.exports = function(Knex, type) {

  describe('DB Tests - ' + type, function() {

    describe('Knex.SchemaBuilder', function() {
      require('./lib/schema')(Knex, type, handler(type, 'schema'), 'DB');
    });

    describe('Knex.Builder', function() {

      describe('Inserts', function() {
        require('./lib/inserts')(Knex, type, handler(type, 'inserts'), 'DB');
      });

      describe('Updates', function() {
        require('./lib/updates')(Knex, type, handler(type, 'updates'), 'DB');
      });

      describe('Selects', function() {
        require('./lib/selects')(Knex, type, handler(type, 'selects'), 'DB');
      });

      describe('Deletes', function() {
        require('./lib/deletes')(Knex, type, handler(type, 'deletes'), 'DB');
      });

      describe('Aggregates, Truncate', function() {
        // require('./lib/aggregate')(Knex, type, handler(type, 'aggregate'), 'DB');
      });

      describe('Deletes', function() {
        require('./lib/unions')(Knex, type, handler(type, 'unions'), 'DB');
      });

    });

  });

};
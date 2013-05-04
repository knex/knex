var Q      = require('q');
var _      = require('underscore');
var objectdump = require('objectdump');
var out    = require('./index').output;

var handler = function(instance, section) {
  var item = 1;
  return function(resolver, isAll) {
    var fn = function(data) {
      if (instance === 'mysql') {
        if (section === 'inserts') {
          data = data[0].affectedRows;
        } else if (section === 'updates') {
          data = data[0].affectedRows;
        } else if (section === 'selects') {
          data = skim(data[0]);
        } else {
          data = '';
        }
      } else {
        data = '';
      }
      var label = '' + section + '.' + item;
      out['db'] = out['db'] || {};
      out['db'][label] = out['db'][label] || {};
      out['db'][label][instance] = data;
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

var skim = function(data) {
  return _.map(data, function(obj) {
    return _.pick(obj, _.keys(obj));
  });
};

module.exports = function(Knex, type) {

  describe('DB Tests - ' + type, function() {

    before(function(ok) {
      Q.all([
        Knex.Schema.dropTableIfExists('test_table_one'),
        Knex.Schema.dropTableIfExists('test_table_two'),
        Knex.Schema.dropTableIfExists('test_table_three'),
        Knex.Schema.dropTableIfExists('accounts')
      ]).done(function() {
        ok();
      }, ok);
    });

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

      after(function(ok) {
        require('fs').writeFileSync('./test/shared/output.js', 'module.exports = ' + objectdump(out));
        ok();
      });

    });

  });

};
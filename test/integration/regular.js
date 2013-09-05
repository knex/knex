var When = require('when');
var _ = require('underscore');
var objectdump = require('objectdump');
var dev = parseInt(process.env.KNEX_DEV, 10);
var out = (dev ? require('./index').output : require('./shared/output'));
var assert = require('assert');

module.exports = function(Knex, dbType) {

  var dfd = When.defer();

  describe('DB Tests - ' + dbType, function() {

    describe('Knex.Builder', function() {

      before(function(ok) {
        var val = handler(dbType, 'schema');
        require('./lib/schema')(Knex, function(output) {
          output = _.map(output, function(item) {
            delete item['object'];
            return item;
          });
          val(ok, true)(output);
        }, function(err) {
          ok(err);
        }, dbType);
      });

      describe('Schema Tests', function() {
        require('./lib/schema-tests')(Knex, dbType, handler(dbType, 'schema-tests'));
      });

      describe('Inserts', function() {
        require('./lib/inserts')(Knex, dbType, handler(dbType, 'inserts'));
      });

      describe('Updates', function() {
        require('./lib/updates')(Knex, dbType, handler(dbType, 'updates'));
      });

      describe('Selects', function() {
        require('./lib/selects')(Knex, dbType, handler(dbType, 'selects'));
      });

      describe('Aggregate', function() {
        require('./lib/aggregate')(Knex, dbType, handler(dbType, 'aggregate'));
      });

      describe('Joins', function() {
        require('./lib/joins')(Knex, dbType, handler(dbType, 'joins'));
      });

      describe('Transaction', function() {
        require('./lib/transaction')(Knex, dbType, handler(dbType, 'transaction'));
      });

      describe('Deletes', function() {
        require('./lib/deletes')(Knex, dbType, handler(dbType, 'deletes'));
      });

      describe('Aggregates, Truncate', function() {
        require('./lib/additional')(Knex, dbType, handler(dbType, 'additional'));
      });

      describe('Unions', function() {
        require('./lib/unions')(Knex, dbType, handler(dbType, 'unions'));
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

// Helps to eliminate the amount of code we need to write when
// testing the lib, we can just pass the response of the runQuery
// into this convenient "handler" function, which will write to an output
// object which section we're in, what the output is, and stuff like that
// while in development. While in normal mode, it'll check against that output.
// This should make it pretty easy to just write queries as we normally would
// and then spot check that the output being generated looks good to go...
var handler = function(instance, section) {
  var item = 1;

  // The `isAll` allows us to run a bunch of queries in a `When.all`
  // and then split those out into individual items.
  return function(resolver, isAll) {

    // Processes an individual query output from the modified`runQuery`.
    var processItem = function(data) {
      var label = section + '.' + item;

      // Process the "string" and "object" outputs.
      _.each(['string', 'object'], function(type) {

        var typeData = data[type];

        // If we explicity deleted the type, don't do anything;
        if (typeData == void 0) return;

        // If we're in development mode, based on the KNEX_DEV env flag,
        // write to the output object, to go ahead and objectdump...
        if (dev) {
          out[type] || (out[type] = {});
          out[type][label] || (out[type][label] = {});
          if (type === 'object') {
            if (_.isArray(typeData)) typeData = _.map(typeData, omitDates);
          }
          out[type][label][instance] = typeData;
        } else {
          var checkData = out[type][label][instance];
          try {
            // If we're on the object,
            if (type === 'object') {
              if (_.isArray(typeData)) {
                typeData = _.map(typeData, omitDates);
                checkData = _.map(checkData, omitDates);
              }
              assert.deepEqual(checkData, typeData);
            } else {
              assert.deepEqual(checkData.sql, typeData.sql);
              assert.deepEqual(_.map(checkData.bindings, omitDates), _.map(typeData.bindings, omitDates));
            }
          } catch (e) {
            console.log(typeData.sql);
            console.log(checkData.sql);
            resolver(e);
          }
        }
      });
      item++;
      if (!isAll) resolver();
    };

    // Process the `data` on the function.
    return function(data) {
      if (isAll) {
        _.map(data, processItem);
        resolver();
      } else {
        processItem(data);
      }
    };
  };
};

// Dates change, so let's leave those out.
var omitDates = function(item) {
  if (_.isObject(item)) {
    return _.omit(item, 'created_at', 'updated_at');
  } else if (_.isDate(item)) {
    return 'newDate';
  }
  return item;
};


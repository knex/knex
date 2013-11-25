var isDev         = parseInt(process.env.KNEX_DEV, 10);

var _             = require('lodash');
var Common        = require('../../lib/common').Common;
var Raw           = require('../../lib/raw').Raw;
var Builder       = require('../../lib/builder').Builder;
var SchemaBuilder = require('../../lib/schemabuilder').SchemaBuilder;

var fs            = require('fs');
var objectdump    = require('objectdump');

// This is where all of the info from the query calls goes...
var output     = {};
var comparable = {};
var counters   = {};

exports.setLib = function(context) {

  Raw.prototype.logMe = SchemaBuilder.prototype.logMe = Builder.prototype.logMe = function(logWhat) {
    this.isLogging = logWhat || true;
    return this;
  };

  Raw.prototype.then = SchemaBuilder.prototype.then = Builder.prototype.then = function(onFufilled, onRejected) {

    this._promise || (this._promise = this.client.query(this));

    var then = this;

    if (this.isLogging) {

      var title   = context.test.title;
      var parent  = generateTitle(context.test).pop();
      var dialect = this.client.dialect;

      if (!isDev && !comparable[parent]) {
        comparable[parent] = require(__dirname + '/output/' + parent);
      }

      // If we're not only logging the result for this query...
      if (this.isLogging !== 'result') {
        var bindings = this.getBindings();
        checkIt('sql', title, parent, dialect, {sql: this.toSql(), bindings: this.getBindings()});
      }
    }

    return this._promise.tap(function(resp) {

      // If we're not only logging the sql for this query...
      if (then.isLogging && then.isLogging !== 'sql') {
        checkIt('result', title, parent, dialect, {result: resp});
      }

    }).then(onFufilled, onRejected);
  };

  var checkIt = function(type, title, parent, dialect, data) {
    output[parent] = output[parent] || {};
    output[parent][title] = output[parent][title] || {};
    var toCheck, target = output[parent][title][dialect] = output[parent][title][dialect] || {};

    try {
      toCheck = comparable[parent][title][dialect];
    } catch (e) {
      if (!isDev) throw e;
    }

    var items = type === 'sql' ? ['bindings', 'sql'] : ['result'];

    if (!isDev) {

      // If there are multiple statements in the same block...
      if (type === 'sql' && _.isArray(toCheck.bindings) && _.isArray(toCheck.bindings[0])) {
        if (_.has(counters, ''+type+title+parent+dialect+'sql')) {
          counters[type+title+parent+dialect+'sql']++;
        } else {
          counters[type+title+parent+dialect+'sql'] = 0;
        }
      }

      if (type === 'result' && _.isArray(toCheck.result) && _.isArray(toCheck.result[0])) {
        if (_.has(counters, ''+type+title+parent+dialect+'result')) {
          counters[type+title+parent+dialect+'result']++;
        } else {
          counters[type+title+parent+dialect+'result'] = 0;
        }
      }

      _.each(items, function(item) {

        var localData = toCheck[item];

        // If there's a counter for this item, there are multiple in the same block,
        // check against the correct one...
        if (_.has(counters, ''+type+title+parent+dialect+type)) {
          localData = localData[counters[''+type+title+parent+dialect+type]];
        }

        var newData = data[item];

        // Mutate the bindings arrays to not check dates.
        if (item === 'bindings') {
          parseBindingDates(newData, localData);
        } if (item === 'result') {
          parseResultDates(newData, localData);
        }

        expect(localData).to.eql(newData);
      });


    } else {

      _.each(items, function(item) {

        if (target[item]) {
          target[item] = [target[item]];
          target[item].push(data[item]);
        } else {
          target[item] = data[item];
        }

      });

    }

  };

  var parseResultDates = function(newData, localData) {
    _.each([newData, localData], function(item) {
      if (_.isObject(item)) {
        _.each(item, function(row, i) {
          item[i] = _.omit(row, 'created_at', 'updated_at');
        });
      }
    });
  };

  var parseBindingDates = function(newData, localData) {
    _.each(localData, function(item, index) {
      if (_.isDate(item)) {
        localData[index] = '_date_';
        newData[index]   = '_date_';
      }
    });
  };

  var generateTitle = function(context, stack) {
    stack = stack || [];
    if (context.parent && context.parent.title.indexOf('Dialect') !== 0) {
      stack.push(context.parent.title);
      return generateTitle(context.parent, stack);
    }
    return stack;
  };

};

exports.writeResult = function() {
  if (!isDev) return;
  _.each(output, function(val, key) {
    fs.writeFileSync(__dirname + '/output/' + key + '.js', 'module.exports = ' + objectdump(val) + ';');
  });
};


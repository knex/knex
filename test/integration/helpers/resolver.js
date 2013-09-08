// Helps to eliminate the amount of code we need to write when
// testing the lib, we can examine the object at the time the `then` method
// is called to coerce into a promise, which will write to an output
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


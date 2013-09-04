
  var _ = require('underscore');

  var Helpers = exports.Helpers = {

    capitalize: function(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    },

    // Sorts an object based on the names.
    sortObject: function(obj) {
      return _.sortBy(_.pairs(obj), function(a) {
        return a[0];
      });
    },

    // Sets up a multi-query to be executed with serial promises.
    multiQuery: function(builder, i, chain) {
      if (chain) {
        return function() {
          return Helpers.multiQuery(builder, i);
        };
      }
      return builder.client.query(_.extend({}, builder, {sql: builder.sql[i]}));
    }
  };
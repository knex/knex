// Helpers
// -------

// Just some common functions needed in multiple places within the library.
var _   = require('lodash');
var Raw = require('./raw');

var Helpers = module.exports = {

  // Pick off the attributes from only the current layer of the object.
  skim: function(data) {
    return _.map(data, function(obj) {
      return _.pick(obj, _.keys(obj));
    });
  },

  // The function name says it all.
  capitalize: function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  },

  // Sorts an object based on the names.
  sortObject: function(obj) {
    return _.sortBy(_.pairs(obj), function(a) {
      return a[0];
    });
  },

  // Create a non-leaking copy of "arguments".
  args: function() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return args;
  },

  // Check if the first argument is an array, otherwise
  // uses all arguments as an array.
  normalizeArr: function() {
    var args = Helpers.args.apply(null, arguments);
    if (_.isArray(args[0])) {
      return args[0];
    }
    return args;
  },

  // Used to deprecate functionality.
  deprecate: function(msg) {
    if (typeof console !== "undefined" && console !== null &&
      typeof console.warn === "function") {
      console.warn("Knex: " + msg);
    }
  },

  // Used to wrap the statements which have schema bindings,
  // and then put them on the correct query builder statement.
  bindings: function(fn) {
    return function() {
      var binding = this.binding;
      var currentlyBound = this.binding = [];
      var statement = fn.apply(this, arguments);
      if (statement) {
        statement.bindings = currentlyBound;
        this.statements.push(statement);
      }
      this.binding = binding;
      return this;
    };
  },

  // Used to ensure there's only one of a specific statement
  // in the current query chain.
  single: function(fn) {
    return function() {
      var binding = this.binding;
      var currentlyBound = this.binding = [];
      var newStatement = fn.apply(this, arguments);
      if (newStatement) {
        this.statements = _.filter(this.statements, function(statement) {
          return (statement.grouping !== newStatement.grouping);
        });
        newStatement.bindings = currentlyBound;
        this.statements.push(newStatement);
      }
      this.binding = binding;
      return this;
    };
  }

};
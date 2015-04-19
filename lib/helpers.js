'use strict';

var _     = require('lodash');
var chalk = require('chalk')

var helpers = {

  // Pick off the attributes from only the current layer of the object.
  skim: function(data) {
    return _.map(data, function(obj) {
      return _.pick(obj, _.keys(obj));
    });
  },

  // Check if the first argument is an array, otherwise
  // uses all arguments as an array.
  normalizeArr: function() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    if (_.isArray(args[0])) {
      return args[0];
    }
    return args;
  },

  error: function(msg) {
    console.log(chalk.red('Knex:Error ' + msg))
  },

  // Used to signify deprecated functionality.
  deprecate: function(method, alternate) {
    this.warn(method + ' is deprecated, please use ' + alternate);
  },

  // Used to warn about incorrect use, without error'ing
  warn: function(msg) {
    console.log(chalk.yellow("Knex:warning - " + msg));
  },

  makeClient: function() {
    // var Raw
    // var Runner
    // var Formatter
    // var Transaction
    // var QueryBuilder
    // var QueryCompiler
    // var SchemaBuilder
    // var SchemaCompiler
    // var TableBuilder
    // var TableCompiler
    // var ColumnBuilder
    // var ColumnCompiler    
    // var Pool
  }

};

module.exports = helpers;
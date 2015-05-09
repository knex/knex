'use strict';

var _ = require('lodash');
var chalk = require('chalk');

var helpers = {

  // Pick off the attributes from only the current layer of the object.
  skim: function skim(data) {
    return _.map(data, function (obj) {
      return _.pick(obj, _.keys(obj));
    });
  },

  // Check if the first argument is an array, otherwise
  // uses all arguments as an array.
  normalizeArr: function normalizeArr() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    if (Array.isArray(args[0])) {
      return args[0];
    }
    return args;
  },

  error: function error(msg) {
    console.log(chalk.red('Knex:Error ' + msg));
  },

  // Used to signify deprecated functionality.
  deprecate: function deprecate(method, alternate) {
    helpers.warn(method + ' is deprecated, please use ' + alternate);
  },

  // Used to warn about incorrect use, without error'ing
  warn: function warn(msg) {
    console.log(chalk.yellow('Knex:warning - ' + msg));
  },

  exit: function exit(msg) {
    console.log(chalk.red(msg));
    process.exit();
  }

};

module.exports = helpers;
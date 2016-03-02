
import {map, pick, keys} from 'lodash'
var chalk = require('chalk')

var helpers = {

  // Pick off the attributes from only the current layer of the object.
  skim: function(data) {
    return map(data, (obj) => {
      return pick(obj, keys(obj));
    });
  },

  // Check if the first argument is an array, otherwise
  // uses all arguments as an array.
  normalizeArr: function() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    if (Array.isArray(args[0])) {
      return args[0];
    }
    return args;
  },

  error: function(msg) {
    console.log(chalk.red('Knex:Error ' + msg))
  },

  // Used to signify deprecated functionality.
  deprecate: function(method, alternate) {
    helpers.warn(method + ' is deprecated, please use ' + alternate);
  },

  // Used to warn about incorrect use, without error'ing
  warn: function(msg) {
    console.log(chalk.yellow("Knex:warning - " + msg))
  },

  exit: function(msg) {
    console.log(chalk.red(msg))
    process.exit(1)
  }

};

module.exports = helpers;
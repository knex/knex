'use strict';

exports.__esModule = true;

var _defineProperties = require('babel-runtime/core-js/object/define-properties');

var _defineProperties2 = _interopRequireDefault(_defineProperties);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

exports.default = Knex;

var _raw = require('./raw');

var _raw2 = _interopRequireDefault(_raw);

var _helpers = require('./helpers');

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

var _makeKnex = require('./util/make-knex');

var _makeKnex2 = _interopRequireDefault(_makeKnex);

var _parseConnection = require('./util/parse-connection');

var _parseConnection2 = _interopRequireDefault(_parseConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The client names we'll allow in the `{name: lib}` pairing.
var aliases = {
  'mariadb': 'maria',
  'mariasql': 'maria',
  'pg': 'postgres',
  'postgresql': 'postgres',
  'sqlite': 'sqlite3'
};

function Knex(config) {
  if (typeof config === 'string') {
    return new Knex((0, _assign3.default)((0, _parseConnection2.default)(config), arguments[2]));
  }
  var Dialect = void 0;
  if (arguments.length === 0 || !config.client && !config.dialect) {
    Dialect = _client2.default;
  } else if (typeof config.client === 'function' && config.client.prototype instanceof _client2.default) {
    Dialect = config.client;
  } else {
    var clientName = config.client || config.dialect;
    Dialect = require('./dialects/' + (aliases[clientName] || clientName) + '/index.js');
  }
  if (typeof config.connection === 'string') {
    config = (0, _assign3.default)({}, config, { connection: (0, _parseConnection2.default)(config.connection).connection });
  }
  return (0, _makeKnex2.default)(new Dialect(config));
}

// Expose Client on the main Knex namespace.
Knex.Client = _client2.default;

(0, _defineProperties2.default)(Knex, {
  VERSION: {
    get: function get() {
      (0, _helpers.warn)('Knex.VERSION is deprecated, you can get the module version' + "by running require('knex/package').version");
      return '0.12.6';
    }
  },
  Promise: {
    get: function get() {
      (0, _helpers.warn)('Knex.Promise is deprecated, either require bluebird or use the global Promise');
      return require('bluebird');
    }
  }
});

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function (sql, bindings) {
  (0, _helpers.warn)('global Knex.raw is deprecated, use knex.raw (chain off an initialized knex object)');
  return new _raw2.default().set(sql, bindings);
};

// Doing this ensures Browserify works. Still need to figure out
// the best way to do some of this.
if (process.browser) {
  require('./dialects/websql/index.js');
}
module.exports = exports['default'];
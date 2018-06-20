'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _mysql = require('../mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _lodash = require('lodash');

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.

// MySQL2 Client
// -------
function Client_MySQL2(config) {
  _mysql2.default.call(this, config);
}
(0, _inherits2.default)(Client_MySQL2, _mysql2.default);

(0, _lodash.assign)(Client_MySQL2.prototype, {

  // The "dialect", for reference elsewhere.
  driverName: 'mysql2',

  transaction: function transaction() {
    return new (Function.prototype.bind.apply(_transaction2.default, [null].concat([this], Array.prototype.slice.call(arguments))))();
  },
  _driver: function _driver() {
    return require('mysql2');
  },
  validateConnection: function validateConnection(connection) {
    if (connection._fatalError) {
      return false;
    }
    return true;
  }
});

exports.default = Client_MySQL2;
module.exports = exports['default'];
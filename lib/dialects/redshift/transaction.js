'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('../../helpers');

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Redshift_Transaction = function (_Transaction) {
  (0, _inherits3.default)(Redshift_Transaction, _Transaction);

  function Redshift_Transaction() {
    (0, _classCallCheck3.default)(this, Redshift_Transaction);
    return (0, _possibleConstructorReturn3.default)(this, _Transaction.apply(this, arguments));
  }

  Redshift_Transaction.prototype.savepoint = function savepoint(conn) {
    (0, _helpers.warn)('Redshift does not support savepoints.');
    return _bluebird2.default.resolve();
  };

  Redshift_Transaction.prototype.release = function release(conn, value) {
    (0, _helpers.warn)('Redshift does not support savepoints.');
    return _bluebird2.default.resolve();
  };

  Redshift_Transaction.prototype.rollbackTo = function rollbackTo(conn, error) {
    (0, _helpers.warn)('Redshift does not support savepoints.');
    return _bluebird2.default.resolve();
  };

  return Redshift_Transaction;
}(_transaction2.default);

exports.default = Redshift_Transaction;
module.exports = exports['default'];
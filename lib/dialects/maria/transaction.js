'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('knex:tx');

var Transaction_Maria = function (_Transaction) {
  (0, _inherits3.default)(Transaction_Maria, _Transaction);

  function Transaction_Maria() {
    (0, _classCallCheck3.default)(this, Transaction_Maria);
    return (0, _possibleConstructorReturn3.default)(this, _Transaction.apply(this, arguments));
  }

  Transaction_Maria.prototype.query = function query(conn, sql, status, value) {
    var t = this;
    var q = this.trxClient.query(conn, sql).catch(function (err) {
      return err.code === 1305;
    }, function () {
      helpers.warn('Transaction was implicitly committed, do not mix transactions and ' + 'DDL with MariaDB (#805)');
    }).catch(function (err) {
      status = 2;
      value = err;
      t._completed = true;
      debug('%s error running transaction query', t.txid);
    }).tap(function () {
      if (status === 1) t._resolver(value);
      if (status === 2) t._rejecter(value);
    });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  };

  return Transaction_Maria;
}(_transaction2.default);

exports.default = Transaction_Maria;
module.exports = exports['default'];
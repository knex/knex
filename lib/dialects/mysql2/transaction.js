'use strict';

exports.__esModule = true;

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:tx');

function Transaction_MySQL2() {
  _transaction2.default.apply(this, arguments);
}
(0, _inherits2.default)(Transaction_MySQL2, _transaction2.default);

(0, _lodash.assign)(Transaction_MySQL2.prototype, {
  query: function query(conn, sql, status, value) {
    var _this = this;

    var t = this;
    var q = this.trxClient.query(conn, sql).catch(function (err) {
      return err.code === 'ER_SP_DOES_NOT_EXIST';
    }, function () {
      _this.trxClient.logger.warn('Transaction was implicitly committed, do not mix transactions and' + 'DDL with MySQL (#805)');
    }).catch(function (err) {
      status = 2;
      value = err;
      t._completed = true;
      debug('%s error running transaction query', t.txid);
    }).tap(function () {
      if (status === 1) t._resolver(value);
      if (status === 2) {
        if ((0, _lodash.isUndefined)(value)) {
          value = new Error('Transaction rejected with non-error: ' + value);
        }
        t._rejecter(value);
      }
    });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  }
});

exports.default = Transaction_MySQL2;
module.exports = exports['default'];
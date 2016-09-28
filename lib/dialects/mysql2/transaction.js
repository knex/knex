'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = require('debug')('knex:tx');


function Transaction_MySQL2() {
  _transaction2.default.apply(this, arguments);
}
(0, _inherits2.default)(Transaction_MySQL2, _transaction2.default);

(0, _assign3.default)(Transaction_MySQL2.prototype, {
  query: function query(conn, sql, status, value) {
    var t = this;
    var q = this.trxClient.query(conn, sql).catch(function (err) {
      return err.code === 'ER_SP_DOES_NOT_EXIST';
    }, function () {
      helpers.warn('Transaction was implicitly committed, do not mix transactions and' + 'DDL with MySQL (#805)');
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
  }
});

exports.default = Transaction_MySQL2;
module.exports = exports['default'];
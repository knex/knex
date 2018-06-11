'use strict';

exports.__esModule = true;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)('knex:tx');

class Transaction_Maria extends _transaction2.default {

  query(conn, sql, status, value) {
    const t = this;
    const q = this.trxClient.query(conn, sql).catch(err => err.code === 1305, () => {
      this.trxClient.logger.warn('Transaction was implicitly committed, do not mix transactions and ' + 'DDL with MariaDB (#805)');
    }).catch(function (err) {
      status = 2;
      value = err;
      t._completed = true;
      debug('%s error running transaction query', t.txid);
    }).tap(function () {
      if (status === 1) t._resolver(value);
      if (status === 2) {
        if ((0, _lodash.isUndefined)(value)) {
          value = new Error(`Transaction rejected with non-error: ${value}`);
        }
        t._rejecter(value);
      }
    });
    if (status === 1 || status === 2) {
      t._completed = true;
    }
    return q;
  }

}
exports.default = Transaction_Maria;
module.exports = exports['default'];
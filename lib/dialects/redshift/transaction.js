'use strict';

exports.__esModule = true;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Redshift_Transaction extends _transaction2.default {
  savepoint(conn) {
    this.trxClient.logger('Redshift does not support savepoints.');
    return _bluebird2.default.resolve();
  }

  release(conn, value) {
    this.trxClient.logger('Redshift does not support savepoints.');
    return _bluebird2.default.resolve();
  }

  rollbackTo(conn, error) {
    this.trxClient.logger('Redshift does not support savepoints.');
    return _bluebird2.default.resolve();
  }
}
exports.default = Redshift_Transaction;
module.exports = exports['default'];
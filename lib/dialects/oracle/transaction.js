'use strict';

exports.__esModule = true;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _transaction = require('../../transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debugTx = require('debug')('knex:tx');

class Oracle_Transaction extends _transaction2.default {

  // disable autocommit to allow correct behavior (default is true)
  begin() {
    return _bluebird2.default.resolve();
  }

  commit(conn, value) {
    this._completed = true;
    return conn.commitAsync().return(value).then(this._resolver, this._rejecter);
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync().throw(err).catch(error => {
      if ((0, _lodash.isUndefined)(error)) {
        error = new Error(`Transaction rejected with non-error: ${error}`);
      }

      return this._rejecter(error);
    });
  }

  acquireConnection(config) {
    const t = this;
    return _bluebird2.default.try(() => config.connection || t.client.acquireConnection()).then(connection => {
      connection.__knexTxId = this.txid;

      return connection;
    }).tap(connection => {
      if (!t.outerTx) {
        connection.setAutoCommit(false);
      }
    }).disposer(connection => {
      debugTx('%s: releasing connection', t.txid);
      connection.setAutoCommit(true);
      if (!config.connection) {
        t.client.releaseConnection(connection);
      } else {
        debugTx('%s: not releasing external connection', t.txid);
      }
    });
  }

}
exports.default = Oracle_Transaction;
module.exports = exports['default'];
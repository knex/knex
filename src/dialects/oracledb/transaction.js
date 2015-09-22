'use strict';

var inherits = require('inherits');
var Promise = require('../../promise');
var Transaction = require('../../transaction');
var assign = require('lodash/object/assign');
var debugTx = require('debug')('knex:tx');

function Oracle_Transaction(client, container, config, outerTx) {
  Transaction.call(this, client, container, config, outerTx);
}
inherits(Oracle_Transaction, Transaction);

assign(Oracle_Transaction.prototype, {

  // disable autocommit to allow correct behavior (default is true)
  begin: function begin() {
    return Promise.resolve();
  },

  commit: function commit(conn, value) {
    this._completed = true;
    return conn.commitAsync()['return'](value).then(this._resolver, this._rejecter);
  },

  release: function release(conn, value) {
    return this._resolver(value);
  },

  rollback: function rollback(conn, err) {
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync()['throw'](err)['catch'](this._rejecter);
  },

  acquireConnection: function acquireConnection(config) {
    var t = this;
    return Promise['try'](function () {
      return config.connection || t.client.acquireConnection();
    }).tap(function (connection) {
      if (!t.outerTx) {
        connection.setAutoCommit(false);
      }
    }).disposer(function (connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.setAutoCommit(true);
      if (!config.connection) {
        t.client.releaseConnection(connection);
      } else {
        debugTx('%s: not releasing external connection', t.txid);
      }
    });
  }

});

module.exports = Oracle_Transaction;
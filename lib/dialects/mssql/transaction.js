'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Promise = require('../../promise');
var Transaction = require('../../transaction');
var debug = require('debug')('knex:tx');

function Transaction_MSSQL() {
  Transaction.apply(this, arguments);
}
inherits(Transaction_MSSQL, Transaction);

assign(Transaction_MSSQL.prototype, {

  begin: function begin(conn) {
    debug('%s: begin', this.txid);
    return conn.tx_.begin().then(this._resolver, this._rejecter);
  },

  savepoint: function savepoint(conn) {
    var _this = this;

    debug('%s: savepoint at', this.txid);
    return Promise.resolve().then(function () {
      return _this.query(conn, 'SAVE TRANSACTION ' + _this.txid);
    });
  },

  commit: function commit(conn, value) {
    var _this2 = this;

    this._completed = true;
    debug('%s: commit', this.txid);
    return conn.tx_.commit().then(function () {
      return _this2._resolver(value);
    }, this._rejecter);
  },

  release: function release(conn, value) {
    return this._resolver(value);
  },

  rollback: function rollback(conn, error) {
    var _this3 = this;

    this._completed = true;
    debug('%s: rolling back', this.txid);
    return conn.tx_.rollback().then(function () {
      return _this3._rejecter(error);
    });
  },

  rollbackTo: function rollbackTo(conn, error) {
    var _this4 = this;

    debug('%s: rolling backTo', this.txid);
    return Promise.resolve().then(function () {
      return _this4.query(conn, 'ROLLBACK TRANSACTION ' + _this4.txid, 2, error);
    }).then(function () {
      return _this4._rejecter(error);
    });
  },

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection: function acquireConnection(config) {
    var t = this;
    var configConnection = config && config.connection;
    return Promise['try'](function () {
      return (t.outerTx ? t.outerTx.conn : null) || configConnection || t.client.acquireConnection();
    }).tap(function (conn) {
      if (!t.outerTx) {
        t.conn = conn;
        conn.tx_ = conn.transaction();
      }
    }).disposer(function (conn) {
      if (t.outerTx) return;
      if (conn.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid);
          conn.tx_.rollback();
        }
        conn.tx_ = null;
      }
      t.conn = null;
      if (!configConnection) {
        debug('%s: releasing connection', t.txid);
        t.client.releaseConnection(conn);
      } else {
        debug('%s: not releasing external connection', t.txid);
      }
    });
  }

});

module.exports = Transaction_MSSQL;
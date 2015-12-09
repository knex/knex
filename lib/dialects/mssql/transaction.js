'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Promise = require('../../promise');
var helpers = require('../../helpers');
var Transaction = require('../../transaction');
var debug = require('debug')('knex:tx');

function Transaction_MSSQL() {
  Transaction.apply(this, arguments);
}
inherits(Transaction_MSSQL, Transaction);

assign(Transaction_MSSQL.prototype, {

  begin: function begin(conn) {
    // console.log('begin', this.txid)
    return conn.tx_.begin().then(this._resolver, this._rejecter);
    //return this.query(conn, 'BEGIN TRANSACTION;')
  },

  savepoint: function savepoint(conn) {
    //console.log('savepoint', this.txid)
    return Promise.resolve();
    //return this.query(conn, 'SAVE TRANSACTION ' + this.txid + ';')
  },

  commit: function commit(conn, value) {
    //console.log('commit', this.txid)
    this._completed = true;
    return conn.tx_.commit().then(this._resolver(value), this._rejecter);
    //return this.query(conn, 'COMMIT TRANSACTION;', 1, value)
  },

  release: function release(conn, value) {
    //console.log('release', this.txid)
    return this._resolver(value);
    //return ''
  },

  rollback: function rollback(conn, error) {
    //console.log('rollback', this.txid)
    this._completed = true;
    debug('%s: rolling back', this.txid);
    return conn.tx_.rollback()['catch'](this._rejecter(error));
    //return this.query(conn, 'ROLLBACK TRANSACTION;', 2, error)
  },

  rollbackTo: function rollbackTo(conn, error) {
    //console.log('rollbackTo', this.txid)
    return Promise.resolve();
    //return this.query(conn, 'ROLLBACK TRANSACTION ' + this.txid, 2, error)
  },

  // Acquire a connection and create a disposer - either using the one passed
  // via config or getting one off the client. The disposer will be called once
  // the original promise is marked completed.
  acquireConnection: function acquireConnection(config) {
    var t = this;
    var configConnection = config && config.connection;
    return Promise['try'](function () {
      return configConnection || t.client.acquireConnection();
    }).tap(function (connection) {
      //console.log('acquireConnection:begin', !!t.outerTx, t.txid);
      if (!t.outerTx) {
        connection.tx_ = connection.transaction();
      }
    }).disposer(function (connection) {
      //console.log('acquireConnection:end', !!t.outerTx, t.txid);
      if (!t.outerTx && connection.tx_) {
        if (!t._completed) {
          debug('%s: unreleased transaction', t.txid);
          connection.tx_.rollback();
        }
        connection.tx_ = null;
      }
      if (!configConnection) {
        debug('%s: releasing connection', t.txid);
        t.client.releaseConnection(connection);
      } else {
        debug('%s: not releasing external connection', t.txid);
      }
    });
  }

});

module.exports = Transaction_MSSQL;
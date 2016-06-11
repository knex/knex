'use strict';

var Transaction = require('../../transaction');
var assign = require('lodash/object/assign');
var inherits = require('inherits');
var debug = require('debug')('knex:tx');
var helpers = require('../../helpers');

function Transaction_Firebird() {
  Transaction.apply(this, arguments);
}
inherits(Transaction_Firebird, Transaction);

assign(Transaction_Firebird.prototype, {
  isCompleted: function isCompleted() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || false;
  },

  begin: function begin(conn) {
    return this.query(conn, '');
  },

  savepoint: function savepoint(conn) {
    return this.query(conn, ' ');
  },

  commit: function commit(conn, value) {
    return this.query(conn, ' ');
  },

  release: function release(conn, value) {
    return this.query(conn, ' ');
  },

  rollback: function rollback(conn, error) {
    return this.query(conn, ' ');
  },

  rollbackTo: function rollbackTo(conn, error) {
    return this.query(conn, ' ');
  },

  query: function query(conn, sql, status, value) {
    var _this = this;

    //console.log(sql);
    //console.log(status);
    console.log(this.trxClient._events);

    var q = this.trxClient.query(conn, sql)['catch'](function (err) {
      status = 2;
      value = err;
      _this._completed = true;
      debug('%s error running transaction query', _this.txid);
    }).tap(function () {
      if (status === 1) _this._resolver(value);
      if (status === 2) _this._rejecter(value);
    });
    if (status === 1 || status === 2) {
      this._completed = true;
    }
    return q;
  }
});

module.exports = Transaction_Firebird;
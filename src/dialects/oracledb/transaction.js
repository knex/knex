var inherits = require('inherits');
var Promise = require('../../promise');
var Transaction = require('../../transaction');
var debugTx = require('debug')('knex:tx');
  import {assign} from
'lodash'

  function Oracle_Transaction(client, container, config, outerTx) {
    Transaction.call(this, client, container, config, outerTx);
  }
inherits(Oracle_Transaction, Transaction);

assign(Oracle_Transaction.prototype, {
  // disable autocommit to allow correct behavior (default is true)
  begin: function() {
    return Promise.resolve();
  },
  commit: function(conn, value) {
    this._completed = true;
    return conn.commitAsync()
      .return(value)
      .then(this._resolver, this._rejecter);
  },
  release: function(conn, value) {
    return this._resolver(value);
  },
  rollback: function(conn, err) {
    var self = this;
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync().timeout(5000).catch(Promise.TimeoutError, function() {
      self._resolver();
    });
  },
  acquireConnection: function(config) {
    var t = this;
    return Promise.try(function() {
      return t.client.acquireConnection().then(function(cnx) {
        cnx.isTransaction = true;
        return cnx;
      });
    }).disposer(function(connection) {
      debugTx('%s: releasing connection', t.txid);
      connection.isTransaction = false;
      connection.commitAsync()
        .then(function(err) {
          if (err) {
            this._rejecter(err);
          }
          if (!config.connection) {
            t.client.releaseConnection(connection);
          } else {
            debugTx('%s: not releasing external connection', t.txid);
          }
        });
    });
  }
});

module.exports = Oracle_Transaction;
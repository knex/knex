const Promise = require('bluebird');
const Transaction = require('../../transaction');
const debugTx = require('debug')('knex:tx');

export default class Oracle_Transaction extends Transaction {

  // disable autocommit to allow correct behavior (default is true)
  begin() {
    return Promise.resolve();
  }

  commit(conn, value) {
    this._completed = true;
    return conn.commitAsync()
      .return(value)
      .then(this._resolver, this._rejecter);
  }

  release(conn, value) {
    return this._resolver(value);
  }

  rollback(conn, err) {
    const self = this;
    this._completed = true;
    debugTx('%s: rolling back', this.txid);
    return conn.rollbackAsync().timeout(5000).catch(Promise.TimeoutError, function(e) {
      self._rejecter(e);
    }).then(function() {
      self._rejecter(err);
    });
  }

  acquireConnection(config) {
    const t = this;
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

}

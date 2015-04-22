'use strict';

// Transaction
// -------
var Promise      = require('./promise')
var EventEmitter = require('events').EventEmitter
var inherits     = require('inherits')

var makeKnex     = require('./util/make-knex')

var assign       = require('lodash/object/assign')
var uniqueId     = require('lodash/utility/uniqueId');

var debug        = require('debug')
var debugTx      = debug('knex:tx')
var debugQuery   = debug('knex:query')

// Container for a Promise
function Transaction(client, outerTx) {
  
  this.txid      = uniqueId('trx')
  this.client    = client
  this._outerTx  = outerTx  

  debugTx('%s: Starting %s transaction', this.txid, outerTx ? 'nested' : 'top level')
  
  this._dfd = new Promise(function(resolver, rejecter) {
    this._resolver = resolver
    this._rejecter = rejecter
  }.bind(this))

  this._completed  = false

  // If there is more than one child transaction,
  // we queue them, executing each when the previous completes.
  this._trxQueue   = []

  if (outerTx) {
    var len = outerTx._trxQueue.length
    if (len > 0) {
      debugTx('%s: Queueing transaction in %s index: %d', this.txid, outerTx.txid, len)
      this._queue = outerTx._trxQueue[len - 1].finally(function() {
        return true
      })
    }
    outerTx._trxQueue.push(this._dfd)
  }

  this._queue = this._queue || Promise.resolve(true)
}
inherits(Transaction, EventEmitter)

assign(Transaction.prototype, {

  isCancelled: function() {
    return this._cancelled || this._outerTx && this._outerTx.isCancelled() || false
  },

  run: function(container, config) {
    config = config || {}
    var t      = this
    var client = this.client

    Promise.using(this.acquireConnection(config), function(connection) {

      var trxClient = t.makeClient(connection)
      var init = client.transacting ? t.savepoint(connection) : t.begin(connection)
      
      return init.then(function() {
        return t.makeTransactor(connection, trxClient)
      })
      .tap(function(transactor) {
        if (client.transacting) {
          return t.savepoint(transactor)
        }
        return transactor.client
      })
      .then(function(transactor) {
        
        var result = container(transactor)

        // If we've returned a "thenable" from the transaction container,
        // and it's got the transaction object we're running for this, assume
        // the rollback and commit are chained to this object's success / failure.
        if (result && result.then && typeof result.then === 'function') {
          result.then(function(val) { 
            debugTx('%s: promise-resolved', t.txid)
            transactor.commit(val) 
          }).catch(function(err) {
            debugTx('%s: catch-rollback', t.txid)
            transactor.rollback(err)
          })
        }
      
      })
      .then(function() {
        return t._dfd
      })

    })

    return this;
  },

  acquireConnection: function(config) {
    var t = this
    return Promise.try(function() {
      return config.connection || t.client.acquireConnection()  
    }).disposer(function(connection) {
      if (!config.connection) {
        debugTx('%s: releasing connection', t.txid)
        t.client.releaseConnection(connection)
      } else {
        debugTx('%s: not releasing external connection', t.txid)
      }
    })
  },

  begin: function(conn) {
    return this.query(conn, 'begin;')
  },

  savepoint: function(conn) {
    return this.query(conn, 'savepoint ' + this.txid + ';')
  },

  commit: function(conn, value) {
    return this.query(conn, 'commit;', 1, value)
  },

  release: function(conn, value) {
    return this.query(conn, 'release ' + this.txid + ';', 1, value)
  },

  rollback: function(conn, error) {
    return this.query(conn, 'rollback;', 2, error)
  },

  rollbackTo: function(conn, error) {
    return this.query(conn, 'rollback to savepoint ' + this.txid + ';', 2, error)
  },

  query: function(conn, sql, status, value) {
    
    if (this.isCancelled()) {
      return this._skipping(sql)
    }
    
    if (status === 1 || status === 2) {
      this._completed = true
    }

    if (typeof sql === 'string') sql = {sql: sql}

    debugQuery('%s: query %s', this.txid, sql.sql.slice(0, 300))

    this.emit('query', assign({__knexUid: conn.__knexUid}, sql))

    var t = this
    return this.client._query(conn, sql)
      .tap(function() {
        if (status === 1) t._resolver(value)
        if (status === 2) t._rejecter(value)
      })
      .catch(function(err) {
        t._rejecter(err)
      })
  },

  stream: function(conn, sql, stream, options) {
    
    debugQuery('%s: streaming', this.txid)

    if (this.isCancelled()) {
      return this._skipping(sql)
    }

    if (typeof sql === 'string') sql = {sql: sql}
    this.emit('query:stream', assign({__knexUid: conn.__knexUid}, sql))

    return this.client.stream(conn, sql, stream, options)
  },

  _skipping: function(sql) {
    return Promise.reject(new Error('Transaction ' + this.txid + ' has already been released skipping: ' + sql))
  },

  // The transactor is a full featured knex object, with a "commit", 
  // a "rollback" and a "savepoint" function. The "savepoint" is just
  // sugar for creating a new transaction. If the rollback is run
  // inside a savepoint, it rolls back to the last savepoint - otherwise
  // it rolls back the transaction.
  makeTransactor: function(connection, trxClient) {
    var t = this
    var transactor = makeKnex(trxClient)

    transactor.transaction = function(container, options) {
      return trxClient.transaction(t).run(container, options)
    }  
    transactor.savepoint = function(container, options) {
      return transactor.transaction(container, options)
    }

    if (this.client.transacting) {
      transactor.commit = function(value) {
        debugTx('%s: releasing savepoint', t.txid)
        return t.release(connection, value)
      }
      transactor.rollback = function(error) {
        debugTx('%s: rolling back savepoint', t.txid)
        return t.rollbackTo(connection, error);
      }
    } else {
      transactor.commit = function(value) {
        debugTx('%s: committing', t.txid)
        return t.commit(connection, value)
      }
      transactor.rollback = function(error) {
        debugTx('%s: rolling back', t.txid)
        return t.rollback(connection, error)
      }
    }
    return transactor
  },

  // We need to make a client object which always acquires the same 
  // connection and does not release back into the pool.
  makeClient: function(connection) {
    var t = this
    var trxClient         = Object.create(this.client.constructor.prototype)
    trxClient.config      = this.client.config
    trxClient.transacting = true;

    trxClient.query  = function(conn, obj) {
      return Promise.try(function() {
        if (conn !== connection) throw new Error('Invalid connection for transaction query.')
        return t.query(conn, obj)
      })
    }
    trxClient.stream = function(conn, obj, stream, options) {
      return Promise.try(function() {
        if (conn !== connection) throw new Error('Invalid connection for transaction query.')
        return t.stream(conn, obj, stream, options)
      })
    }
    
    trxClient.acquireConnection = function() {
      return t._queue.then(function() {
        return connection
      })
    }
    trxClient.releaseConnection = function() { 
      return Promise.resolve()
    }

    return trxClient
  }

})

// Allow the `Transaction` object to be utilized with 
// full access to the relevant promise API.
require('./interface')(Transaction)

Transaction.prototype.transacting = undefined

// Passed a `container` function, this method runs the current
// transaction, returning a promise.
Transaction.prototype.then = function(/* onFulfilled, onRejected */) {
  return this._dfd.then.apply(this._dfd, arguments)
}

// Passed a `container` function, this method runs the current
// transaction, returning a promise.
Transaction.prototype.catch = function(/* onFulfilled, onRejected */) {
  return this._dfd.catch.apply(this._dfd, arguments)
}

module.exports = Transaction;

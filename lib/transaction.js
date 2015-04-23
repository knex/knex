'use strict';

// Transaction
// -------
var Promise      = require('./promise')
var EventEmitter = require('events').EventEmitter
var inherits     = require('inherits')

var makeKnex     = require('./util/make-knex')

var assign       = require('lodash/object/assign')
var uniqueId     = require('lodash/utility/uniqueId')
var debug        = require('debug')('knex:tx')

// Acts as a facade for a Promise, keeping the 
// 
function Transaction(client, container, config, outerTx) {
  
  var txid = this.txid = uniqueId('trx')
  
  this.client    = client
  this.outerTx   = outerTx
  this.trxClient = undefined;

  debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level')

  var t = this

  this._promise = Promise.using(acquireConnection(client, config, txid), function(connection) {
    
    var trxClient = t.trxClient = makeTxClient(t, client, connection)
    var init      = client.transacting ? t.savepoint(connection) : t.begin(connection)
    
    init.then(function() {
      
      debug('%s: making transactor', txid)
      
      return makeTransactor(t, connection, trxClient)
    })
    .then(function(transactor) {
      
      debug('%s: calling container', txid)
      var result = container(transactor)

      // If we've returned a "thenable" from the transaction container,
      // and it's got the transaction object we're running for this, assume
      // the rollback and commit are chained to this object's success / failure.
      if (result && result.then && typeof result.then === 'function') {
        result.then(function(val) { 
          debug('%s: promise-resolved', txid)
          transactor.commit(val)
        })
        .catch(function(err) {
          debug('%s: catch-rollback', txid)
          transactor.rollback(err)
        })
      }
    
    })

    return new Promise(function(resolver, rejecter) {
      t._resolver = resolver
      t._rejecter = rejecter
    })
  })

  this._completed  = false

  // If there is more than one child transaction,
  // we queue them, executing each when the previous completes.
  this._childQueue = []

  // The queue is a noop unless we have child promises.
  this._queue = this._queue || Promise.resolve(true)

  // If there's a wrapping transaction, we need to see if there are 
  // any current children in the pending queue.
  if (outerTx) {

    // If there are other promises pending, we just wait until that one
    // settles (commit or rollback) and then we can continue.
    if (outerTx._childQueue.length > 0) {

      this._queue = this._queue.then(function() {
        return Promise.settle(outerTx._childQueue[outerTx._childQueue.length - 1])
      })

    }

    // Push the current promise onto the queue of promises.
    outerTx._childQueue.push(this._promise)
  }

}
inherits(Transaction, EventEmitter)

// Acquire a connection and create a disposer - either using the one passed 
// via config or getting one off the client. The disposer will be called once 
// the original promise is marked completed.
function acquireConnection(client, config, txid) {
  var configConnection = config && config.connection
  return Promise.try(function() {
    return configConnection || client.acquireConnection()  
  })
  .disposer(function(connection) {
    if (!configConnection) {
      debug('%s: releasing connection', txid)
      client.releaseConnection(connection)
    } else {
      debug('%s: not releasing external connection', txid)
    }
  })
}

assign(Transaction.prototype, {

  isCancelled: function() {
    return this._cancelled || this.outerTx && this.outerTx.isCancelled() || false
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
    return this.query(conn, 'release savepoint ' + this.txid + ';', 1, value)
  },

  rollback: function(conn, error) {
    return this.query(conn, 'rollback;', 2, error)
  },

  rollbackTo: function(conn, error) {
    return this.query(conn, 'rollback to savepoint ' + this.txid + ';', 2, error)
  },

  query: function(conn, sql, status, value) {
    
    debug('%s: tx query %s', this.txid, sql)

    var t = this
    return this.trxClient.query(conn, sql)
      .catch(function(err) {
        status = 2
        value  = err
        debug('%s error running transaction query', t.txid)
      })
      .tap(function() {
        if (status === 1) t._resolver(value)
        if (status === 2) t._rejecter(value)
        if (status === 1 || status === 2) {
          t._completed = true
        }
      })
  },

  _skipping: function(sql) {
    return Promise.reject(new Error('Transaction ' + this.txid + ' has already been released skipping: ' + sql))
  }

})

// The transactor is a full featured knex object, with a "commit", 
// a "rollback" and a "savepoint" function. The "savepoint" is just
// sugar for creating a new transaction. If the rollback is run
// inside a savepoint, it rolls back to the last savepoint - otherwise
// it rolls back the transaction.
function makeTransactor(trx, connection, trxClient) {
  
  var transactor = makeKnex(trxClient)

  transactor.transaction = function(container, options) {
    return new trxClient.Transaction(trxClient, container, options, trx)
  }  
  transactor.savepoint = function(container, options) {
    return transactor.transaction(container, options)
  }

  if (trx.client.transacting) {
    transactor.commit = function(value) {
      debug('%s: releasing savepoint', trx.txid)
      return trx.release(connection, value)
    }
    transactor.rollback = function(error) {
      debug('%s: rolling back savepoint', trx.txid)
      return trx.rollbackTo(connection, error);
    }
  } else {
    transactor.commit = function(value) {
      debug('%s: committing', trx.txid)
      return trx.commit(connection, value)
    }
    transactor.rollback = function(error) {
      debug('%s: rolling back', trx.txid)
      return trx.rollback(connection, error)
    }
  }

  return transactor
}


// We need to make a client object which always acquires the same 
// connection and does not release back into the pool.
function makeTxClient(trx, client, connection) {

  var trxClient         = Object.create(client.constructor.prototype)
  trxClient.config      = client.config
  trxClient.transacting = true
  
  trxClient.on('query', function(arg) {
    trx.emit('query', arg)
  })

  var _query = trxClient.query;
  trxClient.query  = function(conn, obj) {
    return Promise.try(function() {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.')
      return _query.call(trxClient, conn, obj)
    })
  }
  var _stream = trxClient.stream
  trxClient.stream = function(conn, obj, stream, options) {
    return Promise.try(function() {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.')
      return _stream.call(trxClient, conn, obj, stream, options)
    })
  }
  trxClient.acquireConnection = function() {
    return trx._queue.then(function() {
      return connection
    })
  }
  trxClient.releaseConnection = function() { 
    return Promise.resolve()
  }

  return trxClient
}


// Allow the `Transaction` object to be utilized with 
// full access to the relevant promise API.
require('./interface')(Transaction)

Transaction.prototype.transacting = undefined

// Passed a `container` function, this method runs the current
// transaction, returning a promise.
Transaction.prototype.then = function(/* onFulfilled, onRejected */) {
  return (this._promise = this._promise.then.apply(this._promise, arguments))
}

// Passed a `container` function, this method runs the current
// transaction, returning a promise.
Transaction.prototype.catch = function(/* onFulfilled, onRejected */) {
  return (this._promise = this._promise.catch.apply(this._promise, arguments))
}

module.exports = Transaction;

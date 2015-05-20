
// Transaction
// -------
var Promise      = require('./promise')
var EventEmitter = require('events').EventEmitter
var inherits     = require('inherits')

var makeKnex     = require('./util/make-knex')
var assign       = require('lodash/object/assign')
var uniqueId     = require('lodash/utility/uniqueId')
var debug        = require('debug')('knex:tx')

// Acts as a facade for a Promise, keeping the internal state
// and managing any child transactions.
function Transaction(client, container, config, outerTx) {
  
  var txid = this.txid = uniqueId('trx')

  this.client    = client
  this.outerTx   = outerTx
  this.trxClient = undefined;
  this._debug    = client.config && client.config.debug

  debug('%s: Starting %s transaction', txid, outerTx ? 'nested' : 'top level')

  this._promise = Promise.using(this.acquireConnection(client, config, txid), (connection) => {
    
    var trxClient = this.trxClient = makeTxClient(this, client, connection)
    var init      = client.transacting ? this.savepoint(connection) : this.begin(connection)
    
    init.then(() => {
      return makeTransactor(this, connection, trxClient)
    })
    .then((transactor) => {

      var result = container(transactor)

      // If we've returned a "thenable" from the transaction container,
      // and it's got the transaction object we're running for this, assume
      // the rollback and commit are chained to this object's success / failure.
      if (result && result.then && typeof result.then === 'function') {
        result.then((val) => {
          transactor.commit(val)
        })
        .catch((err) => {
          transactor.rollback(err)
        })
      }
    
    })
    .catch((e) => this._rejecter(e))

    return new Promise((resolver, rejecter) => {
      this._resolver = resolver
      this._rejecter = rejecter
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

assign(Transaction.prototype, {

  isCompleted: function() {
    return this._completed || this.outerTx && this.outerTx.isCompleted() || false
  },

  begin: function(conn) {
    return this.query(conn, 'BEGIN;')
  },

  savepoint: function(conn) {
    return this.query(conn, 'SAVEPOINT ' + this.txid + ';')
  },

  commit: function(conn, value) {
    return this.query(conn, 'COMMIT;', 1, value)
  },

  release: function(conn, value) {
    return this.query(conn, 'RELEASE SAVEPOINT ' + this.txid + ';', 1, value)
  },

  rollback: function(conn, error) {
    return this.query(conn, 'ROLLBACK;', 2, error)
  },

  rollbackTo: function(conn, error) {
    return this.query(conn, 'ROLLBACK TO SAVEPOINT ' + this.txid, 2, error)
  },

  query: function(conn, sql, status, value) {
    var q = this.trxClient.query(conn, sql)
      .catch((err) => {
        status = 2
        value  = err
        this._completed = true
        debug('%s error running transaction query', this.txid)
      })
      .tap(() => {
        if (status === 1) this._resolver(value)
        if (status === 2) this._rejecter(value)
      })
    if (status === 1 || status === 2) {
      this._completed = true
    }
    return q;
  },

  debug: function(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this
  },

  _skipping: function(sql) {
    return Promise.reject(new Error('Transaction ' + this.txid + ' has already been released skipping: ' + sql))
  },

  // Acquire a connection and create a disposer - either using the one passed 
  // via config or getting one off the client. The disposer will be called once 
  // the original promise is marked completed.
  acquireConnection: function(client, config, txid) {
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
      return trx.release(connection, value)
    }
    transactor.rollback = function(error) {
      return trx.rollbackTo(connection, error);
    }
  } else {
    transactor.commit = function(value) {
      return trx.commit(connection, value)
    }
    transactor.rollback = function(error) {
      return trx.rollback(connection, error)
    }
  }

  return transactor
}


// We need to make a client object which always acquires the same 
// connection and does not release back into the pool.
function makeTxClient(trx, client, connection) {

  var trxClient                = Object.create(client.constructor.prototype)
  trxClient.config             = client.config
  trxClient.driver             = client.driver
  trxClient.connectionSettings = client.connectionSettings
  trxClient.transacting        = true
  
  trxClient.on('query', function(arg) {
    trx.emit('query', arg)
  })

  var _query = trxClient.query;
  trxClient.query  = function(conn, obj) {
    var completed = trx.isCompleted()
    return Promise.try(function() {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.')
      if (completed) completedError(trx, obj)
      return _query.call(trxClient, conn, obj)
    })
  }
  var _stream = trxClient.stream
  trxClient.stream = function(conn, obj, stream, options) {
    var completed = trx.isCompleted()
    return Promise.try(function() {
      if (conn !== connection) throw new Error('Invalid connection for transaction query.')
      if (completed) completedError(trx, obj)
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

function completedError(trx, obj) {
  var sql = typeof obj === 'string' ? obj : obj && obj.sql
  debug('%s: Transaction completed: %s', trx.id, sql)
  throw new Error('Transaction query already complete, run with DEBUG=knex:tx for more info')  
}

var promiseInterface = [
  'then', 'bind', 'catch', 'finally', 'asCallback',
  'spread', 'map', 'reduce', 'tap', 'thenReturn',
  'return', 'yield', 'ensure', 'nodeify', 'exec'
]

// Creates a method which "coerces" to a promise, by calling a
// "then" method on the current `Target`
promiseInterface.forEach(function(method) {
  Transaction.prototype[method] = function() {
    return (this._promise = this._promise[method].apply(this._promise, arguments))
  }
})

module.exports = Transaction;

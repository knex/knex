'use strict';

// Transaction
// -------
var Promise      = require('./promise');
var EventEmitter = require('events').EventEmitter;
var inherits     = require('inherits');

// Creates a new wrapper object for constructing a transaction.
// Called by the `knex.transaction`, which sets the correct client
// and handles the `container` object, passing along the correct
// `connection` to keep all of the transactions on the correct connection.
function Transaction(client, connection) {
  this.client   = client;
  this._promise = undefined;
}
inherits(Transaction, EventEmitter);

Transaction.prototype.run = function(container) {
  var transaction = this, client = this.client;
  return this.client
    .acquireConnection()
    .then(function(connection) {
      var trxClient  = makeClient(client)
      var transactor = makeTransactor(trxClient, client)
      return transaction.initiateDeferred(container, transactor, connection)
    })
}

Transaction.prototype.initiateDeferred = function(transactor) {

  // Initiate a deferred object, bound to the container object,
  // so we know when the transaction completes or fails
  // and can continue from there.
  var dfd = transactor.__dfd__ = Promise.pending();

  // Call the container with the transaction
  // commit & rollback objects.
  var result = this.container(transactor);

  // If we've returned a "thenable" from the transaction container,
  // and it's got the transaction object we're running for this, assume
  // the rollback and commit are chained to this object's success / failure.
  if (result && result.then && typeof result.then === 'function') {
    result.then(function(val) { transactor.commit(val); }).catch(function(err) { transactor.rollback(err); });
  }

  // Return the promise for the entire transaction.
  return dfd.promise;
};

// Allow the `Transaction` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Transaction);

// Passed a `container` function, this method runs the current
// transaction, returning a promise.
Transaction.prototype.then = function(/* onFulfilled, onRejected */) {
  return this._promise.then.apply(this._promise, arguments)
};

Transaction.prototype.beginTransaction = function() {
  if (this.client.transacting) {
    
  }
  return this._beginTransaction   && this.query({sql: this._beginTransaction});
};
Transaction.prototype.commitTransaction = function() {
  return this._commitTransaction   && this.query({sql: this._commitTransaction});
};
Transaction.prototype.rollbackTransaction = function() {
  return this._rollbackTransaction && this.query({sql: this._rollbackTransaction});
};

// Finishes the transaction statement and handles disposing of the connection,
// resolving / rejecting the transaction's promise, and ensuring the transaction object's
// `_runner` property is `null`'ed out so it cannot continue to be used.
Transaction.prototype.finishTransaction = function(action, containerObject, msg) {
  var query, dfd = containerObject.__dfd__;

  // Run the query to commit / rollback the transaction.
  switch (action) {
    case 0:
      query = this.commitTransaction();
      break;
    case 1:
      query = this.rollbackTransaction();
      break;
  }

  return query.then(function(resp) {
    msg = (msg === void 0) ? resp : msg;
    switch (action) {
      case 0:
        dfd.fulfill(msg);
        break;
      case 1:
        dfd.reject(msg);
        break;
    }

  // If there was a problem committing the transaction,
  // reject the transaction block (to reject the entire transaction block),
  // then re-throw the error for any promises chained off the commit.
  }).catch(function(e) {
    dfd.reject(e);
    throw e;
  }).bind(this).finally(function() {

    // Kill the "_runner" object on the containerObject,
    // so it's not possible to continue using the transaction object.
    containerObject._runner = void 0;

    return this.cleanupConnection();
  });
}

Transaction.prototype._beginTransaction = 'begin;';
Transaction.prototype._commitTransaction = 'commit;';
Transaction.prototype._rollbackTransaction = 'rollback;';

// Transaction Methods:
// -------

// Run the transaction on the correct "runner" instance.
Transaction.prototype.transactionQuery = Promise.method(function() {
  var runner = this.builder._transacting._runner;
  if (!(runner instanceof Runner)) {
    throw new Error('Invalid transaction object provided.');
  }
  var sql = this.builder.toSQL();
  if (_.isArray(sql)) {
    return runner.queryArray(sql);
  }
  return runner.query(sql);
});

// Begins a transaction statement on the instance,
// resolving with the current runner.
Transaction.prototype.startTransaction = Promise.method(function() {
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection  = connection;
      this.transaction = true;
      return this.beginTransaction();
    }).thenReturn(this);
});

// Used for savepoints, give the ability to roll back
// to a particular point in time.
function transactionUid() {
  return _.uniqueId('knexTransaction')
}

function makeClient(client) {
  var transactionClient = Object.create(client.constructor.prototype)
  transactionClient.config = client.config
  transactionClient.acquireConnection = function() {
    return Promise.resolve(connection)
  }
  transactionClient.releaseConnection = function() {}
  return transactionClient
}

function makeTransactor(trxClient, client) {
  var transactor = this.client.makeKnex(transactionClient)
  transactor.commit = function() {
    return transaction.finish(0, transactor, message);
  }
  if (client.transacting) {
    transactor.rollback = function(error) {
      return transaction.finish(1, transactor, error);
    }
  } else {

  }
}


module.exports = Transaction;

// Transaction
// -------
var Promise = require('./promise');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

// Creates a new wrapper object for constructing a transaction.
// Called by the `knex.transaction`, which sets the correct client
// and handles the `container` object, passing along the correct
// `connection` to keep all of the transactions on the correct connection.
function Transaction(container) {
  this.container = container;
}
inherits(Transaction, EventEmitter);

// Build the knex instance passed around inside the transaction container.
// It can be used both as a fully functional knex instance, or assimilated
// into existing knex chains via the ".transacting" method call.
Transaction.prototype.containerObject = function(runner) {
  var Knex = require('../knex');

  // Create an entirely new knex instance just for this transaction
  var transactor = Knex.initialize({
    __client__     : this.client,
    __transactor__ : {_runner: runner}
  });

  // Remove the ability to start a transaction or destroy
  // the entire pool within a transaction.
  transactor.destroy = transactor.transaction = void 0;

  // Commits the transaction:
  transactor.commit = function(message) {
    runner.finishTransaction(0, transactor, message);
  };

  // Rolls back the transaction.
  transactor.rollback = function(error) {
    runner.finishTransaction(1, transactor, error);
  };

  transactor._runner = runner;

  return transactor;
};

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
Transaction.prototype.then = function(onFulfilled, onRejected) {
  var Runner = this.client.Runner;

  // Create a new "runner" object, passing the "runner"
  // object along, so we can easily keep track of every
  // query run on the current connection.
  return new Runner(this)
    .startTransaction()
    .bind(this)
    .then(this.containerObject)
    .then(this.initiateDeferred)
    .then(onFulfilled, onRejected)
    .bind();
};

module.exports = Transaction;
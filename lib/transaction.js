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

// Build the object passed around inside the transaction container.
Transaction.prototype.containerObject = function(runner) {
  var containerObj = {
    commit: function(message) {
      return containerObj._runner.finishTransaction(0, this, message);
    },
    rollback: function(error) {
      return containerObj._runner.finishTransaction(1, this, error);
    },
    _runner: runner
  };
  return containerObj;
};

Transaction.prototype.initiateDeferred = function(containerObj) {

  // Initiate a deferred object, bound to the container object,
  // so we know when the transaction completes or fails
  // and can continue from there.
  var dfd = containerObj._dfd = Promise.pending();

  // Call the container with the transaction
  // commit & rollback objects.
  this.container(containerObj);

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
    .then(onFulfilled, onRejected);
};

module.exports = Transaction;
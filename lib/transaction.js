// Transaction
// -------
var Promise = require('./promise');
var _       = require('lodash');

// Creates a new wrapper object for constructing a transaction.
// Called by the `knex.transaction`, which sets the correct client
// and handles the `container` object, passing along the correct
// `connection` to keep all of the transactions on the correct connection.
var Transaction = module.exports = function Transaction(client) {
  this.client = client;
  this.flags  = {};
};

Transaction.prototype = {

  constructor: Transaction,

  // Passed a `container` function, this method runs the current
  // transaction, returning a promise.
  run: Promise.method(function Transaction$run(container) {
    return this.client.startTransaction()
      .bind(this)
      .then(this.getContainerObject)
      .then(this.initiateDeferred(container));
  }),

  getContainerObject: function(connection) {

    // The client we need to call `finishTransaction` on.
    var client = this.client;

    // The object passed around inside the transaction container.
    var containerObj = {

      commit: function(message) {
        client.finishTransaction('commit', containerObj, message);
      },

      rollback: function(error) {
        client.finishTransaction('rollback', containerObj, error);
      },

      // "rollback to"?
      connection: connection
    };

    // Ensure the transacting object methods are bound with the correct context.
    // _.bindAll(containerObj, 'commit', 'rollback');

    return containerObj;
  },

  initiateDeferred: function(container) {

    return function(containerObj) {

      // Initiate a deferred object, so we know when the
      // transaction completes or fails, we know what to do.
      var dfd = containerObj.dfd = Promise.pending();

      // Call the container with the transaction
      // commit & rollback objects.
      container(containerObj);

      // Return the promise for the entire transaction.
      return dfd.promise;

    };

  }

};
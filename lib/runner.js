var _       = require('lodash');
var Promise = require('../promise');

// The "Runner" constructor takes a "builder" (query, schema, or raw)
// and runs through each of the query statements, calling any additional
// "output" method provided alongside the query and bindings.
function Runner(builder) {
  this.builder     = builder;
  this.queries     = [];

  // The "connection" object is set on the runner when
  // "run" is called.
  this.connection = void 0;

  // If there are any "options" defined on the query,
  // collapse them into a single object which we can use
  this._options = builder._options && builder._options.length > 0 ?
    _.extend.apply(_, builder._options) : void 0;
}

Runner.prototype.beginTransaction = 'begin;';
Runner.prototype.commitTransaction = 'commit;';
Runner.prototype.rollbackTransaction = 'rollback;';

// "Run" the target, calling "toSql" on the builder, returning
// an object or array of queries to run, each of which are run on
// a single connection.
Runner.prototype.run = Promise.method(function() {
  if (this.builder._transacting) {
    return this.transactionQuery();
  }
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function() {
      var sql = this.builder.toSql();
      if (_.isArray(sql)) {
        return this.queryArray(sql);
      }
      return this.query(sql);
    })
    .finally(function() {
      // Determine if we want to release the connection.
      // If it wasn't specified on the builder explicitly,
      // then the answer here is yes.
    });
});

// In the case of the "schema builder" we call `queryArray`, which runs each
// of the queries in sequence.
Runner.prototype.queryArray = Promise.method(function(queries) {
  return Promise.bind(this)
    .thenReturn(queries)
    .reduce(function(memo, query) {
      return this.query(query).then(function(resp) {
        memo.push(resp);
        return memo;
      });
    }, []);
});

// Check whether there's a transaction flag, and that it has a connection.
Runner.prototype.ensureConnection = Promise.method(function() {
  if (this.builder._connection) {
    return this.builder._connection;
  }
  return this.client.acquireConnection();
});

// "Runs" a query, returning a promise. All queries specified by the builder are guaranteed
// to run in sequence, and on the same connection, especially helpful when schema building
// and dealing with foreign key constraints, etc.
Runner.prototype.query = Promise.method(function(obj) {
  if (this.isDebugging()) this.debug(obj);
  return this.execute(target, flags, method)
    .then(this.processResponse(this, target, method));
});

// Debug the query being "run".
Runner.prototype.debug = function(obj) {
  console.dir({
    sql: obj.sql,
    bindings: target.bindings,
    __cid: this.connection.__cid
  });
};

Runner.prototype.isDebugging = function() {
  return (this.client.isDebugging === true || this.builder._debug === true);
};

// Transaction Related Methods:

// Run the transaction on the correct "runner" instance.
Runner.prototype.transactionQuery = Promise.method(function() {
  var runner = this.builder._transacting._runner;
  if (!(runner instanceof Runner)) {
    throw new Error('Invalid transaction object provided.');
  }
  var sql = this.toSql();
  if (_.isArray(sql)) {
    return runner.queryArray(sql);
  }
  return runner.query(sql);
});

// Begins a transaction statement on the instance,
// resolving with the connection of the current transaction.
Runner.prototype.startTransaction = function() {
  return Promise.bind(this)
    .then(this.ensureConnection)
    .then(function(connection) {
      this.connection  = connection;
      this.transaction = true;
      return this.query({sql: this._beginTransaction});
    }).thenReturn(this);
};

// Finishes the transaction statement and handles disposing of the connection,
// resolving / rejecting the transaction's promise, and ensuring the transaction object's
// `_runner` property is `null`'ed out so it cannot continue to be used.
Runner.prototype.finishTransaction = Promise.method(function(action, containerObject, msg) {
  var query;

  // Run the query to commit / rollback the transaction.
  switch (action) {
    case 0:
      query = this.query(this._commitTransaction);
      break;
    case 1:
      query = this.query(this._rollbackTransaction);
      break;
  }

  return query.bind(this).then(function(resp) {
    switch (action) {
      case 0:
        dfd.fulfill(msg || resp);
        break;
      case 1:
        dfd.reject(msg || resp);
        break;
    }
  }).catch(dfd.reject).finally(function() {

    // Kill the "_runner" object on the containerObject,
    // so it's not possible to continue using the transaction object.
    containerObject._runner = void 0;

    // Release the connection
    return client.releaseConnection(this.connection);
  });
});

module.exports = Runner;
// ServerBase
// -------
var _          = require('lodash');
var Promise    = require('../promise');
var Runner     = require('./runner');

var serverBase = {

  __knex_client__: '0.6.0',

  // Initialize a pool with the apporpriate configuration and
  // bind the pool to the current client object.
  initPool: function(poolConfig) {
    this.Pool = require('../pool')(this);
    this.pool = Promise.promisifyAll(new this.Pool(_.extend({}, poolConfig, _.result(this, 'poolDefaults'))));
  },

  // Run a schema query
  runThen: Promise.method(function Server$runThen(builder) {
    var stack  = builder.toSql();
    var server = this;
    return this.checkTransaction(builder.flags).then(function(connection) {
      return new Runner(server, connection, builder.flags).run(stack, builder._method).lastly(function() {
        if (!builder.flags.transacting) {
          server.releaseConnection(connection);
        }
      });
    });
  }),

  // Check whether there's a transaction flag, and that it has a connection.
  checkTransaction: Promise.method(function(flags) {
    if (flags.transacting) {
      if (flags.transacting.connection) {
        return flags.transacting.connection;
      }
      throw new Error('Invalid transaction provided to the query.');
    }
    return this.getConnection();
  }),

  // Returns a promise with a connection from the connection pool.
  getConnection: function() {
    return this.pool.acquireAsync();
  },

  // // Since we usually only need the `sql` and `bindings` to help us debug the query, output them
  // // into a new error... this way, it `console.log`'s nicely for debugging, but you can also
  // // parse them out with a `JSON.parse(error.message)`. Also, use the original `clientError` from the
  // // database client is retained as a property on the `newError`, for any additional info.
  // return chain.then(builder.handleResponse).caught(function(error) {
  //   var newError = new Error(error.message + ', sql: ' + sql + ', bindings: ' + bindings);
  //       newError.sql = sql;
  //       newError.bindings = bindings;
  //       newError.clientError = error;
  //   throw newError;
  // });

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {
    return Promise.promisify(this.pool.release)(conn);
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    return this.getConnection()
      .tap(function(connection) {
        connection.__knexTransaction = 1;
        return Promise.promisify(connection.query, connection)('begin;', []);
      });
  },

  // Finishes the transaction statement on the instance.
  finishTransaction: function(type, transaction, msg) {
    var client = this;
    var dfd    = transaction.dfd;
    Promise.promisify(transaction.connection.query, transaction.connection)(type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.fulfill(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }, function (err) {
      dfd.reject(err);
    }).ensure(function() {
      return client.releaseConnection(transaction.connection).tap(function() {
        transaction.connection = null;
      });
    });
  }

};

module.exports = serverBase;
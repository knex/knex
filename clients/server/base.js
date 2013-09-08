var _          = require('underscore');
var nodefn     = require('when/node/function');

var Pool       = require('generic-pool').Pool;
var ClientBase = require('../base').ClientBase;

var ServerBase = ClientBase.extend({

  // Pass a config object into the constructor,
  // which then initializes the pool and
  constructor: function(config) {
    this.connectionSettings = config.connection;
    this.initPool(config.pool);
    this.initialize(config);
    _.bindAll(this, 'getRawConnection');
  },

  // Initialize a pool with the apporpriate configuration and
  // bind the pool to the current client object.
  initPool: function() {
    this.pool = new Pool(_.defaults(poolConfig, _.result(this, 'poolDefaults')));
  },

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    return new Query(this, builder, builder.usingConnection).run();
  },

  // Debug a query.
  debug: function() {
    console.log({sql: builder.sql, bindings: builder.bindings, __cid: conn.__cid});
  },

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function(builder) {
    return nodefn.call(this.pool.acquire);
  },

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {
    return nodefn.call(this.pool.release, conn);
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    return this.getConnection()
      .tap(function(connection) {
        return nodefn.call(connection.query.bind(connection), 'begin;', []);
      });
  },

  // Finishes the transaction statement on the instance.
  finishTransaction: function(type, transaction, msg) {
    var client = this;
    var dfd    = transaction.dfd;
    nodefn.call(trans.connection.query.bind(trans.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }, function (err) {
      dfd.reject(err);
    }).ensure(function() {
      return client.releaseConnection(trans.connection).then(function() {
        trans.connection = null;
      });
    });
  }

});

// Setup is called with the context of the current client.
exports.setup = function(Client, name, options) {
  this.debug = options.debug;

  // Default to draining on exit.
  if (poolInstance.drainOnExit !== false && typeof process === 'object') {
    process.on('exit', function() {

    });
  }
};

exports.ServerBase = ServerBase;
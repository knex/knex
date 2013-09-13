// ServerBase
// -------

// All of the "when.js" promise components needed in this module.
var when       = require('when');
var nodefn     = require('when/node/function');
var sequence   = require('when/sequence');

var _          = require('underscore');

var Pool       = require('../pool').Pool;
var ClientBase = require('../base').ClientBase;

var ServerBase = ClientBase.extend({

  // Pass a config object into the constructor,
  // which then initializes the pool and
  constructor: function(config) {
    if (config.debug) this.isDebugging = true;
    this.connectionSettings = config.connection;
    this.initPool(config.pool);
    _.bindAll(this, 'getRawConnection');
  },

  // Initialize a pool with the apporpriate configuration and
  // bind the pool to the current client object.
  initPool: function(poolConfig) {
    this.pool = new Pool(_.extend({}, poolConfig, _.result(this, 'poolDefaults')), this);
  },

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    var conn, client = this;
    var sql        = builder.toSql(builder);
    var bindings   = builder.getBindings();

    var chain = this.getConnection(builder).then(function(connection) {

      if (client.isDebugging || builder.isDebugging) {
        client.debug(sql, bindings, connection, builder);
      }

      conn = connection;
      if (_.isArray(sql)) {
        return sequence(sql.map(function(query, i) {
          builder.currentIndex = i;
          return function() { return client.runQuery(connection, query, bindings, builder); };
        }));
      }
      return client.runQuery(connection, sql, bindings, builder);
    });

    if (!builder.usingConnection) {
      chain = chain.ensure(function() {
        client.pool.release(conn);
      });
    }

    return chain.then(builder.handleResponse);
  },

  // Debug a query.
  debug: function(sql, bindings, connection, builder) {
    console.log({sql: sql, bindings: bindings, __cid: connection.__cid});
  },

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function(builder) {
    if (builder && builder.usingConnection) return when(builder.usingConnection);
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
    nodefn.call(transaction.connection.query.bind(transaction.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }, function (err) {
      dfd.reject(err);
    }).ensure(function() {
      return client.releaseConnection(transaction.connection).tap(function() {
        transaction.connection = null;
      });
    });
  }

});

exports.ServerBase = ServerBase;
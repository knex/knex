var when        = require('when');
var nodefn      = require('when/node/function');
var whenfn      = require('when/function');

var _           = require('underscore');
var util        = require('util');
var base        = require('./base');
var sqlite3     = require('sqlite3');

var ClientBase    = require('../base/sqlite3').Sqlite3;

// Constructor for the Sqlite3Client
var Sqlite3Client = ClientBase.extend({

  constructor: function(name, options) {
    base.setup.call(this, Sqlite3Client, name, options);
    this.dialect = 'sqlite3';
  },

  // Retrieves a connection from the connection pool,
  // returning a promise.
  getConnection: function() {
    return nodefn.call(this.pool.acquire);
  },

  // Releases a connection from the connection pool,
  // returning a promise.
  releaseConnection: function(conn) {
    return whenfn.call(this.pool.release, conn);
  },

  // Execute a query on the specified Builder or QueryBuilder
  // interface. If a `connection` is specified, use it, otherwise
  // acquire a connection, and then dispose of it when we're done.
  query: function(builder) {
    var emptyConnection = !builder._connection;
    var debug = this.debug || builder._debug;
    var instance = this;
    return when((builder._connection || this.getConnection()))
      .then(function(conn) {
        var dfd = when.defer();
        var method = (builder.type === 'insert' ||
          builder.type === 'update' || builder.type === 'delete') ? 'run' : 'all';

        // If we have a debug flag set, console.log the query.
        if (debug) base.debug(builder, conn);

        // Call the querystring and then release the client
        conn[method](builder.sql, builder.bindings, function (err, resp) {

          if (err) return dfd.reject(err);

          if (builder._source === 'Raw') return dfd.resolve(resp);

          if (builder._source === 'SchemaBuilder') {
            if (builder.type === 'tableExists') {
              return dfd.resolve(resp.length > 0);
            } else {
              return dfd.resolve(null);
            }
          }

          if (builder.type === 'select') {
            resp = base.skim(resp);
          } else if (builder.type === 'insert') {
            resp = [this.lastID];
          } else if (builder.type === 'delete' || builder.type === 'update') {
            resp = this.changes;
          } else {
            resp = '';
          }

          dfd.resolve(resp);
        });

        // Empty the connection after we run the query, unless one was specifically
        // set (in the case of transactions, etc).
        return dfd.promise.ensure(function(resp) {
          if (emptyConnection) instance.pool.release(conn);
          return resp;
        });
      });
  },

  poolDefaults: {
    max: 1,
    min: 1,
    destroy: function(client) { client.close(); }
  },

  getRawConnection: function(callback) {
    var client = new sqlite3.Database(this.connectionSettings.filename, function(err) {
      callback(err, client);
    });
  },

  // Begins a transaction statement on the instance,
  // resolving with the connection of the current transaction.
  startTransaction: function() {
    return this.getConnection().then(function(connection) {
      return nodefn.call(connection.run.bind(connection), 'begin;', []).then(function() {
        return connection;
      });
    });
  },

  finishTransaction: function(type, trans, dfd, msg) {
    var ctx = this;
    nodefn.call(trans.connection.run.bind(trans.connection), type + ';', []).then(function(resp) {
      if (type === 'commit') dfd.resolve(msg || resp);
      if (type === 'rollback') dfd.reject(msg || resp);
    }).ensure(function() {
      ctx.releaseConnection(trans.connection);
      trans.connection = null;
    });
  }

});

module.exports = Sqlite3Client;

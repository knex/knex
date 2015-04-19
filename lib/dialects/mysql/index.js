'use strict';

// MySQL Client
// -------
var inherits       = require('inherits')
var Client         = require('../../client')
var Promise        = require('../../promise')
var QueryCompiler  = require('./query/compiler')
var SchemaCompiler = require('./schema/compiler')
var assign         = require('lodash/object/assign')

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  Client.call(this, config);
}
inherits(Client_MySQL, Client);

assign(Client_MySQL.prototype, {

  dialect: 'mysql',

  QueryCompiler: QueryCompiler,

  SchemaCompiler: SchemaCompiler,

  wrapIdentifier: function(value) {
    return (value !== '*' ? '`' + value.replace(/`/g, '``') + '`' : '*')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var client = this
    var connection = mysql.createConnection(this.connectionSettings)
    this.databaseName = connection.config.database
    return new Promise(function(resolver, rejecter) {
      connection.connect(function(err) {
        if (err) return rejecter(err)
        connection.on('error', connectionErrorHandler.bind(null, client, connection))
        connection.on('end', connectionErrorHandler.bind(null, client, connection))
        resolver(connection)
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    connection.end(cb);
  }

})

// MySQL Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return
    connection.__knex__disposed = true
    client.pool.destroy(connection)
  }
}

module.exports = Client_MySQL

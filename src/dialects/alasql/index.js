
// AlaSQL
// -------
var inherits        = require('inherits')
var alasql          = require('alasql')

var Client_Postgres = require('../postgres')
var Promise         = require('../../promise')
var assign          = require('lodash/object/assign')

function Client_AlaSQL(config) {
  Client_Postgres.call(this, config);
  this.name          = config.name || 'knex_database';
  this.version       = config.version || '1.0';
  this.displayName   = config.displayName || this.name;
  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
}
inherits(Client_AlaSQL, Client_Postgres);

assign(Client_AlaSQL.prototype, {
  dialect: 'alasql',
  driverName: 'alasql',

  wrapIdentifier: function(value) {
    return value !== '*' ? '`' + value.replace(/"/g, '""') + '`' : '*';
  },

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireConnection: function() {
    var client = this;
    return new Promise(function(resolve, reject) {
      try {
        /*jslint browser: true*/
        var db = alasql.databases[client.name] || new alasql.Database(client.name);
        resolve(db);
      } catch (e) {
        reject(e);
      }
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  releaseConnection: function() {
    return Promise.resolve()
  },

  // Runs the query on the specified connection,
  // providing the bindings and any other necessary prep work.
  _query: function(connection, obj) {
    return new Promise(function(resolver, rejecter) {
      if (!connection) return rejecter(new Error('No connection provided.'));
      try {
        obj.response = connection.exec(obj.sql, obj.bindings);
        resolver(obj);
      } catch (e) {
        rejecter(e);
      }
    });
  },

  _stream: function(connection, sql, stream) {
    var client = this;
    return new Promise(function(resolver, rejecter) {
      stream.on('error', rejecter)
      stream.on('end', resolver)
      return client._query(connection, sql).then(function(obj) {
        return client.processResponse(obj)
      }).map(function(row) {
        stream.write(row)
      }).catch(function(err) {
        stream.emit('error', err)
      }).then(function() {
        stream.end()
      })
    })
  },

  processResponse: function(obj/*, runner*/) {
    return obj.response;
  }

})

module.exports = Client_AlaSQL;

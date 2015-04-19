'use strict';

// PostgreSQL
// -------
var _             = require('lodash')
var inherits      = require('inherits')
var Runner        = require('./runner')
var Client        = require('../../client')
var Promise       = require('../../promise')
var assign        = require('lodash/object/assign')
var QueryCompiler = require('./query/compiler')
var utils         = require('./utils')

function Client_PG(config) {
  Client.apply(this, arguments)
  if (config.returning) {
    this.defaultReturning = config.returning;
  }
}
inherits(Client_PG, Client)

assign(Client_PG.prototype, {

  Runner: Runner,

  QueryCompiler: QueryCompiler,

  dialect: 'postgresql',

  wrapValue: function(value) {
    if (value === '*') return value;
    var matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapValue(matched[1]) + matched[2];
    return '"' + value.replace(/"/g, '""') + '"';
  },

  // Lazy load the pg dependency, since we might just be using
  // the client to generate SQL strings.
  initDriver: function() {
    pg = pg || (function() {
      try {
        return require('pg');
      } catch (e) {
        return require('pg.js');
      }
    })();
  },

  // Prep the bindings as needed by PostgreSQL.
  prepBindings: function(bindings, tz) {
    return _.map(bindings, utils.prepareValue);
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var client = this;
    return new Promise(function(resolver, rejecter) {
      var connection = new pg.Client(client.connectionSettings);
      client.databaseName = connection.database;
      connection.connect(function(err, connection) {
        if (err) return rejecter(err);
        connection.on('error', this.endConnection.bind(this, connection));
        connection.on('end', this.endConnection.bind(this, connection));
        if (!client.version) {
          return client.checkVersion(connection).then(function(version) {
            client.version = version;
            resolver(connection);
          });
        }
        resolver(connection);
      });
    });
  },

  endConnection: function(connection) {
    if (!connection || connection.__knex__disposed) return;
    if (this.pool) {
      connection.__knex__disposed = true;
      this.pool.destroy(connection);
    }
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    connection.end();
    cb()
  },

  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion: function(connection) {
    return new Promise(function(resolver, rejecter) {
      connection.query('select version();', function(err, resp) {
        if (err) return rejecter(err);
        resolver(/^PostgreSQL (.*?) /.exec(resp.rows[0].version)[1]);
      });
    });
  },

  // Position the bindings for the query.
  positionBindings: function(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount++;
      return '$' + questionCount;
    });
  }

})

module.exports = Client_PG;

'use strict';

// Oracle Client
// -------
var inherits        = require('inherits')
var Client          = require('../../client')
var Promise         = require('../../promise')
var ReturningHelper = require('./utils').ReturningHelper
var Formatter       = require('./formatter')
var assign          = require('lodash/object/assign')
var QueryCompiler   = require('./query/compiler')

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
  Client.call(this, config)
}
inherits(Client_Oracle, Client)

assign(Client_Oracle.prototype, {

  // The "dialect", for reference elsewhere.
  dialect: 'oracle',

  // Lazy-load the oracle dependency, since we might just be
  // using the client to generate SQL strings.
  driverName: 'oracle',

  Formatter: Formatter,

  QueryCompiler: QueryCompiler,

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var client = this
    return new Promise(function(resolver, rejecter) {
      client.driver.connect(client.connectionSettings,
        function(err, connection) {
          if (err) return rejecter(err)
          if (client.connectionSettings.prefetchRowCount) {
            connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount)
          }
          resolver(connection)
        })
    })
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    connection.close()
    cb()
  },

  // Return the database for the Oracle client.
  database: function() {
    return this.connectionSettings.database
  },

  // Position the bindings for the query.
  positionBindings: function(sql) {
    var questionCount = 0
    return sql.replace(/\?/g, function() {
      questionCount += 1
      return ':' + questionCount
    })
  },

  preprocessBindings: function(bindings) {
    var driver = this.driver
    if (!bindings) {
      return bindings
    }
    return bindings.map(function(binding) {
      if (binding instanceof ReturningHelper && driver) {
        // returning helper uses always ROWID as string
        return new driver.OutParam(driver.OCCISTRING)
      }

      if (typeof binding === 'boolean') {
        return binding ? 1 : 0
      }
      return binding
    })
  }

})

module.exports = Client_Oracle

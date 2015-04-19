'use strict';

// MySQL2 Client
// -------
var inherits      = require('inherits')
var Client_MySQL  = require('../mysql')
var Promise       = require('../../promise')
var pick          = require('lodash/object/pick')
var configOptions = ['user', 'database', 'host', 'password', 'ssl', 'connection', 'stream']

var mysql2;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL2(config) {
  Client_MySQL.call(this, config)
}
inherits(Client_MySQL2, Client_MySQL)

// The "dialect", for reference elsewhere.
Client_MySQL2.prototype.driverName = 'mysql2';

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MySQL2.prototype.acquireRawConnection = function() {
  var connection = mysql2.createConnection(pick(this.connectionSettings, configOptions))
  this.databaseName = connection.config.database;
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err) {
      if (err) return rejecter(err)
      resolver(connection)
    })
  })
}

module.exports = Client_MySQL2;

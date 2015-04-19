'use strict';

// MariaSQL Client
// -------
var inherits     = require('inherits')
var assign       = require('lodash/object/assign')
var Client_MySQL = require('../mysql')
var Promise      = require('../../promise')

var Mariasql;

function Client_MariaSQL(config) {
  Client_MySQL.call(this, config);
}
inherits(Client_MariaSQL, Client_MySQL);

Client_MariaSQL.prototype.dialect = 'mariasql';

Client_MariaSQL.prototype.driverName = 'mariasql'

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MariaSQL.prototype.acquireRawConnection = function() {
  var connection = new Mariasql();
  connection.connect(assign({metadata: true}, this.connectionSettings));
  return new Promise(function(resolver, rejecter) {
    connection
      .on('connect', function() {
        connection.removeAllListeners('end');
        connection.removeAllListeners('error');
        resolver(connection);
      })
      .on('error', rejecter);
  })
}

// Return the database for the MariaSQL client.
Client_MariaSQL.prototype.database = function() {
  return this.connectionSettings.db;
}

module.exports = Client_MariaSQL

'use strict';

// MariaSQL Client
// -------
var inherits = require('inherits');

var _            = require('lodash');
var Client_MySQL = require('../mysql');
var Promise      = require('../../promise');

var Mariasql;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MariaSQL() {
  Client_MySQL.apply(this, arguments);
}
inherits(Client_MariaSQL, Client_MySQL);

// The "dialect", for reference elsewhere.
Client_MariaSQL.prototype.dialect = 'mariasql';

// Lazy-load the mariasql dependency, since we might just be
// using the client to generate SQL strings.
Client_MariaSQL.prototype.initDriver = function() {
  Mariasql = Mariasql || require('mariasql');
};

// Initialize the query "runner"
Client_MariaSQL.prototype.initRunner = function() {
  require('./runner')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MariaSQL.prototype.acquireRawConnection = function() {
  var connection = new Mariasql();
  connection.connect(_.extend({metadata: true}, this.connectionSettings));
  return new Promise(function(resolver, rejecter) {
    connection.on('connect', function() {
      connection.removeAllListeners('end');
      connection.removeAllListeners('error');
      resolver(connection);
    })
    .on('error', rejecter);
  });
};

// Return the database for the MariaSQL client.
Client_MariaSQL.prototype.database = function() {
  return this.connectionSettings.db;
};

module.exports = Client_MariaSQL;
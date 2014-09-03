'use strict';

// MySQL2 Client
// -------
var inherits = require('inherits');

var _            = require('lodash');
var Client_MySQL = require('../mysql');
var Promise      = require('../../promise');

var configOptions = ['user', 'database', 'host', 'password', 'ssl', 'connection', 'stream'];

var mysql2;

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL2() {
  Client_MySQL.apply(this, arguments);
}
inherits(Client_MySQL2, Client_MySQL);

// The "dialect", for reference elsewhere.
Client_MySQL2.prototype.dialect = 'mysql2';

// Lazy-load the mysql2 dependency, since we might just be
// using the client to generate SQL strings.
Client_MySQL2.prototype.initDriver = function() {
  mysql2 = mysql2 || require('mysql2');
};

// Initialize the query "runner"
Client_MySQL2.prototype.initRunner = function() {
  require('./runner')(this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_MySQL2.prototype.acquireRawConnection = function() {
  var connection = mysql2.createConnection(_.pick(this.connectionSettings, configOptions));
  return new Promise(function(resolver, rejecter) {
    connection.connect(function(err) {
      if (err) return rejecter(err);
      resolver(connection);
    });
  });
};

module.exports = Client_MySQL2;

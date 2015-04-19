'use strict';

// WebSQL
// -------
var inherits = require('inherits');
var _        = require('lodash');

var Client_SQLite3 = require('../sqlite3');
var Promise        = require('../../promise');

function Client_WebSQL(config) {
  Client_SQLite3.call(this, config);
  this.name          = config.name || 'knex_database';
  this.version       = config.version || '1.0';
  this.displayName   = config.displayName || this.name;
  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
}
inherits(Client_WebSQL, Client_SQLite3);

Client_WebSQL.prototype.dialect = 'websql';

// Get a raw connection from the database, returning a promise with the connection object.
Client_WebSQL.prototype.acquireConnection = function() {
  var client = this;
  return new Promise(function(resolve, reject) {
    try {
      /*jslint browser: true*/
      var db = openDatabase(client.name, client.version, client.displayName, client.estimatedSize);
      db.transaction(function(t) {
        t.__knexUid = _.uniqueId('__knexUid');
        resolve(t);
      });
    } catch (e) {
      reject(e);
    }
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_WebSQL.prototype.releaseConnection = Promise.method(function() {});

module.exports = Client_WebSQL;
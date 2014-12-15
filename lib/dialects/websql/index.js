'use strict';

// WebSQL
// -------
var inherits = require('inherits');
var _        = require('lodash');

var Client_SQLite3 = require('../sqlite3/index');
var Promise = require('../../promise');

function Client_WebSQL(config) {
  config = config || {};
  Client_SQLite3.super_.apply(this, arguments);
  if (config.debug) this.isDebugging = true;
  this.isQuoting = !!config.quote;
  this.name = config.name || 'knex_database';
  this.version = config.version || '1.0';
  this.displayName = config.displayName || this.name;
  this.estimatedSize = config.estimatedSize || 5 * 1024 * 1024;
  this.initDriver();
  this.initRunner();
  this.transaction = function () {
    return this;
  };
}
inherits(Client_WebSQL, Client_SQLite3);

Client_WebSQL.prototype.dialect = 'websql';
Client_WebSQL.prototype.initDriver = function() {};
Client_WebSQL.prototype.initPool = function() {};
Client_WebSQL.prototype.initMigrator = function() {};

// Initialize the query "runner"
Client_WebSQL.prototype.initRunner = function() {
  require('./runner')(this);
};

// Get a raw connection from the database, returning a promise with the connection object.
Client_WebSQL.prototype.acquireConnection = function() {
  var client = this;
  return new Promise(function(resolve, reject) {
    try {
      /*jslint browser: true*/
      var db = openDatabase(client.name, client.version, client.displayName, client.estimatedSize);
      db.transaction(function(t) {
        t.__cid = _.uniqueId('__cid');
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
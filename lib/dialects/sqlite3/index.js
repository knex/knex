'use strict';

// SQLite3
// -------
var Promise       = require('../../promise');

var inherits      = require('inherits');
var Client        = require('../../client');
var Runner        = require('./runner');
var QueryCompiler = require('./query/compiler')
var assign        = require('lodash/object/assign');

function Client_SQLite3(config) {
  Client.call(this, config)
}
inherits(Client_SQLite3, Client)

assign(Client_SQLite3.prototype, {

  dialect: 'sqlite3',

  moduleName: 'sqlite3',

  Runner: Runner,

  QueryCompiler: QueryCompiler,

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection: function() {
    var driver = this;
    return new Promise(function(resolve, reject) {
      var db = new sqlite3.Database(driver.connectionSettings.filename, function(err) {
        if (err) return reject(err);
        resolve(db);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    connection.close();
    cb()
  }

})

module.exports = Client_SQLite3;
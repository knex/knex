
// PostgreSQL Multi-Master BDR Client
// -------
'use strict';

var inherits = require('inherits');
var Client_PG = require('../postgres');
var assign = require('lodash/object/assign');
var BDRConnection = require('./bdr-connection');
var Promise = require('bluebird');

function Client_PGBDR(config) {
  if (config.connections.length < 1) {
    throw new Error('Bad options, connections array must contain at least one element!');
  }
  this.retryDelay = config.retryDelay || 5000;
  this.connectionTimeout = config.connectionTimeout || 1000;
  var configs = config.connections.map(function (conf) {
    return {
      connection: conf,
      pool: {
        max: 0
      }
    };
  });
  Client_PG.call(this, {
    connection: configs[0].connection,
    pool: config.pool
  });
  this.clients = configs.map(function (config) {
    return new Client_PG(config);
  });
}
inherits(Client_PGBDR, Client_PG);

assign(Client_PGBDR.prototype, {

  acquireRawConnection: function acquireRawConnection() {
    var conn = new BDRConnection(this.clients, this.retryDelay, this.connectionTimeout);
    return conn.init();
  },

  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.done();
  },

  _stream: function _stream(connection, obj, stream, options) {
    return connection.stream(obj, stream, options);
  },

  _query: function _query(connection, obj) {
    return connection.query(obj);
  }
});

module.exports = Client_PGBDR;
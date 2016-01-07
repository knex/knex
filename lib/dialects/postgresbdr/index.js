
// PostgreSQL Multi-Master BDR Client
// -------
'use strict';

var inherits = require('inherits');
var Client_PG = require('../postgres');
var assign = require('lodash/object/assign');
var BDRConnection = require('./bdr-connection');
var Promise = require('bluebird');

function Client_PGBDR(config) {
  var configs = config.connections.map(function (conf) {
    return {
      connection: conf,
      pool: {
        max: 0
      }
    };
  });
  Client_PG.call(this, {
    connection: configs[0].connection
  });
  this.clients = configs.map(function (config) {
    return new Client_PG(config);
  });
}
inherits(Client_PGBDR, Client_PG);

assign(Client_PGBDR.prototype, {
  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var conn = new BDRConnection(this.clients);
    return conn.init();
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.done();
  },

  _stream: function _stream(connection, obj, stream, options) {
    return connection.stream(obj, stream, options);
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {
    return connection.query(obj);
  }
});

module.exports = Client_PGBDR;
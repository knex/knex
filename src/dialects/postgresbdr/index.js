
// PostgreSQL Multi-Master BDR Client
// -------
var inherits     = require('inherits')
var Client_PG    = require('../postgres')
var assign       = require('lodash/object/assign');
var async        = require('async');
var Promise      = require('bluebird');

function Client_PGBDR(config) {
  var configs = config.connections.map(conf => {
    return {
      connection: conf
    }
  });
  Client_PG.call(this, configs[0]);
  this.clients = configs.map(config => new Client_PG(config));
}
inherits(Client_PGBDR, Client_PG)

assign(Client_PGBDR.prototype, {
  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    return Promise.all(this.clients.map(pgClient =>
      pgClient.acquireRawConnection()
    ));
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    async.parallell(connection.map(elem =>
      function(cb) {
        Client_PG.prototype.destroyRawConnection(elem, cb);
      }), cb)
  },

  _stream: function(connection, obj, stream, options) {
    return Client_PG.prototype._stream.bind(this)(connection[0], obj, stream, options)
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function(connection, obj) {
    return Client_PG.prototype._query.bind(this)(connection[0], obj);
  },
})

module.exports = Client_PGBDR;

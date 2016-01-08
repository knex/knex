
// PostgreSQL Multi-Master BDR Client
// -------
let inherits      = require('inherits')
let Client_PG     = require('../postgres')
let assign        = require('lodash/object/assign')
let BDRConnection = require('./bdr-connection')
let Promise       = require('bluebird')

function Client_PGBDR(config) {
  if(config.connections.length < 1) {
    throw new Error('Bad options, connections array must contain at least one element!')
  }
  this.retryDelay = config.retryDelay || 5000
  this.connectionTimeout = config.connectionTimeout || 1000
  let configs = config.connections.map(conf => {
    return {
      connection: conf,
      pool: {
        max: 0
      }
    }
  })
  Client_PG.call(this, {
    connection: configs[0].connection,
    pool: config.pool
  })
  this.clients = configs.map(config => new Client_PG(config))
}
inherits(Client_PGBDR, Client_PG)

assign(Client_PGBDR.prototype, {

  acquireRawConnection: function() {
    let conn = new BDRConnection(this.clients, this.retryDelay, this.connectionTimeout);
    return conn.init();
  },

  destroyRawConnection: function(connection, cb) {
    connection.done()
  },

  _stream: function(connection, obj, stream, options) {
    return connection.stream(obj, stream, options)
  },

  _query: function(connection, obj) {
    return connection.query(obj)
  },
})

module.exports = Client_PGBDR

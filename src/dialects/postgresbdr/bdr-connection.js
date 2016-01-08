let async        = require('async')
let Promise      = require('bluebird')
let debug        = require('debug')('client_pgbdr')

class BDRConnection {
  constructor(clients, retryDelay, connectionTimeout) {
    this.clients = clients
    this.pgConnections = clients.map(() => null)
    this.connectionTimeout = connectionTimeout
    setInterval(BDRConnection.prototype.init.bind(this), retryDelay)
  }

  init() {
    var self = this;
    debug('trying to set up connection with nodes')
    let promises = this.pgConnections.map((pgConnection, index) => {
      if(pgConnection !== null) {
        debug(`node ${index} already connected`)
        return Promise.resolve(pgConnection)
      }
      return self.clients[index].acquireRawConnection()
      .timeout(
        self.connectionTimeout,
        new Error(`node ${index} could not be reached (timeout)`)
      )
      .then(res => res)
      .catch(err => {
        debug(`node ${index} could not be connected to`)
        return null;
      });
    });

    return Promise.all(promises)
    .then(function (connections) {
      self.pgConnections = connections;
      return self;
    });
  }

  destroy(done) {
    var self = this;
    async.parallell(connection.map((elem, index) =>
      function(cb) {
        if(elem === null) {
          return process.nextTick(cb);
        }
        self.clients[index].destroyRawConnection(elem, cb);
      }), done);
  }

  stream(obj, stream, options) {
    let self = this;
    let index = this.pgConnections.findIndex(elem => elem !== null);
    if(index === -1) {
      throw new Error('all BDR nodes are down!!!!')
    }
    debug(`new query stream on node ${index}`);
    return this.clients[index]._stream(this.pgConnections[index], obj, stream, options)
    .catch(err => {
      if(err.code.search('ECONN') !== -1
        || err.code === 'EPIPE' ) {
         debug(`connection to node ${index} lost`)
         self.pgConnections[index] = null
         return self.stream(obj)
      }

      throw err;
    });
  }

  query(obj) {
    let self = this;
    let index = this.pgConnections.findIndex(elem => elem !== null)
    if(index === -1) {
      throw new Error('all BDR nodes are down!!!!')
    }
    debug(`new query request on node ${index}`)
    return this.clients[index]._query(this.pgConnections[index], obj)
    .catch(err => {
      if(err.code.search('ECONN') !== -1
        || err.code === 'EPIPE' ) {
         debug(`connection to node ${index} lost`)
         self.pgConnections[index] = null
         return self.query(obj)
      }

      throw err;
    });
  }
}

module.exports = BDRConnection

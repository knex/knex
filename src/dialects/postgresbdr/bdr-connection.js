let async        = require('async');
let Promise      = require('bluebird');

class BDRConnection {
  constructor(clients) {
    this.clients = clients;
    this.pgConnections = clients.map(() => null);
    setInterval(BDRConnection.prototype.init.bind(this), 5000)
  }

  init() {
    console.log('INITININITN')
    let self = this;
    let promises = this.pgConnections.map((pgConnection, index) => {
      if(pgConnection !== null) {
        return Promise.resolve(pgConnection);
      }
      return this.clients[index].acquireRawConnection()
      .timeout(
        1000,
        new Error('timeout')
      )
      .then(res => res)
      .catch(err => {
        //console.log("BONDIEU");
        console.log(err)
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
    async.parallell(connection.map((elem, index) =>
      function(cb) {
        if(elem === null) {
          return process.nextTick(cb);
        }
        this.clients[index].destroyRawConnection(elem, cb);
      }), done);
  }

  stream(obj, stream, options) {
    return Client_PG.prototype._stream.bind(this)(connection.getValidConnection(), obj, stream, options)
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  query(obj) {
    let self = this;
    let index = this.pgConnections.findIndex(elem => elem !== null);
    if(index === -1) {
      throw new Error('all BDR nodes are down!!!!')
    }
    console.log(`using index ${index}`);
    return this.clients[index]._query(this.pgConnections[index], obj)
    .catch(err => {
      console.log(`failed`);
      // TODO catch error types
      self.pgConnections[index] = null;
      return self.query(obj);
    });
  }
}

module.exports = BDRConnection;

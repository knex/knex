'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var async = require('async');
var Promise = require('bluebird');

var BDRConnection = (function () {
  function BDRConnection(clients) {
    _classCallCheck(this, BDRConnection);

    this.clients = clients;
    this.pgConnections = clients.map(function () {
      return null;
    });
    setInterval(BDRConnection.prototype.init.bind(this), 5000);
  }

  BDRConnection.prototype.init = function init() {
    var _this = this;

    console.log('INITININITN');
    var self = this;
    var promises = this.pgConnections.map(function (pgConnection, index) {
      if (pgConnection !== null) {
        return Promise.resolve(pgConnection);
      }
      return _this.clients[index].acquireRawConnection().timeout(1000, new Error('timeout')).then(function (res) {
        return res;
      })['catch'](function (err) {
        //console.log("BONDIEU");
        console.log(err);
        return null;
      });
    });

    return Promise.all(promises).then(function (connections) {
      self.pgConnections = connections;
      return self;
    });
  };

  BDRConnection.prototype.destroy = function destroy(done) {
    async.parallell(connection.map(function (elem, index) {
      return function (cb) {
        if (elem === null) {
          return process.nextTick(cb);
        }
        this.clients[index].destroyRawConnection(elem, cb);
      };
    }), done);
  };

  BDRConnection.prototype.stream = function stream(obj, _stream, options) {
    return Client_PG.prototype._stream.bind(this)(connection.getValidConnection(), obj, _stream, options);
  };

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.

  BDRConnection.prototype.query = function query(obj) {
    var self = this;
    var index = this.pgConnections.findIndex(function (elem) {
      return elem !== null;
    });
    if (index === -1) {
      throw new Error('all BDR nodes are down!!!!');
    }
    console.log('using index ' + index);
    return this.clients[index]._query(this.pgConnections[index], obj)['catch'](function (err) {
      console.log('failed');
      // TODO catch error types
      self.pgConnections[index] = null;
      return self.query(obj);
    });
  };

  return BDRConnection;
})();

module.exports = BDRConnection;
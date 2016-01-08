'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var async = require('async');
var Promise = require('bluebird');
var debug = require('debug')('client_pgbdr');

var BDRConnection = (function () {
  function BDRConnection(clients, retryDelay, connectionTimeout) {
    _classCallCheck(this, BDRConnection);

    this.clients = clients;
    this.pgConnections = clients.map(function () {
      return null;
    });
    this.connectionTimeout = connectionTimeout;
    setInterval(BDRConnection.prototype.init.bind(this), retryDelay);
  }

  BDRConnection.prototype.init = function init() {
    var self = this;
    debug('trying to set up connection with nodes');
    var promises = this.pgConnections.map(function (pgConnection, index) {
      if (pgConnection !== null) {
        debug('node ' + index + ' already connected');
        return Promise.resolve(pgConnection);
      }
      return self.clients[index].acquireRawConnection().timeout(self.connectionTimeout, new Error('node ' + index + ' could not be reached (timeout)')).then(function (res) {
        return res;
      })['catch'](function (err) {
        debug('node ' + index + ' could not be connected to');
        return null;
      });
    });

    return Promise.all(promises).then(function (connections) {
      self.pgConnections = connections;
      return self;
    });
  };

  BDRConnection.prototype.destroy = function destroy(done) {
    var self = this;
    async.parallell(connection.map(function (elem, index) {
      return function (cb) {
        if (elem === null) {
          return process.nextTick(cb);
        }
        self.clients[index].destroyRawConnection(elem, cb);
      };
    }), done);
  };

  BDRConnection.prototype.stream = function stream(obj, _stream, options) {
    var self = this;
    var index = this.pgConnections.findIndex(function (elem) {
      return elem !== null;
    });
    if (index === -1) {
      throw new Error('all BDR nodes are down!!!!');
    }
    debug('new query stream on node ' + index);
    return this.clients[index]._stream(this.pgConnections[index], obj, _stream, options)['catch'](function (err) {
      if (err.code.search('ECONN') !== -1 || err.code === 'EPIPE') {
        debug('connection to node ' + index + ' lost');
        self.pgConnections[index] = null;
        return self.stream(obj);
      }

      throw err;
    });
  };

  BDRConnection.prototype.query = function query(obj) {
    var self = this;
    var index = this.pgConnections.findIndex(function (elem) {
      return elem !== null;
    });
    if (index === -1) {
      throw new Error('all BDR nodes are down!!!!');
    }
    debug('new query request on node ' + index);
    return this.clients[index]._query(this.pgConnections[index], obj)['catch'](function (err) {
      if (err.code.search('ECONN') !== -1 || err.code === 'EPIPE') {
        debug('connection to node ' + index + ' lost');
        self.pgConnections[index] = null;
        return self.query(obj);
      }

      throw err;
    });
  };

  return BDRConnection;
})();

module.exports = BDRConnection;
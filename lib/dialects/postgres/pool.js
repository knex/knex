'use strict';

var _       = require('lodash');
var HashMap = require('hashmap');

module.exports = function(client) {

// Inherit from the `Pool` constructor's prototype.
function Pool_PG(config) {
  config = config || { };
  
  // node-postgres doesn't pass through a pool minimum size
  this.client = client;
  this.config = config;
  this.connectionSettings = _.extend(
    client.connectionSettings,
    { poolSize: config.max }
  );
  this.clients = new HashMap();
}

Pool_PG.prototype.acquire = function (callback) {
  var self = this;
  self.client.pg.connect(self.connectionSettings, function (err, connection, done) {
    if (err) { callback(err); return; }
    
    self.clients.set(connection, done);
    
    if (!self.client.version) {
      self.client.checkVersion(connection).then(function (version) {
        self.client.version = version;
        callback(null, connection);
      });
    } else {
      callback(null, connection);
    }
  });
};

Pool_PG.prototype.release = function (client, callback) {
  var self = this;
  if (!self.clients.has(client)) {
    callback(new Error('Released invalid or idle client'));
    return;
  }
  
  var done = self.clients.get(client);
  self.clients.remove(client);
  done(); // not async
  process.nextTick(callback.bind(null, null));
};

Pool_PG.prototype.destroy = function (callback) {
  this.client.pg.end(); // not async
  process.nextTick(callback.bind(null, null));
};
// Assign the newly extended `Pool` constructor to the client object.
client.Pool = Pool_PG;

};

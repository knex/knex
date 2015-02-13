'use strict';

var HashMap = require('hashmap');

module.exports = function(client) {

// Inherit from the `Pool` constructor's prototype.
function Pool_PG(config) {
  // node-postgres doesn't pass through a pool minimum size
  this.client = client;
  this.config = config;
  this.connectionSettings = client.connectionSettings;
  this.clients = new HashMap();
}

Pool_PG.prototype.acquire = function (callback) {
  var self = this;
  self.client.pg.connect(self.connectionSettings, function (err, client, done) {
    if (err) { callback(err); return; }
    self.clients.set(client, done);
    callback(null, client);
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

'use strict';

// MySQL Pool
// ------
module.exports = function(client) {

function Pool_MySQL(config) {
  this.client = client;
  this.config = config;
  this.pool = client.mysql.createPool(client.connectionSettings);
}

Pool_MySQL.prototype.acquire = function (callback) {
  this.pool.getConnection(callback);
};

Pool_MySQL.prototype.release = function (client, callback) {
  client.release();
  process.nextTick(callback.bind(null, null));
};

Pool_MySQL.prototype.destroy = function (callback) {
  this.pool.end(callback);
};

client.Pool = Pool_MySQL;

};

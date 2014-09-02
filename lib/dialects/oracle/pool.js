'use strict';

// Oracle Pool
// ------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Pool     = require('../../pool');

function Pool_Oracle() {
  this.client = client;
  Pool.apply(this, arguments);
}
inherits(Pool_Oracle, Pool);

Pool_Oracle.prototype.defaults = function() {
  return _.extend(Pool.prototype.defaults.call(this), {
    destroy: function(client) { client.close(); }
  });
};

client.Pool = Pool_Oracle;

};

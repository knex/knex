
// Oracle Client
// -------
var inherits      = require('inherits')
var Client_Oracle = require('../oracle')

function Client_StrongOracle() {
  Client_Oracle.apply(this, arguments);
}
inherits(Client_StrongOracle, Client_Oracle);

Client_StrongOracle.prototype._driver = function() {
  return require('strong-oracle')()
}

Client_StrongOracle.prototype.driverName = 'strong-oracle'

module.exports = Client_StrongOracle;

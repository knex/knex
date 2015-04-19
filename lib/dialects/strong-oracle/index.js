'use strict';

// Oracle Client
// -------
var inherits = require('inherits')
var Oracle   = require('../oracle')

function Client_StrongOracle() {
  Oracle.apply(this, arguments);
}
inherits(Client_StrongOracle, Oracle);

Client_StrongOracle.prototype.initDriver = function() {
  Client_StrongOracle.prototype.driver = Client_StrongOracle.prototype.driver ||
    require('strong-oracle')();
};

module.exports = Client_StrongOracle;

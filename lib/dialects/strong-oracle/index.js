'use strict';

// Oracle Client
// -------
var inherits      = require('inherits')
var Client_Oracle = require('../oracle')
var helpers       = require('../../helpers')

function Client_StrongOracle() {
  Client_Oracle.apply(this, arguments);
}
inherits(Client_StrongOracle, Client_Oracle);

Client_StrongOracle.prototype.initializeDriver = function() {
  try {
    this.driver = require(this.driverName)()
  } catch (e) {
    console.log(e)
    helpers.exit('Knex: run\n$ npm install ' + this.driverName + ' --save')
  }
}

Client_StrongOracle.prototype.driverName = 'strong-oracle'

module.exports = Client_StrongOracle;

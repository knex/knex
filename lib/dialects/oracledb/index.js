'use strict';

// Oracle Client
// -------
var inherits      = require('inherits')
var Client_Oracle = require('../oracle')

function Client_OracleDb() {
  Client_Oracle.apply(this, arguments);
}
inherits(Client_OracleDb, Client_Oracle);

Client_OracleDb.prototype.driverName = 'oracledb'

module.exports = Client_OracleDb;


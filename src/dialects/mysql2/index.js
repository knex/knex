
// MySQL2 Client
// -------
var inherits     = require('inherits')
var Client_MySQL = require('../mysql')
var Promise      = require('../../promise')
var helpers      = require('../../helpers')
var pick         = require('lodash/object/pick')
var pluck        = require('lodash/collection/pluck')
var assign       = require('lodash/object/assign');
var Transaction  = require('./transaction')

var configOptions = ['user', 'database', 'host', 'password', 'port', 'ssl', 'connection', 'stream'];

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL2(config) {
  Client_MySQL.call(this, config)
}
inherits(Client_MySQL2, Client_MySQL)

assign(Client_MySQL2.prototype, {

  // The "dialect", for reference elsewhere.
  driverName: 'mysql2',

  Transaction: Transaction,

  _driver: function() {
    return require('mysql2')
  },  

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var connection = this.driver.createConnection(pick(this.connectionSettings, configOptions))
    return new Promise(function(resolver, rejecter) {
      connection.connect(function(err) {
        if (err) return rejecter(err)
        resolver(connection)
      })
    })
  },

  processResponse: function(obj, runner) {
    var response = obj.response
    var method   = obj.method
    var rows     = response[0]
    var fields   = response[1]
    if (obj.output) return obj.output.call(runner, rows, fields)
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        var resp = helpers.skim(rows)
        if (method === 'pluck') return pluck(resp, obj.pluck)
        return method === 'first' ? resp[0] : resp
      case 'insert':
        return [rows.insertId]
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows
      default:
        return response
    }
  }

})

module.exports = Client_MySQL2;

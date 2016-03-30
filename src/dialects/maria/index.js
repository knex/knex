
// MariaSQL Client
// -------
var inherits      = require('inherits')
var Client_MySQL  = require('../mysql')
var Promise       = require('../../promise')
var SqlString     = require('../../query/string')
var helpers       = require('../../helpers')
var Transaction   = require('./transaction')

import {assign, map} from 'lodash'

function Client_MariaSQL(config) {
  Client_MySQL.call(this, config)
}
inherits(Client_MariaSQL, Client_MySQL)

assign(Client_MariaSQL.prototype, {

  dialect: 'mariadb',

  driverName: 'mariasql',

  Transaction: Transaction,

  _driver: function() {
    return require('mariasql')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var connection = new this.driver();
    connection.connect(assign({metadata: true}, this.connectionSettings));
    return new Promise(function(resolver, rejecter) {
      connection
        .on('ready', function() {
          connection.removeAllListeners('end');
          connection.removeAllListeners('error');
          resolver(connection);
        })
        .on('error', rejecter);
    })
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    connection.end()
    cb()
  },

  // Return the database for the MariaSQL client.
  database: function() {
    return this.connectionSettings.db;
  },

  // Grab a connection, run the query via the MariaSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function(connection, sql, stream) {
    return new Promise(function(resolver, rejecter) {
      connection.query(sql.sql, sql.bindings)
        .on('result', function(res) {
          res
            .on('error', rejecter)
            .on('end', function() {
              resolver(res.info);
            })
            .on('data', function (data) {
              stream.write(handleRow(data, res.info.metadata));
            })
        })
        .on('error', rejecter);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function(connection, obj) {
    var tz  = this.connectionSettings.timezone || 'local';
    return new Promise(function(resolver, rejecter) {
      if (!obj.sql) return resolver()
      var sql = SqlString.format(obj.sql, obj.bindings, tz);
      connection.query(sql, function (err, rows) {
        if (err) {
          return rejecter(err);
        }
        handleRows(rows, rows.info.metadata);
        obj.response = [rows, rows.info];
        resolver(obj);
      })
    });
  },

  // Process the response as returned from the query.
  processResponse: function(obj, runner) {
    var response = obj.response;
    var method   = obj.method;
    var rows     = response[0];
    var data     = response[1];
    if (obj.output) return obj.output.call(runner, rows/*, fields*/);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        var resp = helpers.skim(rows);
        if (method === 'pluck') return map(resp, obj.pluck);
        return method === 'first' ? resp[0] : resp;
      case 'insert':
        return [data.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return parseInt(data.affectedRows, 10);
      default:
        return response;
    }
  },

  // ping method for pool to validate connection.
  ping: function(connection, callback) {
    if (connection.connecting) {
      var listener = function(err) {
        connection.removeListener('close', listener)
        connection.removeListener('error', listener)
        connection.removeListener('end', listener)
        connection.removeListener('ready', listener)

        callback(err)
      }
      connection.on('close', listener)
      connection.on('error', listener)
      connection.on('end', listener)
      connection.on('ready', listener)
    } else if (connection.connected) {
      process.nextTick(callback)
    } else {
      process.nextTick(callback.bind(null, new Error('Not connected to database')))
    }
  }

})

function parseType(value, type) {
  switch (type) {
    case 'DATETIME':
    case 'TIMESTAMP':
      return new Date(value);
    case 'INTEGER':
      return parseInt(value, 10);
    default:
      return value;
  }
}

function handleRow(row, metadata) {
  var keys = Object.keys(metadata);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var type = metadata[key].type;
    row[key] = parseType(row[key], type);
  }
  return row;
}

function handleRows(rows, metadata) {
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    handleRow(row, metadata);
  }
  return rows;
}

module.exports = Client_MariaSQL

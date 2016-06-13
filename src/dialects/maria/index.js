
// MariaSQL Client
// -------
import inherits from 'inherits';
import Client_MySQL from '../mysql';
import Promise from '../../promise';
import SqlString from '../../query/string';
import * as helpers from '../../helpers';
import Transaction from './transaction';

import { assign, map } from 'lodash'

function Client_MariaSQL(config) {
  Client_MySQL.call(this, config)
}
inherits(Client_MariaSQL, Client_MySQL)

assign(Client_MariaSQL.prototype, {

  dialect: 'mariadb',

  driverName: 'mariasql',

  Transaction,

  _driver() {
    return require('mariasql')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const connection = new this.driver();
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
  destroyRawConnection(connection, cb) {
    connection.end()
    cb()
  },

  // Return the database for the MariaSQL client.
  database() {
    return this.connectionSettings.db;
  },

  // Grab a connection, run the query via the MariaSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, sql, stream) {
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
  _query(connection, obj) {
    const tz = this.connectionSettings.timezone || 'local';
    return new Promise(function(resolver, rejecter) {
      if (!obj.sql) return resolver()
      const sql = SqlString.format(obj.sql, obj.bindings, tz);
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
  processResponse(obj, runner) {
    const { response } = obj;
    const { method } = obj;
    const rows = response[0];
    const data = response[1];
    if (obj.output) return obj.output.call(runner, rows/*, fields*/);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        const resp = helpers.skim(rows);
        if (method === 'pluck') return map(resp, obj.pluck);
        return method === 'first' ? resp[0] : resp;
      }
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

  ping(resource, callback) {
    resource.query('SELECT 1', callback);
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
  const keys = Object.keys(metadata);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const { type } = metadata[key];
    row[key] = parseType(row[key], type);
  }
  return row;
}

function handleRows(rows, metadata) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    handleRow(row, metadata);
  }
  return rows;
}

export default Client_MariaSQL

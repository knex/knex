
// MySQL Client
// -------
import inherits from 'inherits';

import Client from '../../client';
import Promise from '../../promise';
import * as helpers from '../../helpers';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import SchemaCompiler from './schema/compiler';
import TableCompiler from './schema/tablecompiler';
import ColumnCompiler from './schema/columncompiler';

import { assign, map } from 'lodash'

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL(config) {
  Client.call(this, config);
}
inherits(Client_MySQL, Client);

assign(Client_MySQL.prototype, {

  dialect: 'mysql',

  driverName: 'mysql',

  _driver() {
    return require('mysql')
  },

  QueryCompiler,

  SchemaCompiler,

  TableCompiler,

  ColumnCompiler,

  Transaction,

  wrapIdentifier(value) {
    return (value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this
    const connection = this.driver.createConnection(this.connectionSettings)
    return new Promise(function(resolver, rejecter) {
      connection.connect(function(err) {
        if (err) return rejecter(err)
        connection.on('error', client._connectionErrorHandler.bind(null, client, connection))
        connection.on('end', client._connectionErrorHandler.bind(null, client, connection))
        resolver(connection)
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection, cb) {
    connection.end(cb);
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {}
    return new Promise(function(resolver, rejecter) {
      stream.on('error', rejecter)
      stream.on('end', resolver)
      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream)
    })
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = {sql: obj}
    return new Promise(function(resolver, rejecter) {
      let { sql } = obj
      if (!sql) return resolver()
      if (obj.options) sql = assign({sql}, obj.options)
      connection.query(sql, obj.bindings, function(err, rows, fields) {
        if (err) return rejecter(err)
        obj.response = [rows, fields]
        resolver(obj)
      })
    })
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response } = obj
    const { method } = obj
    const rows = response[0]
    const fields = response[1]
    if (obj.output) return obj.output.call(runner, rows, fields)
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        const resp = helpers.skim(rows)
        if (method === 'pluck') return map(resp, obj.pluck)
        return method === 'first' ? resp[0] : resp
      }
      case 'insert':
        return [rows.insertId]
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows
      default:
        return response
    }
  },

  // MySQL Specific error handler
  _connectionErrorHandler: (client, connection, err) => {
    if(connection && err && err.fatal && !connection.__knex__disposed) {
      connection.__knex__disposed = true;
      client.pool.destroy(connection);
    }
  },

  ping(resource, callback) {
    resource.query('SELECT 1', callback);
  },

  canCancelQuery: true,

  cancelQuery(connectionToKill) {
    const acquiringConn = this.acquireConnection().completed

    // Error out if we can't acquire connection in time.
    // Purposely not putting timeout on `KILL QUERY` execution because erroring
    // early there would release the `connectionToKill` back to the pool with
    // a `KILL QUERY` command yet to finish.
    return acquiringConn
      .timeout(100)
      .then((conn) => this.query(conn, {
        method: 'raw',
        sql: 'KILL QUERY ?',
        bindings: [connectionToKill.threadId],
        options: {},
      }))
      .finally(() => {
        // NOT returning this promise because we want to release the connection
        // in a non-blocking fashion
        acquiringConn
          .then((conn) => this.releaseConnection(conn));
      });
  }

})

export default Client_MySQL

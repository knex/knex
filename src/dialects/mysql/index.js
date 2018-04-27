
// MySQL Client
// -------
import inherits from 'inherits';

import Client from '../../client';
import Promise from 'bluebird';
import * as helpers from '../../helpers';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import SchemaCompiler from './schema/compiler';
import TableCompiler from './schema/tablecompiler';
import ColumnCompiler from './schema/columncompiler';

import { assign, map } from 'lodash'
import { makeEscape } from '../../query/string'

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

  queryCompiler() {
    return new QueryCompiler(this, ...arguments)
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments)
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments)
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments)
  },

  transaction() {
    return new Transaction(this, ...arguments)
  },

  _escapeBinding: makeEscape(),

  wrapIdentifierImpl(value) {
    return (value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const connection = this.driver.createConnection(this.connectionSettings);
      connection.on('error', err => {
        connection.__knex__disposed = err;
      });
      connection.connect((err) => {
        if (err) {
          // if connection is rejected, remove listener that was registered above...
          connection.removeAllListeners();
          return rejecter(err);
        }
        resolver(connection);
      });
    })
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return Promise
      .fromCallback(connection.end.bind(connection))
      .catch(err => {
        connection.__knex__disposed = err
      })
      .finally(() => connection.removeAllListeners());
  },

  validateConnection(connection) {
    if (connection.state === 'connected' || connection.state === 'authenticated') {
      return true
    }
    return false
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {}
    const queryOptions = assign({sql: obj.sql}, obj.options)
    return new Promise((resolver, rejecter) => {
      stream.on('error', rejecter)
      stream.on('end', resolver)
      connection.query(queryOptions, obj.bindings).stream(options).pipe(stream)
    })
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = {sql: obj}
    return new Promise(function(resolver, rejecter) {
      if (!obj.sql) {
        resolver()
        return
      }
      const queryOptions = assign({sql: obj.sql}, obj.options)
      connection.query(queryOptions, obj.bindings, function(err, rows, fields) {
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

  canCancelQuery: true,

  cancelQuery(connectionToKill) {
    const acquiringConn = this.acquireConnection()

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

// MySQL Client
// -------

import Promise from 'bluebird';
import { map } from 'lodash';
import { Client } from '../../client';
import { makeEscape } from '../../query/string';
import { QueryCompiler_MySQL } from './query/compiler';
import { ColumnCompiler_MySQL } from './schema/columncompiler';
import { SchemaCompiler_MySQL } from './schema/compiler';
import { TableCompiler_MySQL } from './schema/tablecompiler';
import { Transaction_MySQL } from './transaction';

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
export class Client_MySQL extends Client {
  dialect = 'mysql';

  driverName = 'mysql';

  _driver() {
    return require('mysql');
  }

  queryCompiler() {
    return new QueryCompiler_MySQL(this, ...arguments);
  }

  schemaCompiler() {
    return new SchemaCompiler_MySQL(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler_MySQL(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler_MySQL(this, ...arguments);
  }

  transaction() {
    return new Transaction_MySQL(this, ...arguments);
  }

  _escapeBinding = makeEscape();

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  }

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const connection = this.driver.createConnection(this.connectionSettings);
      connection.on('error', (err) => {
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
    });
  }

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return Promise.fromCallback(connection.end.bind(connection))
      .catch((err) => {
        connection.__knex__disposed = err;
      })
      .finally(() => connection.removeAllListeners());
  }

  validateConnection(connection) {
    if (
      connection.state === 'connected' ||
      connection.state === 'authenticated'
    ) {
      return true;
    }
    return false;
  }

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {};
    const queryOptions = { sql: obj.sql, ...obj.options };
    return new Promise((resolver, rejecter) => {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      const queryStream = connection
        .query(queryOptions, obj.bindings)
        .stream(options);

      queryStream.on('error', (err) => {
        rejecter(err);
        stream.emit('error', err);
      });

      queryStream.pipe(stream);
    });
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise(function(resolver, rejecter) {
      if (!obj.sql) {
        resolver();
        return;
      }
      const queryOptions = { sql: obj.sql, ...obj.options };
      connection.query(queryOptions, obj.bindings, function(err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  }

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response } = obj;
    const { method } = obj;
    const rows = response[0];
    const fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        if (method === 'pluck') return map(rows, obj.pluck);
        return method === 'first' ? rows[0] : rows;
      }
      case 'insert':
        return [rows.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows;
      default:
        return response;
    }
  }

  canCancelQuery = true;

  cancelQuery(connectionToKill) {
    const acquiringConn = this.acquireConnection();

    // Error out if we can't acquire connection in time.
    // Purposely not putting timeout on `KILL QUERY` execution because erroring
    // early there would release the `connectionToKill` back to the pool with
    // a `KILL QUERY` command yet to finish.
    return acquiringConn
      .timeout(100)
      .then((conn) =>
        this.query(conn, {
          method: 'raw',
          sql: 'KILL QUERY ?',
          bindings: [connectionToKill.threadId],
          options: {},
        })
      )
      .finally(() => {
        // NOT returning this promise because we want to release the connection
        // in a non-blocking fashion
        acquiringConn.then((conn) => this.releaseConnection(conn));
      });
  }
}

export default Client_MySQL;

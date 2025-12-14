// MySQL Client
// -------
const defer = require('lodash/defer');
const map = require('lodash/map');
const { promisify } = require('util');
const Client = require('../../client');

const Transaction = require('./transaction');
const QueryBuilder = require('./query/mysql-querybuilder');
const QueryCompiler = require('./query/mysql-querycompiler');
const SchemaCompiler = require('./schema/mysql-compiler');
const TableCompiler = require('./schema/mysql-tablecompiler');
const ColumnCompiler = require('./schema/mysql-columncompiler');

const { makeEscape } = require('../../util/string');
const ViewCompiler = require('./schema/mysql-viewcompiler');
const ViewBuilder = require('./schema/mysql-viewbuilder');

/**
 * @typedef {any[]} MySQLSelectResponse
 * @property {'select'|'first'|'pluck'} method
 *
 * @typedef {Object} MySQLInsertResponse
 * @property {'insert'|'del'|'update'|'counter'} method
 * @property {number} insertId
 * @property {number} affectedRows
 *
 * @typedef {MySQLSelectResponse|MySQLInsertResponse} MySQLRawResponse
 * @property {'raw'} method
 *
 * @typedef {MySQLSelectResponse|MySQLInsertResponse|MySQLRawResponse} MySQLResponse
 *
 * @typedef {Object} MySQLContext
 * @property {any[]} fields
 *
 * @typedef {import('../../query/querycompiler').ProcessResponseQueryObject<MySQLResponse, MySQLContext>} QueryObject
 */

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
class Client_MySQL extends Client {
  _driver() {
    return require('mysql');
  }

  queryBuilder() {
    return new QueryBuilder(this);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  viewCompiler() {
    return new ViewCompiler(this, ...arguments);
  }

  viewBuilder() {
    return new ViewBuilder(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  transaction() {
    return new Transaction(this, ...arguments);
  }

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
  async destroyRawConnection(connection) {
    try {
      const end = promisify((cb) => connection.end(cb));
      return await end();
    } catch (err) {
      connection.__knex__disposed = err;
    } finally {
      // see discussion https://github.com/knex/knex/pull/3483
      defer(() => connection.removeAllListeners());
    }
  }

  validateConnection(connection) {
    return (
      connection.state === 'connected' || connection.state === 'authenticated'
    );
  }

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error('The query is empty');

    options = options || {};
    const queryOptions = Object.assign({ sql: obj.sql }, obj.options);
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
    if (!obj.sql) throw new Error('The query is empty');

    return new Promise(function (resolver, rejecter) {
      if (!obj.sql) {
        resolver();
        return;
      }
      const queryOptions = Object.assign({ sql: obj.sql }, obj.options);
      connection.query(
        queryOptions,
        obj.bindings,
        function (err, response, fields) {
          if (err) return rejecter(err);

          obj.context = { fields };
          obj.response = response;

          resolver(obj);
        }
      );
    });
  }

  /**
   * Ensures the response is returned in the same format as other clients.
   *
   * @param {QueryObject} query
   * @returns {any}
   */
  processResponse(query) {
    const { response } = query;
    const { method } = query;

    switch (method) {
      case 'select':
        return response;
      case 'first':
        return response[0];
      case 'pluck':
        return map(response, query.pluck);
      case 'insert':
        return [response.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return response.affectedRows;
      case 'upsert':
        // this is a problem. the internal implementation details leaked
        // into the public-facing api. i'm not sure if upsert was expecting
        // to return an array of things-representing-inserted-rows, but probably?
        // and then, the test just happened to work because the tuple of [rows, fields]
        // is indistinguishable from an array of row[]
        //
        // i'll have to research deeply what the correct solution is here
        //
        // is this only a breaking change for knex.raw() ?

        // mysql doesn't return multiple insert ids, but to conform to the
        // normal shape of api responses, we need to make our results an array here
        // as we did in the 'insert' case above
        return [response];
      default:
        return response;
    }
  }

  async cancelQuery(connectionToKill) {
    const conn = await this.acquireRawConnection();
    try {
      return await this._wrappedCancelQueryCall(conn, connectionToKill);
    } finally {
      await this.destroyRawConnection(conn);
      if (conn.__knex__disposed) {
        this.logger.warn(`Connection Error: ${conn.__knex__disposed}`);
      }
    }
  }

  _wrappedCancelQueryCall(conn, connectionToKill) {
    return this._query(conn, {
      sql: 'KILL QUERY ?',
      bindings: [connectionToKill.threadId],
      options: {},
    });
  }
}

Object.assign(Client_MySQL.prototype, {
  dialect: 'mysql',

  driverName: 'mysql',

  _escapeBinding: makeEscape(),

  canCancelQuery: true,
});

module.exports = Client_MySQL;

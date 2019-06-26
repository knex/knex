// Oracle Client
// -------
const { assign, map, flatten, values } = require('lodash');

const inherits = require('inherits');
const Client = require('../../client');
const Bluebird = require('bluebird');
const { bufferToString } = require('../../query/string');
const Formatter = require('./formatter');

const Transaction = require('./transaction');
const QueryCompiler = require('./query/compiler');
const SchemaCompiler = require('./schema/compiler');
const ColumnBuilder = require('./schema/columnbuilder');
const ColumnCompiler = require('./schema/columncompiler');
const TableCompiler = require('./schema/tablecompiler');
const { ReturningHelper, isConnectionError } = require('./utils');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
  Client.call(this, config);
}

inherits(Client_Oracle, Client);

assign(Client_Oracle.prototype, {
  dialect: 'oracle',

  driverName: 'oracle',

  _driver() {
    return require('oracle');
  },

  transaction() {
    return new Transaction(this, ...arguments);
  },

  formatter() {
    return new Formatter(this, ...arguments);
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },

  prepBindings(bindings) {
    return map(bindings, (value) => {
      // returning helper uses always ROWID as string
      if (value instanceof ReturningHelper && this.driver) {
        return new this.driver.OutParam(this.driver.OCCISTRING);
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (Buffer.isBuffer(value)) {
        return bufferToString(value);
      }
      return value;
    });
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Bluebird((resolver, rejecter) => {
      this.driver.connect(this.connectionSettings, (err, connection) => {
        if (err) return rejecter(err);
        Bluebird.promisifyAll(connection);
        if (this.connectionSettings.prefetchRowCount) {
          connection.setPrefetchRowCount(
            this.connectionSettings.prefetchRowCount
          );
        }
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return Bluebird.fromCallback(connection.close.bind(connection));
  },

  // Return the database for the Oracle client.
  database() {
    return this.connectionSettings.database;
  },

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/\?/g, function() {
      questionCount += 1;
      return `:${questionCount}`;
    });
  },

  _stream(connection, obj, stream, options) {
    return new Bluebird(function(resolver, rejecter) {
      stream.on('error', (err) => {
        if (isConnectionError(err)) {
          connection.__knex__disposed = err;
        }
        rejecter(err);
      });
      stream.on('end', resolver);
      const queryStream = connection.queryStream(
        obj.sql,
        obj.bindings,
        options
      );
      queryStream.pipe(stream);
      queryStream.on('error', function(error) {
        rejecter(error);
        stream.emit('error', error);
      });
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    return connection
      .executeAsync(obj.sql, obj.bindings)
      .then(function(response) {
        if (!obj.returning) return response;
        const rowIds = obj.outParams.map(
          (v, i) => response[`returnParam${i ? i : ''}`]
        );
        return connection.executeAsync(obj.returningSql, rowIds);
      })
      .then(function(response) {
        obj.response = response;
        obj.rowsAffected = response.updateCount;
        return obj;
      })
      .catch((err) => {
        if (isConnectionError(err)) {
          connection.__knex__disposed = err;
        }
        throw err;
      });
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    let { response } = obj;
    const { method } = obj;
    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (obj.method === 'pluck') response = map(response, obj.pluck);
        return obj.method === 'first' ? response[0] : response;
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning.length > 1 || obj.returning[0] === '*') {
            return response;
          }
          // return an array with values if only one returning value was specified
          return flatten(map(response, values));
        }
        return obj.rowsAffected;
      default:
        return response;
    }
  },
});

module.exports = Client_Oracle;

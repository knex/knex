
// Oracle Client
// -------
import { assign, map, flatten, values } from 'lodash'

import inherits from 'inherits';
import Client from '../../client';
import Promise from 'bluebird';
import * as helpers from '../../helpers';
import {bufferToString} from '../../query/string';
import Formatter from './formatter';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import SchemaCompiler from './schema/compiler';
import ColumnBuilder from './schema/columnbuilder';
import ColumnCompiler from './schema/columncompiler';
import TableCompiler from './schema/tablecompiler';
import OracleQueryStream from './stream';
import { ReturningHelper } from './utils';

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
export default function Client_Oracle(config) {
  Client.call(this, config)
}
inherits(Client_Oracle, Client)

assign(Client_Oracle.prototype, {

  dialect: 'oracle',

  driverName: 'oracle',

  _driver() {
    return require('oracle')
  },

  transaction() {
    return new Transaction(this, ...arguments)
  },

  formatter() {
    return new Formatter(this)
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments)
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments)
  },

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments)
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments)
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments)
  },

  prepBindings(bindings) {
    return map(bindings, (value) => {
      // returning helper uses always ROWID as string
      if (value instanceof ReturningHelper && this.driver) {
        return new this.driver.OutParam(this.driver.OCCISTRING)
      }
      else if (typeof value === 'boolean') {
        return value ? 1 : 0
      }
      else if (Buffer.isBuffer(value)) {
        return bufferToString(value)
      }
      return value
    })
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      this.driver.connect(this.connectionSettings, (err, connection) => {
        if (err) return rejecter(err)
        Promise.promisifyAll(connection)
        if (this.connectionSettings.prefetchRowCount) {
          connection.setPrefetchRowCount(this.connectionSettings.prefetchRowCount)
        }
        resolver(connection)
      })
    })
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    connection.close()
  },

  // Return the database for the Oracle client.
  database() {
    return this.connectionSettings.database
  },

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = 0
    return sql.replace(/\?/g, function() {
      questionCount += 1
      return `:${questionCount}`
    })
  },

  _stream(connection, obj, stream, options) {
    obj.sql = this.positionBindings(obj.sql);
    return new Promise(function (resolver, rejecter) {
      stream.on('error', (err) => {
        if (isConnectionError(err)) {
          connection.__knex__disposed = err
        }
        rejecter(err)
      })
      stream.on('end', resolver);
      const queryStream = new OracleQueryStream(connection, obj.sql, obj.bindings, options);
      queryStream.pipe(stream)
    })
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {

    // convert ? params into positional bindings (:1)
    obj.sql = this.positionBindings(obj.sql);

    if (!obj.sql) throw new Error('The query is empty');

    return connection.executeAsync(obj.sql, obj.bindings).then(function(response) {
      if (!obj.returning) return response
      const rowIds = obj.outParams.map((v, i) => response[`returnParam${i ? i : ''}`]);
      return connection.executeAsync(obj.returningSql, rowIds)
    }).then(function(response) {
      obj.response = response;
      obj.rowsAffected  = response.updateCount;
      return obj;
    }).catch(err => {
      if (isConnectionError(err)) {
        connection.__knex__disposed = err
      }
      throw err
    })

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
        response = helpers.skim(response);
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
  }

})

// If the error is any of these, we'll assume we need to
// mark the connection as failed
const connectionErrors = [
  'ORA-12514', 'NJS-040', 'NJS-024', 'NJS-003', 'NJS-024'
]

function isConnectionError(err) {
  return connectionErrors.some(prefix => err.message.indexOf(prefix) === 0)
}


// Oracle Client
// -------
import { assign, map, flatten, values } from 'lodash'

import inherits from 'inherits';
import Formatter from './formatter';
import Client from '../../client';
import Promise from '../../promise';
import * as helpers from '../../helpers';
import SqlString from '../../query/string';

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
function Client_Oracle(config) {
  Client.call(this, config)
}
inherits(Client_Oracle, Client)

assign(Client_Oracle.prototype, {

  dialect: 'oracle',

  driverName: 'oracle',

  _driver() {
    return require('oracle')
  },

  Transaction,

  Formatter,

  QueryCompiler,

  SchemaCompiler,

  ColumnBuilder,

  ColumnCompiler,

  TableCompiler,

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
        return SqlString.bufferToString(value)
      }
      return value
    })
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this
    return new Promise(function(resolver, rejecter) {
      client.driver.connect(client.connectionSettings,
        function(err, connection) {
          if (err) return rejecter(err)
          Promise.promisifyAll(connection)
          if (client.connectionSettings.prefetchRowCount) {
            connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount)
          }
          resolver(connection)
        })
    })
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection, cb) {
    connection.close()
    cb()
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
      stream.on('error', rejecter);
      stream.on('end', resolver);
      const queryStream = new OracleQueryStream(connection, obj.sql, obj.bindings, options);
      queryStream.pipe(stream)
    });
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
  },

  ping(resource, callback) {
    resource.execute('SELECT 1 FROM DUAL', [], callback);
  }

})

export default Client_Oracle

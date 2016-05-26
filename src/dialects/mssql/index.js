
// MSSQL Client
// -------
import { assign, map, flatten, values } from 'lodash'
import inherits from 'inherits';

import Formatter from './formatter';
import Client from '../../client';
import Promise from '../../promise';
import * as helpers from '../../helpers';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import SchemaCompiler from './schema/compiler';
import TableCompiler from './schema/tablecompiler';
import ColumnCompiler from './schema/columncompiler';

const { isArray } = Array;

const SQL_INT4 = { MIN : -2147483648, MAX: 2147483647}
const SQL_BIGINT_SAFE = { MIN : -9007199254740991, MAX: 9007199254740991}

// Always initialize with the "QueryBuilder" and "QueryCompiler" objects, which
// extend the base 'lib/query/builder' and 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  // #1235 mssql module wants 'server', not 'host'. This is to enforce the same
  // options object across all dialects.
  if(config && config.connection && config.connection.host) {
    config.connection.server = config.connection.host;
  }
  Client.call(this, config);
}
inherits(Client_MSSQL, Client);

assign(Client_MSSQL.prototype, {

  dialect: 'mssql',

  driverName: 'mssql',

  _driver() {
    return require('mssql');
  },

  Transaction,

  Formatter,

  QueryCompiler,

  SchemaCompiler,

  TableCompiler,

  ColumnCompiler,

  wrapIdentifier(value) {
    return (value !== '*' ? `[${value.replace(/\[/g, '\[')}]` : '*')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this;
    const connection = new this.driver.Connection(this.connectionSettings);
    return new Promise(function(resolver, rejecter) {
      connection.connect(function(err) {
        if (err) return rejecter(err);
        connection.on('error', connectionErrorHandler.bind(null, client, connection));
        connection.on('end', connectionErrorHandler.bind(null, client, connection));
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection, cb) {
    connection.close(cb);
  },

  // Position the bindings for the query.
  positionBindings(sql) {
    let questionCount = -1
    return sql.replace(/\?/g, function() {
      questionCount += 1
      return `@p${questionCount}`
    })
  },

  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    const client = this;
    options = options || {}
    if (!obj || typeof obj === 'string') obj = {sql: obj}
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    return new Promise(function(resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      let { sql } = obj
      if (!sql) return resolver()
      if (obj.options) ({ sql } = assign({sql}, obj.options))
      const req = (connection.tx_ || connection).request();
      //req.verbose = true;
      req.multiple = true;
      req.stream = true;
      if (obj.bindings) {
        for (let i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i])
        }
      }
      req.pipe(stream)
      req.query(sql)
    })
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    const client = this;
    if (!obj || typeof obj === 'string') obj = {sql: obj}
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    return new Promise(function(resolver, rejecter) {
      let { sql } = obj
      if (!sql) return resolver()
      if (obj.options) ({ sql } = assign({sql}, obj.options))
      const req = (connection.tx_ || connection).request();
      // req.verbose = true;
      req.multiple = true;
      if (obj.bindings) {
        for (let i = 0; i < obj.bindings.length; i++) {
          client._setReqInput(req, i, obj.bindings[i])
        }
      }
      req.query(sql, function(err, recordset) {
        if (err) return rejecter(err)
        obj.response = recordset[0]
        resolver(obj)
      })
    })
  },

  // sets a request input parameter. Detects bigints and sets type appropriately.
  _setReqInput(req, i, binding) {
    if (typeof binding == 'number' && (binding < SQL_INT4.MIN || binding > SQL_INT4.MAX)) {
      if (binding < SQL_BIGINT_SAFE.MIN || binding > SQL_BIGINT_SAFE.MAX) {
        throw new Error(`Bigint must be safe integer or must be passed as string, saw ${binding}`)
      }
      req.input(`p${i}`, this.driver.BigInt, binding)
    } else {
      req.input(`p${i}`, binding)
    }
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    let { response } = obj
    const { method } = obj
    if (obj.output) return obj.output.call(runner, response)
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response)
        if (method === 'pluck') return map(response, obj.pluck)
        return method === 'first' ? response[0] : response
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning) {
          if (obj.returning === '@@rowcount') {
            return response[0]['']
          }

          if (
            (isArray(obj.returning) && obj.returning.length > 1) ||
            obj.returning[0] === '*'
          ) {
            return response;
          }
          // return an array with values if only one returning value was specified
          return flatten(map(response, values));
        }
        return response;
      default:
        return response
    }
  },

  ping(resource, callback) {
    resource.request().query('SELECT 1', callback);
  }

})

// MSSQL Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

export default Client_MSSQL

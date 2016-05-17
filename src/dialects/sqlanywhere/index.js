
// Sqlanywhere Client
// -------
import {assign, map, flatten, values} from 'lodash'

var inherits  = require('inherits')
var Formatter = require('./formatter')
var Client    = require('../../client')
var Promise   = require('../../promise')
var helpers   = require('../../helpers')

var Transaction       = require('./transaction')
var QueryCompiler     = require('./query/compiler')
var SchemaCompiler    = require('./schema/compiler')
var ColumnBuilder     = require('./schema/columnbuilder')
var ColumnCompiler    = require('./schema/columncompiler')
var TableCompiler     = require('./schema/tablecompiler')
var ReturningHelper   = require('./utils').ReturningHelper
var prepareValue      = require('./utils').prepareValue

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Sqlanywhere(config) {
  Client.call(this, config)
}
inherits(Client_Sqlanywhere, Client)

assign(Client_Sqlanywhere.prototype, {

  dialect: 'sqlanywhere',

  driverName: 'sqlanywhere',

  _driver: function() {
    return require('sqlanywhere')
  },

  Transaction: Transaction,

  Formatter: Formatter,

  QueryCompiler: QueryCompiler,

  SchemaCompiler: SchemaCompiler,

  ColumnBuilder: ColumnBuilder,

  ColumnCompiler: ColumnCompiler,

  TableCompiler: TableCompiler,

  prepBindings: function(bindings) {
    return map(bindings, (value) => {
      // returning helper uses always ROWID as string
      if (value instanceof ReturningHelper && this.driver) {
        return new this.driver.OutParam(this.driver.OCCISTRING)
      }
      return prepareValue( value )
    })
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var client = this
    return new Promise(function(resolver, rejecter) {
      var connection = client.driver.createConnection();
      connection.connect(client.connectionSettings,
        function(err) {
          if (err) return rejecter(err)
          Promise.promisifyAll(connection)
          connection.execAsync( "set temporary option auto_commit = 'on'" )
            .then( function() {
              resolver(connection)
            }, rejecter );
        })
    })
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function(connection, cb) {
    connection.disconnect( cb )
  },

  // Return the database for the Sqlanywhere client.
  database: function() {
    return this.connectionSettings.dbn || this.connectionSettings.DatabaseName
  },

  _stream: function(connection, sql, stream/*, options*/) {
    var client = this;
    return new Promise(function(resolver, rejecter) {
      stream.on('error', rejecter)
      stream.on('end', resolver)
      return client._query(connection, sql).then(function(obj) {
        return obj.response
      }).map(function(row) {
        stream.write(row)
      }).catch(function(err) {
        stream.emit('error', err)
        rejecter();
      }).then(function() {
        stream.end()
        resolver();
      })
    })
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    var ret = obj.bindings ? connection.execAsync(obj.sql, obj.bindings) : connection.execAsync(obj.sql);

    return ret.then(function(response) {
      obj.response = response;
      return obj
    })

  },

  // Process the response as returned from the query.
  processResponse: function(obj, runner) {
    var response = obj.response;
    var method   = obj.method;
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
        return response;
      default:
        return response;
    }
  },

  ping: function(resource, callback) {
    resource.exec('SELECT 1', [], callback);
  }

})

module.exports = Client_Sqlanywhere

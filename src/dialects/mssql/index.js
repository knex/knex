
// MSSQL Client
// -------
var _              = require('lodash')
var inherits       = require('inherits')
var assign         = require('lodash/object/assign')

var Client         = require('../../client')
var Promise        = require('../../promise')
var helpers        = require('../../helpers')

var Transaction    = require('./transaction')
var QueryCompiler  = require('./query/compiler')
var JoinClause     = require('./query/joinclause')
var SchemaCompiler = require('./schema/compiler')
var TableCompiler  = require('./schema/tablecompiler')
var ColumnCompiler = require('./schema/columncompiler')
var pluck          = require('lodash/collection/pluck')

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MSSQL(config) {
  Client.call(this, config);
}
inherits(Client_MSSQL, Client);

assign(Client_MSSQL.prototype, {

  dialect: 'mssql',

  driverName: 'mssql',

  _driver: function() {
    return require('mssql');
  },
  
  QueryCompiler: QueryCompiler,
  
  JoinClause: JoinClause,
  
  SchemaCompiler: SchemaCompiler,

  TableCompiler: TableCompiler,

  ColumnCompiler: ColumnCompiler,

  //Transaction: Transaction,
  
  wrapIdentifier: function(value) {
    return (value !== '*' ? '[' + value.replace(/\[/g, '\[') + ']' : '*')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function() {
    var client = this;
    var connection = new this.driver.Connection(this.connectionSettings);
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
  destroyRawConnection: function(connection, cb) {
    connection.close(cb);
  },
  
  // Position the bindings for the query.
  positionBindings: function(sql) {
    var questionCount = 0
    return sql.replace(/\?/g, function() {
      questionCount += 1
      return '@p' + questionCount
    })
  },
  
  prepBindings: function(bindings) {
    return _.map(bindings, function(value) {
      if (value === undefined) {
        return this.valueForUndefined
      }
      return value
    }, this)
  },
  
  // Grab a connection, run the query via the MSSQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream: function(connection, obj, stream, options) {
    options = options || {}
    return new Promise(function(resolver, rejecter) {
      stream.on('error', rejecter)
      stream.on('end', resolver)
      connection.query(obj.sql, obj.bindings).stream(options).pipe(stream)
    })
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function(connection, obj) {
    if (!obj || typeof obj === 'string') obj = {sql: obj}
    // convert ? params into positional bindings (@p1)
    obj.sql = this.positionBindings(obj.sql);
    obj.bindings = this.prepBindings(obj.bindings) || [];
    return new Promise(function(resolver, rejecter) {
      var sql = obj.sql
      if (!sql) return resolver()
      if (obj.options) sql = assign({sql: sql}, obj.options)
      var req = connection.request();
      //request.multiple = true;
      if (obj.bindings) {
        for (var i = 1; i <= obj.bindings.length; i++) {
          req.input('p' + i, obj.bindings[i])
          //console.log('p' + i, obj.bindings[i]);
        }
      }
      req.query(sql, function(err, recordset) {
        if (err) return rejecter(err)
        obj.response = recordset
        resolver(obj)
      })        
    })
  },

  // Process the response as returned from the query.
  processResponse: function(obj, runner) {
    if (obj == null) return;
    var response = obj.response
    var method   = obj.method
    var recordset = response
    if (obj.output) return obj.output.call(runner, recordset)
    console.log('method: ' + method);
    console.log(recordset);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        var resp = helpers.skim(recordset)
        if (method === 'pluck') return pluck(resp, obj.pluck)
        return method === 'first' ? resp[0] : resp
      case 'insert':
        return [recordset.insertId]
      case 'del':
      case 'update':
      case 'counter':
        return recordset.affectedRows
      default:
        return response
    }
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

module.exports = Client_MSSQL
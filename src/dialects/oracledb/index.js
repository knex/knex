
// Oracledb Client
// -------
'use strict';

var _ = require('lodash');
var inherits = require('inherits');
var assign = require('lodash/object/assign');

var Formatter = require('./formatter');
var Client = require('../../client');
var Promise = require('../../promise');
var helpers = require('../../helpers');
// var SqlString = require('../../query/string');

var Transaction = require('./transaction');
var QueryCompiler = require('./query/compiler');
var SchemaCompiler = require('./schema/compiler');
var ColumnBuilder = require('./schema/columnbuilder');
var ColumnCompiler = require('./schema/columncompiler');
var TableCompiler = require('./schema/tablecompiler');
var OracleQueryStream = require('./stream');
var ReturningHelper = require('./utils').ReturningHelper;

//handle clob
var stream = require('stream');
var async = require('async');
function readStream(stream, type, cb) {
  var data = '';
  if (type === String) {
    stream.setEncoding('utf-8');
  } else {
    data = new Buffer();
  }
  stream.on('error', function(err) {
    cb(err);
  });
  stream.on('data', function(chunk) {
    if (type === String) {
      data += chunk;
    } else {
      data = Buffer.concat(data, chunk);
    }
  });
  stream.on('end', function() {
    cb(null, data);
  });
}

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Oracle(config) {
  Client.call(this, config);
}
inherits(Client_Oracle, Client);

assign(Client_Oracle.prototype, {

  dialect: 'oracledb',

  driverName: 'oracledb',

  _driver: function _driver() {
    var oracledb = require('oracledb');  
    oracledb.autoCommit = true;
    oracledb.fetchAsString = [ oracledb.CLOB ];  
    return oracledb;
  },

  Transaction: Transaction,

  Formatter: Formatter,

  QueryCompiler: QueryCompiler,

  SchemaCompiler: SchemaCompiler,

  ColumnBuilder: ColumnBuilder,

  ColumnCompiler: ColumnCompiler,

  TableCompiler: TableCompiler,

  prepBindings: function prepBindings(bindings) {
    return _.map(bindings, function (value) {
      // returning helper uses always ROWID as string
      if (value instanceof ReturningHelper && this.driver) {
        return new this.driver.OutParam(this.driver.STRING);
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (Buffer.isBuffer(value)) { 
        var Stream = new stream.PassThrough();
        Stream.end(value);
        return Stream;
        //return SqlString.bufferToString(value);
      }
      else if (value === undefined) {
        return this.valueForUndefined;
      }
      return value;
    }, this);
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection: function acquireRawConnection() {
    var client = this;
    return new Promise(function (resolver, rejecter) {
      client.driver.getConnection({
        user: client.connectionSettings.user,
        password: client.connectionSettings.password,
        connectString: client.connectionSettings.host + '/' + client.connectionSettings.database
      }, function (err, connection) {
        if (err) return rejecter(err);
        if (client.connectionSettings.prefetchRowCount) {
          connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount);
        }
        connection.executeAsync = function (sql, bindParams) {
          var self = this;
          return new Promise(function (resolve, reject) {
            var options = {};
            options.outFormat = client.driver.OBJECT;
            self.execute(sql, bindParams || [], options, function (err, results) {
              if (err) {
                return reject(err);
              }
              //handle clob as string for the moment
            if (!err && results) {
              var lobs = [];
              if (results.rows) {
                var data = results.rows;
                if (Array.isArray(data)) {
                  for (var i = 0, n = data.length; i < n; i++) {
                    // Iterate through the rows
                    var row = data[i];
                    for (var k in row) {
                      var val = row[k];
                      if (val instanceof stream.Readable) {
                        lobs.push({index: i, key: k, stream: val});
                      }
                    }
                  }
                }
              }
              if (lobs.length === 0) {
                return resolve(results);
              }
              async.each(lobs, function(lob, done) {
                readStream(lob.stream, String, function(err, d) {
                  if (err) return done(err);
                  results.rows[lob.index][lob.key] = d;
                  done();
                });
              }, function(err) {
                if (err) return reject(err);
                return resolve(results);
              });
            } else {
              return resolve(results);
            }

            });
          });
        };
        resolver(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    connection.release(cb);
  },

  // Return the database for the Oracle client.
  database: function database() {
    return this.connectionSettings.database;
  },

  // Position the bindings for the query.
  positionBindings: function positionBindings(sql) {
    var questionCount = 0;
    return sql.replace(/\?/g, function () {
      questionCount += 1;
      return ':' + questionCount;
    });
  },

  _stream: function _stream(connection, obj, stream, options) {
    obj.sql = this.positionBindings(obj.sql);
    return new Promise(function (resolver, rejecter) {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      var queryStream = new OracleQueryStream(connection, obj.sql, obj.bindings, options);
      queryStream.pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query: function _query(connection, obj) {

    // convert ? params into positional bindings (:1)
    obj.sql = this.positionBindings(obj.sql);

    obj.bindings = this.prepBindings(obj.bindings) || [];

    if (!obj.sql) throw new Error('The query is empty');

    return connection.executeAsync(obj.sql, obj.bindings).then(function (response) {
      if (!obj.returning) return response;
      var rowIds = obj.outParams.map(function (v, i) {
        return response.outBinds[0][i];
      });
      return connection.executeAsync(obj.returningSql, rowIds);
    }).then(function (response) {
      obj.response = response;
      return obj;
    });
  },

  // Process the response as returned from the query.
  processResponse: function processResponse(obj, runner) {
    var response = obj.response.rows;
    var method = obj.method;
    if (obj.output) return obj.output.call(runner, response);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        response = helpers.skim(response);
        if (obj.method === 'pluck') response = _.pluck(response, obj.pluck);
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
          return _.flatten(_.map(response, _.values));
        }
        return obj.response.rowsAffected;
      default:
        return response;
    }
  }

});

module.exports = Client_Oracle;

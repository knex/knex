
// Oracledb Client
// -------
var _               = require('lodash');
var inherits        = require('inherits');
var Client_Oracle   = require('../oracle');
var QueryCompiler   = require('./query/compiler');
var ColumnCompiler  = require('./schema/columncompiler');
var Formatter       = require('./formatter');
var BlobHelper      = require('./utils').BlobHelper;
var ReturningHelper = require('./utils').ReturningHelper;
var Promise         = require('../../promise');
var stream          = require('stream');
var helpers         = require('../../helpers');

function Client_Oracledb() {
  Client_Oracle.apply(this, arguments);
}
inherits(Client_Oracledb, Client_Oracle);

Client_Oracledb.prototype.driverName = 'oracledb';

Client_Oracledb.prototype._driver = function() {
  var oracledb = require('oracledb');
  oracledb.fetchAsString = [oracledb.CLOB];
  return oracledb;
};

Client_Oracledb.prototype.QueryCompiler = QueryCompiler;
Client_Oracledb.prototype.ColumnCompiler = ColumnCompiler;
Client_Oracledb.prototype.Formatter = Formatter;

Client_Oracledb.prototype.prepBindings = function(bindings) {
  return _.map(bindings, function (value) {
    if (value instanceof BlobHelper && this.driver) {
      return { type: this.driver.BLOB, dir: this.driver.BIND_OUT };
    // returning helper uses always ROWID as string
    } else if (value instanceof ReturningHelper && this.driver) {
      return { type: this.driver.STRING, dir: this.driver.BIND_OUT };
    } else if (typeof value === 'boolean') {
      return value ? 1 : 0;
    } else if (value === undefined) {
      return this.valueForUndefined;
    }
    return value;
  }, this);
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_Oracledb.prototype.acquireRawConnection = function() {
  var client = this;
  return new Promise(function(resolver, rejecter) {
    client.driver.getConnection({
      user: client.connectionSettings.user,
      password: client.connectionSettings.password,
      connectString: client.connectionSettings.host + '/' + client.connectionSettings.database
    }, function(err, connection) {
      if (err)
        return rejecter(err);
      if (client.connectionSettings.prefetchRowCount) {
        connection.setPrefetchRowCount(client.connectionSettings.prefetchRowCount);
      }
      connection.executeAsync = function(sql, bindParams) {
        var self = this;
        return new Promise(function(resolve, reject) {
          var options = {};
          options.outFormat = client.driver.OBJECT;
          self.execute(sql, bindParams || [], options, function(err, results) {
            if (err) {
              return reject(err);
            }
            //handle clob as string for the moment
            if (results) {
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
              Promise.each(lobs, function(lob) {
                return new Promise(function(resolve, reject) {
                  readStream(lob.stream, String, function(err, d) {
                    if (err) {
                      return reject(err);
                    }
                    results.rows[lob.index][lob.key] = d;
                    resolve(d);
                  });
                });
              }).then(function() {
                resolve(results);
              }, reject);
            } else {
              return resolve(results);
            }

          });
        });
      };
      resolver(connection);
    });
  });
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_Oracledb.prototype.destroyRawConnection = function(connection, cb) {
  connection.release(cb);
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Client_Oracledb.prototype._query = function(connection, obj) {
  // convert ? params into positional bindings (:1)
  obj.sql = this.positionBindings(obj.sql);
  var bindings = obj.bindings;
  obj.bindings = this.prepBindings(bindings) || [];
  if (!obj.sql) throw new Error('The query is empty');
  return new Promise(function(resolver, rejecter) {
    connection.executeAsync(obj.sql, obj.bindings).then(function(response) {
      // flatten outBinds
      var outBinds = _.flatten(response.outBinds);
      obj.response = response.rows || [];
      obj.rowsAffected = response.rows ? response.rows.rowsAffected : response.rowsAffected;

      if(!obj.returning) {
        return resolver(obj);
      }
      var rowIds = [];

      Promise.each(obj.returning, function(ret, line) {
        var offset = line * obj.returning[0].length;
        obj.response[line] = {};
        return Promise.each(ret, function(out, index) {
          return new Promise(function(bindResolver, bindRejecter) {
            if (out instanceof BlobHelper) {
              var blob = outBinds[index + offset];
              if(out.returning) {
                obj.response[line][out.columnName] = out.value;
              }
              blob.on('error', function(err) {
                bindRejecter(err);
              });
              blob.on('finish', function() {
                bindResolver();
              });
              blob.write(out.value);
              blob.end();
            } else if (obj.returning[line][index] === 'ROWID') {
              rowIds.push(outBinds[index + offset]);
              bindResolver();
            } else {
              obj.response[line][out] = outBinds[index + offset];
              bindResolver();
            }
          });
        });
      }).then(function() { // Promise.all(binds)
        connection.commit(function() {
          if (!rowIds.length) {
            return resolver(obj);
          }
          connection.executeAsync(obj.returningSql, rowIds).then(function(response) {
            obj.response = response.rows;
            resolver(obj);
          }, rejecter);
        });
      }, rejecter);
    });
  });
};

//handle clob
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

// Process the response as returned from the query.
Client_Oracledb.prototype.processResponse = function(obj, runner) {
  var response = obj.response;
  var method = obj.method;
  if (obj.output)
    return obj.output.call(runner, response);
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      response = helpers.skim(response);
      if (obj.method === 'pluck')
        response = _.pluck(response, obj.pluck);
      return obj.method === 'first' ? response[0] : response;
    case 'insert':
    case 'del':
    case 'update':
    case 'counter':
      // check if there really is a response
      var responseFlag = false;
      _.each(response, function(val) {
        if(!responseFlag && !_.isEmpty(val)) {
          responseFlag = true;
        }
      });
      if (obj.returning && responseFlag) {
        return response;
      } else if (obj.rowsAffected) {
        return obj.rowsAffected;
      } else {
        return 1;
      }
      break;
    default:
      return response;
  }
};

module.exports = Client_Oracledb;
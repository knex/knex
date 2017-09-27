
// Oracledb Client
// -------
const _ = require('lodash');
const inherits = require('inherits');
const QueryCompiler = require('./query/compiler');
const ColumnCompiler = require('./schema/columncompiler');
const BlobHelper = require('./utils').BlobHelper;
const ReturningHelper = require('./utils').ReturningHelper;
const Promise = require('bluebird');
const stream = require('stream');
const helpers = require('../../helpers');
const Transaction = require('./transaction');
const Client_Oracle = require('../oracle');
const Oracle_Formatter = require('../oracle/formatter');
const Buffer = require('safe-buffer').Buffer;

function Client_Oracledb() {
  Client_Oracle.apply(this, arguments);
  // Node.js only have 4 background threads by default, oracledb needs one by connection
  if (this.driver) {
    process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 1;
    process.env.UV_THREADPOOL_SIZE += this.driver.poolMax;
  }
}
inherits(Client_Oracledb, Client_Oracle);

Client_Oracledb.prototype.driverName = 'oracledb';

Client_Oracledb.prototype._driver = function() {
  const client = this;
  const oracledb = require('oracledb');
  client.fetchAsString = [];
  if (this.config.fetchAsString && _.isArray(this.config.fetchAsString)) {
    this.config.fetchAsString.forEach(function(type) {
      if (!_.isString(type)) return;
      type = type.toUpperCase();
      if (oracledb[type]) {
        if (type !== 'NUMBER' && type !== 'DATE' && type !== 'CLOB') {
          helpers.warn('Only "date", "number" and "clob" are supported for fetchAsString');
        }
        client.fetchAsString.push(oracledb[type]);
      }
    });
  }
  return oracledb;
};

Client_Oracledb.prototype.queryCompiler = function() {
  return new QueryCompiler(this, ...arguments)
}
Client_Oracledb.prototype.columnCompiler = function() {
  return new ColumnCompiler(this, ...arguments)
}
Client_Oracledb.prototype.formatter = function() {
  return new Oracledb_Formatter(this)
}
Client_Oracledb.prototype.transaction = function() {
  return new Transaction(this, ...arguments)
}

Client_Oracledb.prototype.prepBindings = function(bindings) {
  return _.map(bindings, (value) => {
    if (value instanceof BlobHelper && this.driver) {
      return {type: this.driver.BLOB, dir: this.driver.BIND_OUT};
      // Returning helper always use ROWID as string
    } else if (value instanceof ReturningHelper && this.driver) {
      return {type: this.driver.STRING, dir: this.driver.BIND_OUT};
    } else if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  });
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_Oracledb.prototype.acquireRawConnection = function() {
  const client = this;
  const asyncConnection = new Promise(function(resolver, rejecter) {

    // If external authentication dont have to worry about username/password and
    // if not need to set the username and password
    const oracleDbConfig = client.connectionSettings.externalAuth ?
      { externalAuth : client.connectionSettings.externalAuth } :
      {
        user : client.connectionSettings.user,
        password : client.connectionSettings.password
      }

    // In the case of external authentication connection string will be given
    oracleDbConfig.connectString =  client.connectionSettings.connectString ||
        (client.connectionSettings.host + '/' + client.connectionSettings.database);

    if (client.connectionSettings.prefetchRowCount) {
      oracleDbConfig.prefetchRows = client.connectionSettings.prefetchRowCount
    }

    if (!_.isUndefined(client.connectionSettings.stmtCacheSize)) {
      oracleDbConfig.stmtCacheSize = client.connectionSettings.stmtCacheSize;
    }

    client.driver.fetchAsString = client.fetchAsString;

    client.driver.getConnection(oracleDbConfig, function(err, connection) {
      if (err) {
        return rejecter(err);
      }
      connection.commitAsync = function() {
        return new Promise((commitResolve, commitReject) => {
          if (connection.isTransaction) {
            return commitResolve();
          }
          this.commit(function(err) {
            if (err) {
              return commitReject(err);
            }
            commitResolve();
          });
        });
      };
      connection.rollbackAsync = function() {
        return new Promise((rollbackResolve, rollbackReject) => {
          this.rollback(function(err) {
            if (err) {
              return rollbackReject(err);
            }
            rollbackResolve();
          });
        });
      };
      const fetchAsync = function(sql, bindParams, options, cb) {
        options = options || {};
        options.outFormat = client.driver.OBJECT;
        if (options.resultSet) {
          connection.execute(sql, bindParams || [], options, function(err, result) {
            if (err) {
              return cb(err);
            }
            const fetchResult = {rows: [], resultSet: result.resultSet};
            const numRows = 100;
            const fetchRowsFromRS = function(connection, resultSet, numRows) {
              resultSet.getRows(numRows, function(err, rows) {
                if (err) {
                  resultSet.close(function() {
                    return cb(err);
                  });
                } else if (rows.length === 0) {
                  return cb(null, fetchResult);
                } else if (rows.length > 0) {
                  if (rows.length === numRows) {
                    fetchResult.rows = fetchResult.rows.concat(rows);
                    fetchRowsFromRS(connection, resultSet, numRows);
                  } else {
                    fetchResult.rows = fetchResult.rows.concat(rows);
                    return cb(null, fetchResult);
                  }
                }
              });
            };
            fetchRowsFromRS(connection, result.resultSet, numRows);
          });
        } else {
          connection.execute(sql, bindParams || [], options, cb);
        }
      };
      connection.executeAsync = function(sql, bindParams, options) {
        // Read all lob
        return new Promise(function(resultResolve, resultReject) {
          fetchAsync(sql, bindParams, options, function(err, results) {
            if (err) {
              return resultReject(err);
            }
            // Collect LOBs to read
            const lobs = [];
            if (results.rows) {
              if (Array.isArray(results.rows)) {
                for (let i = 0; i < results.rows.length; i++) {
                  // Iterate through the rows
                  const row = results.rows[i];
                  for (const column in row) {
                    if (row[column] instanceof stream.Readable) {
                      lobs.push({index: i, key: column, stream: row[column]});
                    }
                  }
                }
              }
            }
            Promise.each(lobs, function(lob) {
              return new Promise(function(lobResolve, lobReject) {

                readStream(lob.stream, function(err, d) {
                  if (err) {
                    if (results.resultSet) {
                      results.resultSet.close(function() {
                        return lobReject(err);
                      });
                    }
                    return lobReject(err);
                  }
                  results.rows[lob.index][lob.key] = d;
                  lobResolve();
                });
              });
            }).then(function() {
              if (results.resultSet) {
                results.resultSet.close(function(err) {
                  if (err) {
                    return resultReject(err);
                  }
                  return resultResolve(results);
                });
              }
              resultResolve(results);
            }, function(err) {
              resultReject(err);
            });
          });
        });
      };
      resolver(connection);
    });
  });
  return asyncConnection;
};

// Used to explicitly close a connection, called internally by the pool
// when a connection times out or the pool is shutdown.
Client_Oracledb.prototype.destroyRawConnection = function(connection) {
  return connection.release()
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Client_Oracledb.prototype._query = function(connection, obj) {
  return new Promise(function(resolver, rejecter) {
    if (!obj.sql) {
      return rejecter(new Error('The query is empty'));
    }
    const options = {autoCommit: false};
    if (obj.method === 'select') {
      options.resultSet = true;
    }
    connection.executeAsync(obj.sql, obj.bindings, options).then(function(response) {
      // Flatten outBinds
      let outBinds = _.flatten(response.outBinds);
      obj.response = response.rows || [];
      obj.rowsAffected = response.rows ? response.rows.rowsAffected : response.rowsAffected;

      if (obj.method === 'update') {
        const modifiedRowsCount = obj.rowsAffected.length || obj.rowsAffected;
        const updatedObjOutBinding = [];
        const updatedOutBinds = [];
        const updateOutBinds = (i) => function(value, index) {
          const OutBindsOffset = index * modifiedRowsCount;
          updatedOutBinds.push(outBinds[i + OutBindsOffset]);
        };

        for (let i = 0; i < modifiedRowsCount; i++) {
          updatedObjOutBinding.push(obj.outBinding[0]);
          _.each(obj.outBinding[0], updateOutBinds(i));
        }
        outBinds = updatedOutBinds;
        obj.outBinding = updatedObjOutBinding;
      }

      if (!obj.returning && outBinds.length === 0) {
        return connection.commitAsync().then(function() {
          resolver(obj);
        });
      }
      const rowIds = [];
      let offset = 0;
      Promise.each(obj.outBinding, function(ret, line) {
        offset = offset + (obj.outBinding[line - 1] ? obj.outBinding[line - 1].length : 0);
        return Promise.each(ret, function(out, index) {
          return new Promise(function(bindResolver, bindRejecter) {
            if (out instanceof BlobHelper) {
              const blob = outBinds[index + offset];
              if (out.returning) {
                obj.response[line] = obj.response[line] || {};
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
            } else if (obj.outBinding[line][index] === 'ROWID') {
              rowIds.push(outBinds[index + offset]);
              bindResolver();
            } else {
              obj.response[line] = obj.response[line] || {};
              obj.response[line][out] = outBinds[index + offset];
              bindResolver();
            }
          });
        });
      }).then(function() {
        return connection.commitAsync();
      }).then(function() {
        if (obj.returningSql) {
          return connection.executeAsync(obj.returningSql(), rowIds, {resultSet: true})
            .then(function(response) {
              obj.response = response.rows;
              return obj;
            }, rejecter);
        }
        return obj;
      }, rejecter)
        .then(function(obj) {
          resolver(obj);
        });
    }, rejecter);
  });
};

// Handle clob
function readStream(stream, cb) {
  const oracledb = require('oracledb');
  let data = '';

  if (stream.iLob.type === oracledb.CLOB) {
    stream.setEncoding('utf-8');
  } else {
    data = Buffer.alloc(0);
  }
  stream.on('error', function(err) {
    cb(err);
  });
  stream.on('data', function(chunk) {
    if (stream.iLob.type === oracledb.CLOB) {
      data += chunk;
    } else {
      data = Buffer.concat([data, chunk]);
    }
  });
  stream.on('end', function() {
    cb(null, data);
  });
}

// Process the response as returned from the query.
Client_Oracledb.prototype.processResponse = function(obj, runner) {
  let response = obj.response;
  const method = obj.method;
  if (obj.output) {
    return obj.output.call(runner, response);
  }
  switch (method) {
    case 'select':
    case 'pluck':
    case 'first':
      response = helpers.skim(response);
      if (obj.method === 'pluck') {
        response = _.map(response, obj.pluck);
      }
      return obj.method === 'first' ? response[0] : response;
    case 'insert':
    case 'del':
    case 'update':
    case 'counter':
      if (obj.returning && !_.isEmpty(obj.returning)) {
        if (obj.returning.length === 1 && obj.returning[0] !== '*') {
          return _.flatten(_.map(response, _.values));
        }
        return response;
      } else if (!_.isUndefined(obj.rowsAffected)) {
        return obj.rowsAffected;
      } else {
        return 1;
      }
    default:
      return response;
  }
};

class Oracledb_Formatter extends Oracle_Formatter {

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    } else if (value instanceof BlobHelper) {
      return 'EMPTY_BLOB()';
    }
    return this.unwrapRaw(value, true) || '?';
  }

}

module.exports = Client_Oracledb;

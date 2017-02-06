'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Oracledb Client
// -------
var _ = require('lodash');
var inherits = require('inherits');
var QueryCompiler = require('./query/compiler');
var ColumnCompiler = require('./schema/columncompiler');
var BlobHelper = require('./utils').BlobHelper;
var ReturningHelper = require('./utils').ReturningHelper;
var Promise = require('bluebird');
var stream = require('stream');
var helpers = require('../../helpers');
var Transaction = require('./transaction');
var Client_Oracle = require('../oracle');
var Oracle_Formatter = require('../oracle/formatter');
var Buffer = require('safe-buffer').Buffer;

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

Client_Oracledb.prototype._driver = function () {
  var oracledb = require('oracledb');
  return oracledb;
};

Client_Oracledb.prototype.queryCompiler = function () {
  return new (Function.prototype.bind.apply(QueryCompiler, [null].concat([this], Array.prototype.slice.call(arguments))))();
};
Client_Oracledb.prototype.columnCompiler = function () {
  return new (Function.prototype.bind.apply(ColumnCompiler, [null].concat([this], Array.prototype.slice.call(arguments))))();
};
Client_Oracledb.prototype.formatter = function () {
  return new Oracledb_Formatter(this);
};
Client_Oracledb.prototype.transaction = function () {
  return new (Function.prototype.bind.apply(Transaction, [null].concat([this], Array.prototype.slice.call(arguments))))();
};

Client_Oracledb.prototype.prepBindings = function (bindings) {
  var _this = this;

  return _.map(bindings, function (value) {
    if (value instanceof BlobHelper && _this.driver) {
      return { type: _this.driver.BLOB, dir: _this.driver.BIND_OUT };
      // Returning helper always use ROWID as string
    } else if (value instanceof ReturningHelper && _this.driver) {
      return { type: _this.driver.STRING, dir: _this.driver.BIND_OUT };
    } else if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  });
};

// Get a raw connection, called by the `pool` whenever a new
// connection needs to be added to the pool.
Client_Oracledb.prototype.acquireRawConnection = function () {
  var client = this;
  var asyncConnection = new Promise(function (resolver, rejecter) {

    // If external authentication dont have to worry about username/password and
    // if not need to set the username and password
    var oracleDbConfig = client.connectionSettings.externalAuth ? { externalAuth: client.connectionSettings.externalAuth } : {
      user: client.connectionSettings.user,
      password: client.connectionSettings.password
    };

    // In the case of external authentication connection string will be given
    oracleDbConfig.connectString = client.connectionSettings.connectString || client.connectionSettings.host + '/' + client.connectionSettings.database;

    if (client.connectionSettings.prefetchRowCount) {
      oracleDbConfig.prefetchRows = client.connectionSettings.prefetchRowCount;
    }

    if (!_.isUndefined(client.connectionSettings.stmtCacheSize)) {
      oracleDbConfig.stmtCacheSize = client.connectionSettings.stmtCacheSize;
    }

    client.driver.getConnection(oracleDbConfig, function (err, connection) {
      if (err) {
        return rejecter(err);
      }
      connection.commitAsync = function () {
        var _this2 = this;

        return new Promise(function (commitResolve, commitReject) {
          if (connection.isTransaction) {
            return commitResolve();
          }
          _this2.commit(function (err) {
            if (err) {
              return commitReject(err);
            }
            commitResolve();
          });
        });
      };
      connection.rollbackAsync = function () {
        var _this3 = this;

        return new Promise(function (rollbackResolve, rollbackReject) {
          _this3.rollback(function (err) {
            if (err) {
              return rollbackReject(err);
            }
            rollbackResolve();
          });
        });
      };
      var fetchAsync = function fetchAsync(sql, bindParams, options, cb) {
        options = options || {};
        options.outFormat = client.driver.OBJECT;
        if (options.resultSet) {
          connection.execute(sql, bindParams || [], options, function (err, result) {
            if (err) {
              return cb(err);
            }
            var fetchResult = { rows: [], resultSet: result.resultSet };
            var numRows = 100;
            var fetchRowsFromRS = function fetchRowsFromRS(connection, resultSet, numRows) {
              resultSet.getRows(numRows, function (err, rows) {
                if (err) {
                  resultSet.close(function () {
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
      connection.executeAsync = function (sql, bindParams, options) {
        // Read all lob
        return new Promise(function (resultResolve, resultReject) {
          fetchAsync(sql, bindParams, options, function (err, results) {
            if (err) {
              return resultReject(err);
            }
            // Collect LOBs to read
            var lobs = [];
            if (results.rows) {
              if (Array.isArray(results.rows)) {
                for (var i = 0; i < results.rows.length; i++) {
                  // Iterate through the rows
                  var row = results.rows[i];
                  for (var column in row) {
                    if (row[column] instanceof stream.Readable) {
                      lobs.push({ index: i, key: column, stream: row[column] });
                    }
                  }
                }
              }
            }
            Promise.each(lobs, function (lob) {
              return new Promise(function (lobResolve, lobReject) {

                readStream(lob.stream, function (err, d) {
                  if (err) {
                    if (results.resultSet) {
                      results.resultSet.close(function () {
                        return lobReject(err);
                      });
                    }
                    return lobReject(err);
                  }
                  results.rows[lob.index][lob.key] = d;
                  lobResolve();
                });
              });
            }).then(function () {
              if (results.resultSet) {
                results.resultSet.close(function (err) {
                  if (err) {
                    return resultReject(err);
                  }
                  return resultResolve(results);
                });
              }
              resultResolve(results);
            }, function (err) {
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
Client_Oracledb.prototype.destroyRawConnection = function (connection) {
  connection.release();
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Client_Oracledb.prototype._query = function (connection, obj) {
  // Convert ? params into positional bindings (:1)
  obj.sql = this.positionBindings(obj.sql);
  obj.bindings = this.prepBindings(obj.bindings) || [];

  return new Promise(function (resolver, rejecter) {
    if (!obj.sql) {
      return rejecter(new Error('The query is empty'));
    }
    var options = { autoCommit: false };
    if (obj.method === 'select') {
      options.resultSet = true;
    }
    connection.executeAsync(obj.sql, obj.bindings, options).then(function (response) {
      // Flatten outBinds
      var outBinds = _.flatten(response.outBinds);
      obj.response = response.rows || [];
      obj.rowsAffected = response.rows ? response.rows.rowsAffected : response.rowsAffected;

      if (obj.method === 'update') {
        (function () {
          var modifiedRowsCount = obj.rowsAffected.length || obj.rowsAffected;
          var updatedObjOutBinding = [];
          var updatedOutBinds = [];
          var updateOutBinds = function updateOutBinds(i) {
            return function (value, index) {
              var OutBindsOffset = index * modifiedRowsCount;
              updatedOutBinds.push(outBinds[i + OutBindsOffset]);
            };
          };

          for (var i = 0; i < modifiedRowsCount; i++) {
            updatedObjOutBinding.push(obj.outBinding[0]);
            _.each(obj.outBinding[0], updateOutBinds(i));
          }
          outBinds = updatedOutBinds;
          obj.outBinding = updatedObjOutBinding;
        })();
      }

      if (!obj.returning && outBinds.length === 0) {
        return connection.commitAsync().then(function () {
          resolver(obj);
        });
      }
      var rowIds = [];
      var offset = 0;
      Promise.each(obj.outBinding, function (ret, line) {
        offset = offset + (obj.outBinding[line - 1] ? obj.outBinding[line - 1].length : 0);
        return Promise.each(ret, function (out, index) {
          return new Promise(function (bindResolver, bindRejecter) {
            if (out instanceof BlobHelper) {
              var blob = outBinds[index + offset];
              if (out.returning) {
                obj.response[line] = obj.response[line] || {};
                obj.response[line][out.columnName] = out.value;
              }
              blob.on('error', function (err) {
                bindRejecter(err);
              });
              blob.on('finish', function () {
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
      }).then(function () {
        return connection.commitAsync();
      }).then(function () {
        if (obj.returningSql) {
          return connection.executeAsync(obj.returningSql(), rowIds, { resultSet: true }).then(function (response) {
            obj.response = response.rows;
            return obj;
          }, rejecter);
        }
        return obj;
      }, rejecter).then(function (obj) {
        resolver(obj);
      });
    }, rejecter);
  });
};

// Handle clob
function readStream(stream, cb) {
  var oracledb = require('oracledb');
  var data = '';

  if (stream.iLob.type === oracledb.CLOB) {
    stream.setEncoding('utf-8');
  } else {
    data = Buffer.alloc(0);
  }
  stream.on('error', function (err) {
    cb(err);
  });
  stream.on('data', function (chunk) {
    if (stream.iLob.type === oracledb.CLOB) {
      data += chunk;
    } else {
      data = Buffer.concat([data, chunk]);
    }
  });
  stream.on('end', function () {
    cb(null, data);
  });
}

// Process the response as returned from the query.
Client_Oracledb.prototype.processResponse = function (obj, runner) {
  var response = obj.response;
  var method = obj.method;
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

var Oracledb_Formatter = function (_Oracle_Formatter) {
  (0, _inherits3.default)(Oracledb_Formatter, _Oracle_Formatter);

  function Oracledb_Formatter() {
    (0, _classCallCheck3.default)(this, Oracledb_Formatter);
    return (0, _possibleConstructorReturn3.default)(this, _Oracle_Formatter.apply(this, arguments));
  }

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  Oracledb_Formatter.prototype.parameter = function parameter(value) {
    if (typeof value === 'function') {
      return this.outputQuery(this.compileCallback(value), true);
    } else if (value instanceof BlobHelper) {
      return 'EMPTY_BLOB()';
    }
    return this.unwrapRaw(value, true) || '?';
  };

  return Oracledb_Formatter;
}(Oracle_Formatter);

module.exports = Client_Oracledb;
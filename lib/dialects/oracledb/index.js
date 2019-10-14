// Oracledb Client
// -------
const _ = require('lodash');
const inherits = require('inherits');
const QueryCompiler = require('./query/compiler');
const ColumnCompiler = require('./schema/columncompiler');
const { BlobHelper, ReturningHelper, isConnectionError } = require('./utils');
const Bluebird = require('bluebird');
const stream = require('stream');
const { promisify } = require('util');
const Transaction = require('./transaction');
const Client_Oracle = require('../oracle');
const Oracle_Formatter = require('../oracle/formatter');

function Client_Oracledb() {
  Client_Oracle.apply(this, arguments);
  // Node.js only have 4 background threads by default, oracledb needs one by connection
  if (this.driver) {
    process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 1;
    process.env.UV_THREADPOOL_SIZE =
      parseInt(process.env.UV_THREADPOOL_SIZE) + this.driver.poolMax;
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
          this.logger.warn(
            'Only "date", "number" and "clob" are supported for fetchAsString'
          );
        }
        client.fetchAsString.push(oracledb[type]);
      }
    });
  }
  return oracledb;
};

Client_Oracledb.prototype.queryCompiler = function() {
  return new QueryCompiler(this, ...arguments);
};
Client_Oracledb.prototype.columnCompiler = function() {
  return new ColumnCompiler(this, ...arguments);
};
Client_Oracledb.prototype.formatter = function() {
  return new Oracledb_Formatter(this, ...arguments);
};
Client_Oracledb.prototype.transaction = function() {
  return new Transaction(this, ...arguments);
};

Client_Oracledb.prototype.prepBindings = function(bindings) {
  return _.map(bindings, (value) => {
    if (value instanceof BlobHelper && this.driver) {
      return { type: this.driver.BLOB, dir: this.driver.BIND_OUT };
      // Returning helper always use ROWID as string
    } else if (value instanceof ReturningHelper && this.driver) {
      return { type: this.driver.STRING, dir: this.driver.BIND_OUT };
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
  const asyncConnection = new Bluebird(function(resolver, rejecter) {
    // If external authentication dont have to worry about username/password and
    // if not need to set the username and password
    const oracleDbConfig = client.connectionSettings.externalAuth
      ? { externalAuth: client.connectionSettings.externalAuth }
      : {
          user: client.connectionSettings.user,
          password: client.connectionSettings.password,
        };

    // In the case of external authentication connection string will be given
    oracleDbConfig.connectString =
      client.connectionSettings.connectString ||
      client.connectionSettings.host + '/' + client.connectionSettings.database;

    if (client.connectionSettings.prefetchRowCount) {
      oracleDbConfig.prefetchRows = client.connectionSettings.prefetchRowCount;
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
        return new Bluebird((commitResolve, commitReject) => {
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
        return new Bluebird((rollbackResolve, rollbackReject) => {
          this.rollback(function(err) {
            if (err) {
              return rollbackReject(err);
            }
            rollbackResolve();
          });
        });
      };
      const fetchAsync = promisify(function(sql, bindParams, options, cb) {
        options = options || {};
        options.outFormat =
          client.driver.OUT_FORMAT_OBJECT || client.driver.OBJECT;
        if (!options.outFormat) {
          throw new Error('not found oracledb.outFormat constants');
        }
        if (options.resultSet) {
          connection.execute(sql, bindParams || [], options, function(
            err,
            result
          ) {
            if (err) {
              if (isConnectionError(err)) {
                connection.close().catch(function(err) {});
                connection.__knex__disposed = err;
              }
              return cb(err);
            }
            const fetchResult = { rows: [], resultSet: result.resultSet };
            const numRows = 100;
            const fetchRowsFromRS = function(connection, resultSet, numRows) {
              resultSet.getRows(numRows, function(err, rows) {
                if (err) {
                  if (isConnectionError(err)) {
                    connection.close().catch(function(err) {});
                    connection.__knex__disposed = err;
                  }
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
      });
      connection.executeAsync = function(sql, bindParams, options) {
        // Read all lob
        return fetchAsync(sql, bindParams, options).then(async (results) => {
          const closeResultSet = () => {
            return results.resultSet
              ? promisify(results.resultSet.close).call(results.resultSet)
              : Promise.resolve();
          };

          // Collect LOBs to read
          const lobs = [];
          if (results.rows) {
            if (Array.isArray(results.rows)) {
              for (let i = 0; i < results.rows.length; i++) {
                // Iterate through the rows
                const row = results.rows[i];
                for (const column in row) {
                  if (row[column] instanceof stream.Readable) {
                    lobs.push({ index: i, key: column, stream: row[column] });
                  }
                }
              }
            }
          }

          try {
            for (const lob of lobs) {
              // todo should be fetchAsString/fetchAsBuffer polyfill only
              results.rows[lob.index][lob.key] = await lobProcessing(
                lob.stream
              );
            }
          } catch (e) {
            await closeResultSet().catch(() => {});

            throw e;
          }

          await closeResultSet();

          return results;
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
  return connection.release();
};

// Runs the query on the specified connection, providing the bindings
// and any other necessary prep work.
Client_Oracledb.prototype._query = function(connection, obj) {
  if (!obj.sql) throw new Error('The query is empty');

  const options = { autoCommit: false };
  if (obj.method === 'select') {
    options.resultSet = true;
  }
  return Bluebird.resolve(
    connection.executeAsync(obj.sql, obj.bindings, options)
  ).then(async function(response) {
    // Flatten outBinds
    let outBinds = _.flatten(response.outBinds);
    obj.response = response.rows || [];
    obj.rowsAffected = response.rows
      ? response.rows.rowsAffected
      : response.rowsAffected;

    //added for outBind parameter
    if (obj.method === 'raw' && outBinds.length > 0) {
      return {
        response: outBinds,
      };
    }

    if (obj.method === 'update') {
      const modifiedRowsCount = obj.rowsAffected.length || obj.rowsAffected;
      const updatedObjOutBinding = [];
      const updatedOutBinds = [];
      const updateOutBinds = (i) =>
        function(value, index) {
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
      await connection.commitAsync();
      return obj;
    }
    const rowIds = [];
    let offset = 0;

    for (let line = 0; line < obj.outBinding.length; line++) {
      const ret = obj.outBinding[line];

      offset =
        offset +
        (obj.outBinding[line - 1] ? obj.outBinding[line - 1].length : 0);

      for (let index = 0; index < ret.length; index++) {
        const out = ret[index];

        await new Promise(function(bindResolver, bindRejecter) {
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
      }
    }
    return connection.commitAsync().then(function() {
      if (obj.returningSql) {
        return connection
          .executeAsync(obj.returningSql(), rowIds, { resultSet: true })
          .then(function(response) {
            obj.response = response.rows;
            return obj;
          });
      }
      return obj;
    });
  });
};

/**
 * @param stream
 * @param {'string' | 'buffer'} type
 */
function readStream(stream, type) {
  return new Promise((resolve, reject) => {
    let data = '';

    stream.on('error', function(err) {
      reject(err);
    });
    stream.on('data', function(chunk) {
      if (type === 'string') {
        data += chunk;
      } else {
        data = Buffer.concat([data, chunk]);
      }
    });
    stream.on('end', function() {
      resolve(data);
    });
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

const lobProcessing = function(stream) {
  const oracledb = require('oracledb');

  /**
   * @type 'string' | 'buffer'
   */
  let type;

  if (stream.type) {
    // v1.2-v4
    if (stream.type === oracledb.BLOB) {
      type = 'buffer';
    } else if (stream.type === oracledb.CLOB) {
      type = 'string';
    }
  } else if (stream.iLob) {
    // v1
    if (stream.iLob.type === oracledb.CLOB) {
      type = 'string';
    } else if (stream.iLob.type === oracledb.BLOB) {
      type = 'buffer';
    }
  } else {
    throw new Error('Unrecognized oracledb lob stream type');
  }
  if (type === 'string') {
    stream.setEncoding('utf-8');
  }
  return readStream(stream, type);
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

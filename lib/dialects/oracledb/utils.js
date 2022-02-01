const Utils = require('../oracle/utils');
const { promisify } = require('util');
const stream = require('stream');

function BlobHelper(columnName, value) {
  this.columnName = columnName;
  this.value = value;
  this.returning = false;
}

BlobHelper.prototype.toString = function () {
  return '[object BlobHelper:' + this.columnName + ']';
};

/**
 * @param stream
 * @param {'string' | 'buffer'} type
 */
function readStream(stream, type) {
  return new Promise((resolve, reject) => {
    let data = type === 'string' ? '' : Buffer.alloc(0);

    stream.on('error', function (err) {
      reject(err);
    });
    stream.on('data', function (chunk) {
      if (type === 'string') {
        data += chunk;
      } else {
        data = Buffer.concat([data, chunk]);
      }
    });
    stream.on('end', function () {
      resolve(data);
    });
  });
}

const lobProcessing = function (stream) {
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

function monkeyPatchConnection(connection, client) {
  // Connection is already monkey-patched
  if (connection.executeAsync) {
    return;
  }

  connection.commitAsync = function () {
    return new Promise((commitResolve, commitReject) => {
      this.commit(function (err) {
        if (err) {
          return commitReject(err);
        }
        commitResolve();
      });
    });
  };
  connection.rollbackAsync = function () {
    return new Promise((rollbackResolve, rollbackReject) => {
      this.rollback(function (err) {
        if (err) {
          return rollbackReject(err);
        }
        rollbackResolve();
      });
    });
  };
  const fetchAsync = promisify(function (sql, bindParams, options, cb) {
    options = options || {};
    options.outFormat = client.driver.OUT_FORMAT_OBJECT || client.driver.OBJECT;
    if (!options.outFormat) {
      throw new Error('not found oracledb.outFormat constants');
    }
    if (options.resultSet) {
      connection.execute(
        sql,
        bindParams || [],
        options,
        function (err, result) {
          if (err) {
            if (Utils.isConnectionError(err)) {
              connection.close().catch(function (err) {});
              connection.__knex__disposed = err;
            }
            return cb(err);
          }
          const fetchResult = { rows: [], resultSet: result.resultSet };
          const numRows = 100;
          const fetchRowsFromRS = function (connection, resultSet, numRows) {
            resultSet.getRows(numRows, function (err, rows) {
              if (err) {
                if (Utils.isConnectionError(err)) {
                  connection.close().catch(function (err) {});
                  connection.__knex__disposed = err;
                }
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
        }
      );
    } else {
      connection.execute(
        sql,
        bindParams || [],
        options,
        function (err, result) {
          if (err) {
            // dispose the connection on connection error
            if (Utils.isConnectionError(err)) {
              connection.close().catch(function (err) {});
              connection.__knex__disposed = err;
            }
            return cb(err);
          }

          return cb(null, result);
        }
      );
    }
  });
  connection.executeAsync = function (sql, bindParams, options) {
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
          results.rows[lob.index][lob.key] = await lobProcessing(lob.stream);
        }
      } catch (e) {
        await closeResultSet().catch(() => {});

        throw e;
      }

      await closeResultSet();

      return results;
    });
  };
}

Utils.BlobHelper = BlobHelper;
Utils.monkeyPatchConnection = monkeyPatchConnection;
module.exports = Utils;

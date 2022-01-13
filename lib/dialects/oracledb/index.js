// Oracledb Client
// -------
const each = require('lodash/each');
const flatten = require('lodash/flatten');
const isEmpty = require('lodash/isEmpty');
const map = require('lodash/map');

const Formatter = require('../../formatter');
const QueryCompiler = require('./query/oracledb-querycompiler');
const TableCompiler = require('./schema/oracledb-tablecompiler');
const ColumnCompiler = require('./schema/oracledb-columncompiler');
const {
  BlobHelper,
  ReturningHelper,
  monkeyPatchConnection,
} = require('./utils');
const ViewCompiler = require('./schema/oracledb-viewcompiler');
const ViewBuilder = require('./schema/oracledb-viewbuilder');
const Transaction = require('./transaction');
const Client_Oracle = require('../oracle');
const { isString } = require('../../util/is');
const { outputQuery, unwrapRaw } = require('../../formatter/wrappingFormatter');
const { compileCallback } = require('../../formatter/formatterUtils');

class Client_Oracledb extends Client_Oracle {
  constructor(config) {
    super(config);
    if (this.driver) {
      process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 1;
      process.env.UV_THREADPOOL_SIZE =
        parseInt(process.env.UV_THREADPOOL_SIZE) + this.driver.poolMax;
    }
  }

  _driver() {
    const client = this;
    const oracledb = require('oracledb');
    client.fetchAsString = [];
    if (this.config.fetchAsString && Array.isArray(this.config.fetchAsString)) {
      this.config.fetchAsString.forEach(function (type) {
        if (!isString(type)) return;
        type = type.toUpperCase();
        if (oracledb[type]) {
          if (
            type !== 'NUMBER' &&
            type !== 'DATE' &&
            type !== 'CLOB' &&
            type !== 'BUFFER'
          ) {
            this.logger.warn(
              'Only "date", "number", "clob" and "buffer" are supported for fetchAsString'
            );
          }
          client.fetchAsString.push(oracledb[type]);
        }
      });
    }
    return oracledb;
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  viewBuilder() {
    return new ViewBuilder(this, ...arguments);
  }

  viewCompiler() {
    return new ViewCompiler(this, ...arguments);
  }

  formatter(builder) {
    return new Formatter(this, builder);
  }

  transaction() {
    return new Transaction(this, ...arguments);
  }

  prepBindings(bindings) {
    return map(bindings, (value) => {
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
  }

  // Checks whether a value is a function... if it is, we compile it
  // otherwise we check whether it's a raw
  parameter(value, builder, formatter) {
    if (typeof value === 'function') {
      return outputQuery(
        compileCallback(value, undefined, this, formatter),
        true,
        builder,
        this
      );
    } else if (value instanceof BlobHelper) {
      return 'EMPTY_BLOB()';
    }
    return unwrapRaw(value, true, builder, this, formatter) || '?';
  }

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this;
    const asyncConnection = new Promise(function (resolver, rejecter) {
      // If external authentication don't have to worry about username/password and
      // if not need to set the username and password
      const oracleDbConfig = client.connectionSettings.externalAuth
        ? { externalAuth: client.connectionSettings.externalAuth }
        : {
            user: client.connectionSettings.user,
            password: client.connectionSettings.password,
          };

      // In the case of external authentication connection string will be given
      oracleDbConfig.connectString = resolveConnectString(
        client.connectionSettings
      );

      if (client.connectionSettings.prefetchRowCount) {
        oracleDbConfig.prefetchRows =
          client.connectionSettings.prefetchRowCount;
      }

      if (client.connectionSettings.stmtCacheSize !== undefined) {
        oracleDbConfig.stmtCacheSize = client.connectionSettings.stmtCacheSize;
      }

      client.driver.fetchAsString = client.fetchAsString;

      client.driver.getConnection(oracleDbConfig, function (err, connection) {
        if (err) {
          return rejecter(err);
        }
        monkeyPatchConnection(connection, client);

        resolver(connection);
      });
    });
    return asyncConnection;
  }

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return connection.release();
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    const options = { autoCommit: false };
    if (obj.method === 'select') {
      options.resultSet = true;
    }
    return connection
      .executeAsync(obj.sql, obj.bindings, options)
      .then(async function (response) {
        // Flatten outBinds
        let outBinds = flatten(response.outBinds);
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
            function (value, index) {
              const OutBindsOffset = index * modifiedRowsCount;
              updatedOutBinds.push(outBinds[i + OutBindsOffset]);
            };

          for (let i = 0; i < modifiedRowsCount; i++) {
            updatedObjOutBinding.push(obj.outBinding[0]);
            each(obj.outBinding[0], updateOutBinds(i));
          }
          outBinds = updatedOutBinds;
          obj.outBinding = updatedObjOutBinding;
        }

        if (!obj.returning && outBinds.length === 0) {
          if (!connection.isTransaction) {
            await connection.commitAsync();
          }
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

            await new Promise(function (bindResolver, bindRejecter) {
              if (out instanceof BlobHelper) {
                const blob = outBinds[index + offset];
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
          }
        }
        if (connection.isTransaction) {
          return obj;
        }
        await connection.commitAsync();
        if (obj.returningSql) {
          const response = await connection.executeAsync(
            obj.returningSql(),
            rowIds,
            { resultSet: true }
          );
          obj.response = response.rows;
        }
        return obj;
      });
  }

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    const { response } = obj;
    if (obj.output) {
      return obj.output.call(runner, response);
    }
    switch (obj.method) {
      case 'select':
        return response;
      case 'first':
        return response[0];
      case 'pluck':
        return map(response, obj.pluck);
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        if (obj.returning && !isEmpty(obj.returning)) {
          return response;
        } else if (obj.rowsAffected !== undefined) {
          return obj.rowsAffected;
        } else {
          return 1;
        }
      default:
        return response;
    }
  }

  processPassedConnection(connection) {
    monkeyPatchConnection(connection, this);
  }
}

Client_Oracledb.prototype.driverName = 'oracledb';

function resolveConnectString(connectionSettings) {
  if (connectionSettings.connectString) {
    return connectionSettings.connectString;
  }

  if (!connectionSettings.port) {
    return connectionSettings.host + '/' + connectionSettings.database;
  }

  return (
    connectionSettings.host +
    ':' +
    connectionSettings.port +
    '/' +
    connectionSettings.database
  );
}

module.exports = Client_Oracledb;

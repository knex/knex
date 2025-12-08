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

    if (this.version) {
      // Normalize version format; null bad format
      // to trigger fallback to auto-detect.
      this.version = parseVersion(this.version);
    }

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
      formatter.bindings.push(value.value);
      return '?';
    }
    return unwrapRaw(value, true, builder, this, formatter) || '?';
  }

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      // If external authentication don't have to worry about username/password and
      // if not need to set the username and password
      const oracleDbConfig = this.connectionSettings.externalAuth
        ? { externalAuth: this.connectionSettings.externalAuth }
        : {
            user: this.connectionSettings.user,
            password: this.connectionSettings.password,
          };

      // In the case of external authentication connection string will be given
      oracleDbConfig.connectString = resolveConnectString(
        this.connectionSettings
      );

      if (this.connectionSettings.prefetchRowCount) {
        oracleDbConfig.prefetchRows = this.connectionSettings.prefetchRowCount;
      }

      if (this.connectionSettings.stmtCacheSize !== undefined) {
        oracleDbConfig.stmtCacheSize = this.connectionSettings.stmtCacheSize;
      }

      this.driver.fetchAsString = this.fetchAsString;

      this.driver.getConnection(oracleDbConfig, (err, connection) => {
        if (err) {
          return rejecter(err);
        }
        monkeyPatchConnection(connection, this);

        resolver(connection);
      });
    });
  }

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return connection.release();
  }

  // Handle oracle version resolution on acquiring connection from pool instead of connection creation.
  // Must do this here since only the client used to create a connection would be updated with version
  // information on creation. Poses a problem when knex instance is cloned since instances share the
  // connection pool while having their own client instances.
  async acquireConnection() {
    const connection = await super.acquireConnection();
    this.checkVersion(connection);
    return connection;
  }

  // In Oracle, we need to check the version to dynamically determine
  // certain limits. If user did not specify a version, get it from the connection.
  checkVersion(connection) {
    // Already determined version before?
    if (this.version) {
      return this.version;
    }

    const detectedVersion = parseVersion(connection.oracleServerVersionString);
    if (!detectedVersion) {
      // When original version is set to null, user-provided version was invalid and we fell-back to auto-detect.
      // Otherwise, we couldn't auto-detect at all. Set error message accordingly.
      throw new Error(
        this.version === null
          ? 'Invalid Oracledb version number format passed to knex. Unable to successfully auto-detect as fallback. Please specify a valid oracledb version.'
          : 'Unable to detect Oracledb version number automatically. Please specify the version in knex configuration.'
      );
    }

    this.version = detectedVersion;
    return detectedVersion;
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    const options = Object.assign({}, obj.options, { autoCommit: false });
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
        if (obj.returningSql) {
          const response = await connection.executeAsync(
            obj.returningSql(),
            rowIds,
            { resultSet: true }
          );
          obj.response = response.rows;
        }
        if (connection.isTransaction) {
          return obj;
        }
        await connection.commitAsync();
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
        if ((obj.returning && !isEmpty(obj.returning)) || obj.returningSql) {
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
    this.checkVersion(connection);
    monkeyPatchConnection(connection, this);
  }
}

Client_Oracledb.prototype.driverName = 'oracledb';

function parseVersion(versionString) {
  try {
    // We only care about first two version components at most
    const versionParts = versionString.split('.').slice(0, 2);
    // Strip off any character suffixes in version number (ex. 12c => 12, 12.2c => 12.2)
    versionParts.forEach((versionPart, idx) => {
      versionParts[idx] = versionPart.replace(/\D$/, '');
    });
    const version = versionParts.join('.');
    return version.match(/^\d+\.?\d*$/) ? version : null;
  } catch (err) {
    // Non-string versionString passed in.
    return null;
  }
}

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

import Bluebird from 'bluebird';
import { defer, fromPairs, isArray, toPairs } from 'lodash';
import { QueryCompiler } from './query/QueryCompiler';
import { SchemaCompiler, TableCompiler } from './schema';
import * as ColumnBuilder from '../../schema/columnbuilder';
import * as ColumnCompiler_MySQL from '../mysql/schema/mysql-columncompiler';
import * as Transaction from '../../execution/transaction';
import { promisify } from 'util';
const Client = require('../../client');

export class Client_Snowflake extends Client {
  constructor(
    config = {
      dialect: 'snowflake',
      driverName: 'snowflake-sdk',
    }
  ) {
    if (config.connection) {
      if (config.connection.user && !config.connection.username) {
        config.connection.username = config.connection.user;
      }
      if (config.connection.host) {
        const [account, region] = config.connection.host.split('.');
        if (!config.connection.account) {
          config.connection.account = account;
        }
        if (!config.connection.region) {
          config.connection.region = region;
        }
      }
    }
    super(config);
  }

  transaction(container, config, outerTx) {
    const transax = new Transaction(this, container, config, outerTx);
    transax.savepoint = (conn) => {
      // @ts-ignore
      transax.trxClient.logger('Snowflake does not support savepoints.');
    };

    transax.release = (conn, value) => {
      // @ts-ignore
      transax.trxClient.logger('Snowflake does not support savepoints.');
    };

    transax.rollbackTo = (conn, error) => {
      // @ts-ignore
      this.trxClient.logger('Snowflake does not support savepoints.');
    };
    return transax;
  }
  // @ts-ignore
  queryCompiler(builder) {
    const compiledQuery = new QueryCompiler(this, builder);
    return compiledQuery;
  }

  columnBuilder(tableBuilder, type, args) {
    // ColumnBuilder methods are created at runtime, so that it does not play well with TypeScript.
    // So instead of extending ColumnBuilder, we override methods at runtime here
    const columnBuilder = new ColumnBuilder(this, tableBuilder, type, args);
    columnBuilder.primary = (constraintName) => {
      // @ts-ignore
      columnBuilder.notNullable();
      return columnBuilder;
    };
    columnBuilder.index = (indexName) => {
      // @ts-ignore
      columnBuilder.client.logger.warn(
        'Snowflake does not support the creation of indexes.'
      );
      return columnBuilder;
    };

    return columnBuilder;
  }

  columnCompiler(tableCompiler, columnBuilder) {
    // ColumnCompiler methods are created at runtime, so that it does not play well with TypeScript.
    // So instead of extending ColumnCompiler, we override methods at runtime here
    const columnCompiler = new ColumnCompiler_MySQL(
      this,
      tableCompiler.tableBuilder,
      columnBuilder
    );
    columnCompiler.increments = 'int not null autoincrement primary key';
    columnCompiler.bigincrements = 'bigint not null autoincrement primary key';

    columnCompiler.mediumint = (colName) => 'integer';
    columnCompiler.decimal = (colName, precision, scale) => {
      if (precision) {
        return ColumnCompiler_MySQL.prototype.decimal(
          colName,
          precision,
          scale
        );
      }
      return 'decimal';
    };
    columnCompiler.double = (colName, precision, scale) => {
      if (precision) {
        return ColumnCompiler_MySQL.prototype.decimal(
          colName,
          precision,
          scale
        );
      }
      return 'double';
    };
    columnCompiler.enu = (colName, values) => 'varchar';
    columnCompiler.json = columnCompiler.jsonb = (colName) => 'variant';
    return columnCompiler;
  }

  tableCompiler(tableBuilder) {
    return new TableCompiler(this, tableBuilder);
  }

  schemaCompiler(builder) {
    return new SchemaCompiler(this, builder);
  }

  _driver() {
    const Snowflake = require('snowflake-sdk');
    return Snowflake;
  }

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const connection = this.driver.createConnection(this.connectionSettings);
      connection.on('error', (err) => {
        connection.__knex__disposed = err;
      });
      connection.connect((err) => {
        if (err) {
          // if connection is rejected, remove listener that was registered above...
          connection.removeAllListeners();
          return rejecter(err);
        }
        resolver(connection);
      });
    });
  }

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    try {
      const end = promisify((cb) => connection.end(cb));
      await end();
    } catch (err) {
      connection.__knex__disposed = err;
    } finally {
      // see discussion https://github.com/knex/knex/pull/3483
      defer(() => connection.removeAllListeners());
    }
  }

  async validateConnection(connection) {
    if (connection) {
      return true;
    }
    return false;
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Bluebird((resolver, rejecter) => {
      if (!obj.sql) {
        resolver();
        return;
      }

      const queryOptions = {
        sqlText: obj.sql,
        binds: obj.bindings,
        complete(err, statement, rows) {
          if (err) return rejecter(err);
          obj.response = { rows, statement };
          resolver(obj);
        },
        ...obj.options,
      };
      connection.execute(queryOptions);
    });
  }

  // Ensures the response is returned in the same format as other clients.
  processResponse(obj, runner) {
    const resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    if (obj.method === 'raw') return resp;
    if (obj.method === 'select') {
      // if (obj.method === 'first') return resp.rows[0];
      // if (obj.method === 'pluck') return map(resp.rows, obj.pluck);
      return resp.rows;
    }
    if (
      obj.method === 'insert' ||
      obj.method === 'update' ||
      obj.method === 'delete'
    ) {
      if (resp.rows) {
        const method = obj.method === 'insert' ? 'inserte' : obj.method;
        return resp.rows.reduce(
          (count, row) => count + row[`number of rows ${method}d`],
          0
        );
      }
      return resp;
    }
    if (resp.statement && resp.rows) {
      return resp.rows;
    }
    return resp;
  }

  postProcessResponse(result, queryContext) {
    if (this.config.postProcessResponse) {
      return this.config.postProcessResponse(result, queryContext);
    }
    // Snowflake returns column names in uppercase, convert to lowercase
    // (to conform with knex, e.g. schema migrations)
    const lowercaseAttrs = (row) => {
      return fromPairs(
        toPairs(row).map(([key, value]) => [key.toLowerCase(), value])
      );
    };
    if (result.rows) {
      return {
        ...result,
        rows: result.rows.map(lowercaseAttrs),
      };
    } else if (isArray(result)) {
      return result.map(lowercaseAttrs);
    }
    return result;
  }

  customWrapIdentifier(value, origImpl, queryContext) {
    if (this.config.wrapIdentifier) {
      return this.config.wrapIdentifier(value, origImpl, queryContext);
    } else if (!value.startsWith('"')) {
      return origImpl(value.toUpperCase());
    }
    return origImpl;
  }
}

Object.assign(Client_Snowflake.prototype, {
  driverName: 'snowflake-sdk',
});
module.exports = Client_Snowflake;

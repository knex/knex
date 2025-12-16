// MySQL Client
// -------
const defer = require('lodash/defer');
const map = require('lodash/map');
const { promisify } = require('util');
const Client = require('../../client');

const Transaction = require('./transaction');
const QueryBuilder = require('./query/mysql-querybuilder');
const QueryCompiler = require('./query/mysql-querycompiler');
const SchemaCompiler = require('./schema/mysql-compiler');
const TableCompiler = require('./schema/mysql-tablecompiler');
const ColumnCompiler = require('./schema/mysql-columncompiler');

const { makeEscape } = require('../../util/string');
const ViewCompiler = require('./schema/mysql-viewcompiler');
const ViewBuilder = require('./schema/mysql-viewbuilder');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
class Client_MySQL extends Client {
  _driver() {
    return require('mysql');
  }

  queryBuilder() {
    return new QueryBuilder(this);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  viewCompiler() {
    return new ViewCompiler(this, ...arguments);
  }

  viewBuilder() {
    return new ViewBuilder(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  transaction() {
    return new Transaction(this, ...arguments);
  }

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  }

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Promise((resolver, rejecter) => {
      const connection = this.driver.createConnection(this.connectionSettings);
      connection.on('error', (err) => {
        connection.__knex__disposed = err;
      });
      connection.connect(async (err) => {
        if (err) {
          // if connection is rejected, remove listener that was registered above...
          connection.removeAllListeners();
          return rejecter(err);
        }
        try {
          await this.checkVersion(connection);
          resolver(connection);
        } catch (versionError) {
          connection.removeAllListeners();
          connection.destroy();
          rejecter(versionError);
        }
      });
    });
  }

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    try {
      const end = promisify((cb) => connection.end(cb));
      return await end();
    } catch (err) {
      connection.__knex__disposed = err;
    } finally {
      // see discussion https://github.com/knex/knex/pull/3483
      defer(() => connection.removeAllListeners());
    }
  }

  validateConnection(connection) {
    return (
      connection.state === 'connected' || connection.state === 'authenticated'
    );
  }

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error('The query is empty');

    options = options || {};
    const queryOptions = Object.assign({ sql: obj.sql }, obj.options);
    return new Promise((resolver, rejecter) => {
      stream.on('error', rejecter);
      stream.on('end', resolver);
      const queryStream = connection
        .query(queryOptions, obj.bindings)
        .stream(options);

      queryStream.on('error', (err) => {
        rejecter(err);
        stream.emit('error', err);
      });

      queryStream.pipe(stream);
    });
  }

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    if (!obj.sql) throw new Error('The query is empty');

    return new Promise(function (resolver, rejecter) {
      if (!obj.sql) {
        resolver();
        return;
      }
      const queryOptions = Object.assign({ sql: obj.sql }, obj.options);
      connection.query(
        queryOptions,
        obj.bindings,
        function (err, rows, fields) {
          if (err) return rejecter(err);
          obj.response = [rows, fields];
          resolver(obj);
        }
      );
    });
  }

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response } = obj;
    const { method } = obj;
    const rows = response[0];
    const fields = response[1];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
        return rows;
      case 'first':
        return rows[0];
      case 'pluck':
        return map(rows, obj.pluck);
      case 'insert':
        return [rows.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows;
      default:
        return response;
    }
  }

  async cancelQuery(connectionToKill) {
    const conn = await this.acquireRawConnection();
    try {
      return await this._wrappedCancelQueryCall(conn, connectionToKill);
    } finally {
      await this.destroyRawConnection(conn);
      if (conn.__knex__disposed) {
        this.logger.warn(`Connection Error: ${conn.__knex__disposed}`);
      }
    }
  }

  _wrappedCancelQueryCall(conn, connectionToKill) {
    return this._query(conn, {
      sql: 'KILL QUERY ?',
      bindings: [connectionToKill.threadId],
      options: {},
    });
  }

  async checkVersion(connection) {
    if (this._versionCheckPromise) {
      return this._versionCheckPromise;
    }

    this._versionCheckPromise = (async () => {
      try {
        const query = promisify(connection.query).bind(connection);
        const rows = await query('select version() as version');
        const rawVersion =
          rows?.[0]?.version || rows?.[0]?.VERSION || rows?.[0]?.['VERSION()'];

        if (!rawVersion) {
          throw new Error('Unable to retrieve MySQL/MariaDB version');
        }

        const { version, isMariaDB } = this._parseVersion(rawVersion);
        this.isMariaDB = isMariaDB;
        if (!this.version) {
          this.version = version;
        }
        return this.version;
      } catch (err) {
        this._versionCheckPromise = null;
        throw err;
      }
    })();

    return this._versionCheckPromise;
  }

  _parseVersion(versionString) {
    const isMariaDB = /mariadb/i.test(versionString);
    let versionMatch;

    if (isMariaDB) {
      const mariaMatch =
        versionString.match(/(\d+\.\d+\.\d+)(?=[^\d]*mariadb)/i) ||
        versionString.match(/(\d+\.\d+\.\d+)/);
      versionMatch = mariaMatch && mariaMatch[1];
    } else {
      const mysqlMatch = versionString.match(/(\d+\.\d+\.\d+)/);
      versionMatch = mysqlMatch && mysqlMatch[1];
    }

    if (!versionMatch) {
      throw new Error(
        `Unable to parse MySQL/MariaDB version from string: ${versionString}`
      );
    }

    return { version: versionMatch, isMariaDB };
  }
}

Object.assign(Client_MySQL.prototype, {
  dialect: 'mysql',

  driverName: 'mysql',

  _escapeBinding: makeEscape(),

  canCancelQuery: true,
});

module.exports = Client_MySQL;

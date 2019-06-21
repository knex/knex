// MySQL Client
// -------
const inherits = require('inherits');

const Client = require('../../client');
const Bluebird = require('bluebird');

const Transaction = require('../../transaction');
const QueryCompiler = require('./query/compiler');
const SchemaCompiler = require('../../schema/compiler');
const TableCompiler = require('../../schema/tablecompiler');
const ColumnCompiler = require('../../schema/columncompiler');

const { assign, map } = require('lodash');
const { makeEscape } = require('../../query/string');

const sqlString = require('sqlstring');

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Clickhouse(config) {
  Client.call(this, config);
}

inherits(Client_Clickhouse, Client);

assign(Client_Clickhouse.prototype, {
  dialect: 'clickhouse',

  driverName: 'clickhouse',

  _driver() {
    const { ClickHouse } = require('clickhouse');
    const clickhouse = new ClickHouse({
      url: this.config.connection.host,
      port: this.config.connection.port,
      debug: false,
      basicAuth: null,
      isUseGzip: false,
      user: this.config.connection.user,
      password: this.config.connection.password,
      database: this.config.connection.database,
      config: {
          session_timeout                         : 60,
          output_format_json_quote_64bit_integers : 0,
          enable_http_compression                 : 0
      }
    });
    return clickhouse;
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  transaction() {
    return new Transaction(this, ...arguments);
  },

  _escapeBinding: makeEscape(),

  wrapIdentifierImpl(value) {
    return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    return new Bluebird((resolver, rejecter) => {
      this.driver.state = "connected";
      resolver(this.driver);
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return Bluebird.fromCallback(connection.end.bind(connection))
      .catch((err) => {
        connection.__knex__disposed = err;
      })
      .finally(() => connection.removeAllListeners());
  },

  validateConnection(connection) {
    if (
      connection.state === 'connected' ||
      connection.state === 'authenticated'
    ) {
      return true;
    }
    return false;
  },

  // Grab a connection, run the query via the MySQL streaming interface,
  // and pass that through to the stream we've sent back to the client.
  _stream(connection, obj, stream, options) {
    options = options || {};
    const queryOptions = assign({ sql: obj.sql }, obj.options);
    return new Bluebird((resolver, rejecter) => {
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
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Bluebird(function(resolver, rejecter) {
      if (!obj.sql) {
        resolver();
        return;
      }

      const queryOptions = assign({ sql: obj.sql }, obj.options);
      const query = sqlString.format(queryOptions.sql, obj.bindings);
      connection.query(query, function(err, rows, fields) {
        if (err) return rejecter(err);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },

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
      case 'pluck':
      case 'first': {
        if (method === 'pluck') return map(rows, obj.pluck);
        return method === 'first' ? rows[0] : rows;
      }
      case 'insert':
        return [rows.insertId];
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows;
      default:
        return response;
    }
  },

  canCancelQuery: true,

  cancelQuery(connectionToKill) {
    const acquiringConn = this.acquireConnection();

    // Error out if we can't acquire connection in time.
    // Purposely not putting timeout on `KILL QUERY` execution because erroring
    // early there would release the `connectionToKill` back to the pool with
    // a `KILL QUERY` command yet to finish.
    return acquiringConn
      .timeout(100)
      .then((conn) =>
        this.query(conn, {
          method: 'raw',
          sql: 'KILL QUERY ?',
          bindings: [connectionToKill.threadId],
          options: {},
        })
      )
      .finally(() => {
        // NOT returning this promise because we want to release the connection
        // in a non-blocking fashion
        acquiringConn.then((conn) => this.releaseConnection(conn));
      });
  },
});

module.exports = Client_Clickhouse;

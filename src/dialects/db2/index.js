
// DB2
// -------
import { assign, map, extend } from 'lodash'
import inherits from 'inherits';
import Client from '../../client';
import Promise from 'bluebird';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import ColumnCompiler from './schema/columncompiler';
import TableCompiler from './schema/tablecompiler';
import SchemaCompiler from './schema/compiler';
import Db2QueryStream from './stream';
import { makeEscape } from '../../query/string';

export default function Client_DB2(config) {
  Client.call(this, config)
}

// TODO: Factor this out
function promisifyAsyncMethods(obj) {
  const newobj = {};
  for (let prop in obj) {
    newobj[prop] = obj[prop];

    let isAsyncMethod = !prop.toLowerCase().endsWith('sync') && typeof(obj[prop]) === 'function';
    if (isAsyncMethod) {
      newobj[prop + 'Async'] = Promise.promisify(obj[prop]);
    }
  }

  return newobj;
}

inherits(Client_DB2, Client)

assign(Client_DB2.prototype, {

  queryCompiler() {
    return new QueryCompiler(this, ...arguments)
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments)
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments)
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments)
  },

  transaction() {
    return new Transaction(this, ...arguments);
  },

  dialect: 'db2',

  driverName: 'ibm_db',

  _driver() {
    return require(this.driverName);
  },

  _escapeBinding: makeEscape({
    escapeArray(val, esc) {
      return '{' + val.map(esc).join(',') + '}'
    },
    escapeString(str) {
      let hasBackslash = false
      let escaped = '\''
      for (let i = 0; i < str.length; i++) {
        const c = str[i]
        if (c === '\'') {
          escaped += c + c
        } else if (c === '\\') {
          escaped += c + c
          hasBackslash = true
        } else {
          escaped += c
        }
      }
      escaped += '\''
      if (hasBackslash === true) {
        escaped = 'E' + escaped
      }
      return escaped
    },
    escapeObject(val, timezone, prepareValue, seen = []) {
      if (val && typeof val.toPostgres === 'function') {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error(`circular reference detected while preparing "${val}" for query`);
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
  }),

  wrapIdentifier(value) {
    if (value === '*') return value;
    const matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifier(matched[1]) + matched[2];
    return `"${value.replace(/"/g, '""')}"`;
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this;
    return new Promise((resolver, rejecter) => {
      const connection = client.config.connection;
      const connectionString = `DATABASE=${connection.database};`
        + `HOSTNAME=${connection.host};PORT=${connection.port};UID=${connection.user};PWD=${connection.password}`;
      client.driver.open(connectionString, function (err, connection) {
        if (err) {
          return rejecter(err);
        }
        // connection.on('error', function (err) {
        //   connection.__knex__disposed = err;
        // });



        resolver(promisifyAsyncMethods(connection));
      });
    }).tap(function setSearchPath(connection) {
      return client.setSchemaSearchPath(connection);
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    connection.close();
  },

  // TODO: Test
  // Position the bindings for the query. The escape sequence for question mark
  // is \? (e.g. knex.raw("\\?") since javascript requires '\' to be escaped too...)
  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/(\\*)(\?)/g, (match, escapes) => {
      return '?';
    });
  },

  setSchemaSearchPath(connection, searchPath) {
    const path = (searchPath || this.searchPath);

    if (!path) return Promise.resolve(true);

    return new Promise((resolver, rejecter) => {
      connection.query(`set search_path to ${path}`, function(err) {
        if (err) return rejecter(err);
        resolver(true);
      });
    });
  },

  _stream(connection, obj, stream, options) {
    return new Promise((resolver, rejecter) => {
      stream.on('error', rejecter);
      stream.on('end', resolver);

      // Temporary solution. Use connection.queryStream() when next ibm_db version is released; currently on 1.01
      const queryStream = Db2QueryStream(connection, obj.sql, obj.bindings, options);
      queryStream.pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };

    return new Promise((resolver, rejecter) => {
      const method = obj.method || obj.sql.split(' ')[0];

      if (method === 'select' || method === 'first' || method === 'pluck') {
        return connection.query(obj.sql, obj.bindings, (err, rows) => {
          if (err) return rejecter(err);
          obj.response = {
            rows,
            rowCount: rows.length
          };
          resolver(obj);
        });
      }

      connection.prepare(obj.sql, (err, statement) => {
        if (err) return rejecter(err);
        statement.executeNonQuery(obj.bindings, (err, numRowsAffected) => {
          if (err) return rejecter(err);
          obj.response = {
            rowCount: numRowsAffected
          };
          resolver(obj);
        });
      });
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse(obj, runner) {
    if (obj === null) return;

    const resp = obj.response;
    const method = obj.method;
    const rows = resp.rows;

    if (obj.output) return obj.output.call(runner, resp);

    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        if (method === 'pluck') return map(rows, obj.pluck)
        return method === 'first' ? rows[0] : rows
      }
      case 'insert':
      case 'del':
      case 'update':
      case 'counter':
        return resp.rowCount
      default:
        return resp;
    }
  }
});
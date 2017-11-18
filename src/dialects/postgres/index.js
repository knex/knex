
// PostgreSQL
// -------
import { assign, map, extend, isArray, isString, includes } from 'lodash'
import inherits from 'inherits';
import Client from '../../client';
import Promise from 'bluebird';
import {warn} from '../../helpers';

import QueryCompiler from './query/compiler';
import ColumnCompiler from './schema/columncompiler';
import TableCompiler from './schema/tablecompiler';
import SchemaCompiler from './schema/compiler';
import {makeEscape} from '../../query/string'

function Client_PG(config) {
  Client.apply(this, arguments);
  if (config.returning) {
    this.defaultReturning = config.returning;
  }

  if (config.searchPath) {
    this.searchPath = config.searchPath;
  }

  if (config.version) {
    this.version = config.version;
  }
}
inherits(Client_PG, Client);

assign(Client_PG.prototype, {

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

  dialect: 'postgresql',

  driverName: 'pg',

  _driver() {
    return require('pg')
  },

  _escapeBinding: makeEscape({
    escapeArray(val, esc) {
      return esc(arrayString(val, esc))
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
    escapeObject(val, prepareValue, timezone, seen = []) {
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

  wrapIdentifierImpl(value) {
    if (value === '*') return value;
    const matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifierImpl(matched[1]) + matched[2];
    return `"${value.replace(/"/g, '""')}"`;
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this;
    return new Promise(function(resolver, rejecter) {
      const connection = new client.driver.Client(client.connectionSettings);
      connection.connect(function(err, connection) {
        if (err) {
          return rejecter(err);
        }
        connection.on('error', (err) => {
          connection.__knex__disposed = err
        })
        connection.on('end', (err) => {
          connection.__knex__disposed = err || 'Connection ended unexpectedly';
        })
        if (!client.version) {
          return client.checkVersion(connection).then(function(version) {
            client.version = version;
            resolver(connection);
          });
        }
        resolver(connection);
      });
    }).tap(function setSearchPath(connection) {
      return client.setSchemaSearchPath(connection);
    });
  },

  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection(connection) {
    return Promise.fromCallback(connection.end.bind(connection))
  },

  // In PostgreSQL, we need to do a version check to do some feature
  // checking on the database.
  checkVersion(connection) {
    return new Promise(function(resolver, rejecter) {
      connection.query('select version();', function(err, resp) {
        if (err) return rejecter(err);
        resolver(/^PostgreSQL (.*?)( |$)/.exec(resp.rows[0].version)[1]);
      });
    });
  },

  // Position the bindings for the query. The escape sequence for question mark
  // is \? (e.g. knex.raw("\\?") since javascript requires '\' to be escaped too...)
  positionBindings(sql) {
    let questionCount = 0;
    return sql.replace(/(\\*)(\?)/g, function (match, escapes) {
      if (escapes.length % 2) {
        return '?';
      } else {
        questionCount++;
        return `$${questionCount}`;
      }
    });
  },

  setSchemaSearchPath(connection, searchPath) {
    let path = (searchPath || this.searchPath);

    if (!path) return Promise.resolve(true);

    if(!isArray(path) && !isString(path)) {
      throw new TypeError(`knex: Expected searchPath to be Array/String, got: ${typeof path}`);
    }

    if(isString(path)) {
      if(includes(path, ',')) {
        const parts = path.split(',');
        const arraySyntax = `[${map(parts, (searchPath) => `'${searchPath}'`).join(', ')}]`;
        warn(
          `Detected comma in searchPath "${path}".`
          +
          `If you are trying to specify multiple schemas, use Array syntax: ${arraySyntax}`);
      }
      path = [path];
    }

    path = map(path, (schemaName) => `"${schemaName}"`).join(',');

    return new Promise(function(resolver, rejecter) {
      connection.query(`set search_path to ${path}`, function(err) {
        if (err) return rejecter(err);
        resolver(true);
      });
    });
  },

  _stream(connection, obj, stream, options) {
    const PGQueryStream = process.browser ? undefined : require('pg-query-stream');
    const sql = obj.sql;
    return new Promise(function(resolver, rejecter) {
      const queryStream = connection.query(new PGQueryStream(sql, obj.bindings, options));
      queryStream.on('error', function(error) { stream.emit('error', error); });
      // 'error' is not propagated by .pipe, but it breaks the pipe
      stream.on('error', function(error) {
        // Ensure the queryStream is closed so the connection can be released.
        queryStream.close();
        rejecter(error);
      });
      // 'end' IS propagated by .pipe, by default
      stream.on('end', resolver);
      queryStream.pipe(stream);
    });
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    let sql = obj.sql;
    if (obj.options) sql = extend({text: sql}, obj.options);
    return new Promise(function(resolver, rejecter) {
      connection.query(sql, obj.bindings, function(err, response) {
        if (err) return rejecter(err);
        obj.response = response;
        resolver(obj);
      });
    });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse(obj, runner) {
    const resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    if (obj.method === 'raw') return resp;
    const { returning } = obj;
    if (resp.command === 'SELECT') {
      if (obj.method === 'first') return resp.rows[0];
      if (obj.method === 'pluck') return map(resp.rows, obj.pluck);
      return resp.rows;
    }
    if (returning) {
      const returns = [];
      for (let i = 0, l = resp.rows.length; i < l; i++) {
        const row = resp.rows[i];
        if (returning === '*' || Array.isArray(returning)) {
          returns[i] = row;
        } else {
          returns[i] = row[returning];
        }
      }
      return returns;
    }
    if (resp.command === 'UPDATE' || resp.command === 'DELETE') {
      return resp.rowCount;
    }
    return resp;
  }

})

function arrayString(arr, esc) {
  let result = '{'
  for (let i = 0 ; i < arr.length; i++) {
    if (i > 0) result += ','
    const val = arr[i]
    if (val === null || typeof val === 'undefined') {
      result += 'NULL'
    } else if (Array.isArray(val)) {
      result += arrayString(val, esc)
    } else if (typeof val === 'number') {
      result += val
    } else {
      result += JSON.stringify(typeof val === 'string' ? val : esc(val))
    }
  }
  return result + '}'
}

export default Client_PG

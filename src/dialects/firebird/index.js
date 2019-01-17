// Firebird Client
// -------
'use strict';

import inherits from 'inherits';

import Client from '../../client';
import Promise from 'bluebird';

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import SchemaCompiler from './schema/compiler';
import TableCompiler from './schema/tablecompiler';
import ColumnCompiler from './schema/columncompiler';
import Formatter from './formatter';

import { assign, map, isObject, isFunction, each, upperCase } from 'lodash';
import { makeEscape } from '../../query/string';

function ab2str(arrayBuffer) {
  return String.fromCharCode.apply(null, new global.Uint16Array(arrayBuffer));
}

function str2ab(str) {
  const buf = new global.ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new global.Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
}

function parseResults(results) {
  if (Array.isArray(results)) {
    results = map(results, function(item) {
      return parseResults(item);
    });
  } else if (
    isObject(results) &&
    isFunction(results.toJSON) &&
    upperCase(results.toJSON().type) === 'BUFFER'
  ) {
    results = ab2str(results);
  } else if (isObject(results)) {
    each(results, function(value, key) {
      results[key] = parseResults(value);
    });
  }

  return results;
}

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_Firebird(config) {
  Client.call(this, config);
}
inherits(Client_Firebird, Client);

assign(Client_Firebird.prototype, {
  dialect: 'firebird',

  driverName: 'node-firebird',

  _driver() {
    return require('node-firebird');
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

  formatter() {
    return new Formatter(this, ...arguments);
  },

  wrapIdentifierImpl(value) {
    if (value === '*') return value;
    const matched = value.match(/(.*?)(\[[0-9]\])/);
    if (matched) return this.wrapIdentifierImpl(matched[1]) + matched[2];
    return ('' + value + '').toUpperCase();
  },
  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this;
    const driver = client.driver;
    const connectionSettings = client.connectionSettings;

    return new Promise((resolver, rejecter) => {
      driver.attach(connectionSettings, (err, db) => {
        if (err) return rejecter(err);
        db.on('error', connectionErrorHandler.bind(null, client, db));
        db.on('end', connectionErrorHandler.bind(null, client, db));
        resolver(db);
      });
    });
  },
  // Used to explicitly close a connection, called internally by the pool
  // when a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection, cb) {
    if (typeof cb.detach === 'function') {
      cb.detach();
    }
  },
  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new Promise((resolver, rejecter) => {
      const sql = obj.sql;
      if (!sql) return resolver();

      connection.query(sql, obj.bindings, (err, rows, fields) => {
        if (err) return rejecter(err);
        obj.response = [rows, fields, obj.bindings];
        resolver(obj);
      });
    });
  },
  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response, method } = obj;
    let rows = response[0];
    const fields = response[1];
    const bindings = response[2];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (method === 'pluck') {
          return parseResults(map(rows, obj.pluck));
        }

        return parseResults(method === 'first' ? rows[0] : rows);
      case 'insert':
      case 'del':
      case 'update':
        if (rows && obj.returning) {
          return [rows[obj.returning]];
        }

        if (rows && rows.affectedRows) {
          rows.affectedRows;
        } else if (!rows) {
          // Firebird affectedRows not implemented
          rows = {
            affectedRows: [0],
          };
        }
        return rows.affectedRows;
      case 'counter':
        if (rows && rows.affectedRows) {
          rows.affectedRows;
        } else {
          rows.affectedRows = [0];
        }
        return rows.affectedRows;
      default:
        response[0] = parseResults(response[0]);
        return response;
    }
  },
  ping: function ping(resource, callback) {
    resource.query('select 1 from rdb$database', callback);
  },
});

// Firebird Specific error handler
function connectionErrorHandler(client, connection, err) {
  if (connection && err && err.fatal) {
    if (connection.__knex__disposed) return;
    connection.__knex__disposed = true;
    client.pool.destroy(connection);
  }
}

export default Client_Firebird;

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

import { assign, map } from 'lodash';
import { makeEscape } from '../../query/string';

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
    return '' + value.replace(/"/g, '""') + '';
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
    const rows = response[0];
    const fields = response[1];
    const bindings = response[2];
    if (obj.output) return obj.output.call(runner, rows, fields);
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (method === 'pluck') return map(rows, obj.pluck);
        return method === 'first' ? rows[0] : rows;
      case 'insert':
        return bindings;
      case 'del':
      case 'update':
      case 'counter':
        if (rows && rows.affectedRows) {
          rows.affectedRows;
        } else {
          rows.affectedRows = [0];
        }
        return rows.affectedRows;
      default:
        return bindings;
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

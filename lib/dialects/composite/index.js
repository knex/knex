'use strict';

var inherits = require('inherits');
var assign = require('lodash/object/assign');

var Client = require('../../client');
var PG_Client = require('../postgres');

// The base client provides the general structure
// for a dialect specific client object.
function Composite_Client() {
  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  this.pgclient = new PG_Client(config);
}
inherits(Composite_Client, Client);

assign(Composite_Client.prototype, {

  formatter: function formatter() {
    return this.pgclient.formatter();
  },

  queryBuilder: function queryBuilder() {
    return this.pgclient.queryBuilder();
  },

  queryCompiler: function queryCompiler(builder) {
    return this.pgclient.queryBuilder(builder);
  },

  schemaBuilder: function schemaBuilder() {
    return this.pgclient.schemaBuilder();
  },

  schemaCompiler: function schemaCompiler(builder) {
    return this.pgclient.schemaCompiler(builder);
  },

  tableBuilder: function tableBuilder(type, tableName, fn) {
    return this.pgclient.tableBuilder(type, tableName, fn);
  },

  tableCompiler: function tableCompiler(tableBuilder) {
    return this.pgclient.tableCompiler(tableBuilder);
  },

  columnBuilder: function columnBuilder(tableBuilder, type, args) {
    return this.pgclient.columnCompiler(tableBuilder, type, args);
  },

  columnCompiler: function columnCompiler(tableBuilder, columnBuilder) {
    return this.pgclient.columnCompiler(tableBuilder, columnBuilder);
  },

  runner: function runner(connection) {
    return this.pgclient.runner(connection);
  },

  transaction: function transaction(container, config, outerTx) {
    return this.pgclient.transaction(container, config, outerTx);
  },

  raw: function raw() {
    return this.pgclient.raw(arguments);
  },

  query: function query(connection, obj) {
    return this.pgclient.query(connection, obj);
  },

  stream: function stream(connection, obj, _stream, options) {
    return this.pgclient.stream(connection, obj, _stream, options);
  },

  prepBindings: function prepBindings(bindings) {
    return this.pgclient.prepBindings(bindings);
  },

  wrapIdentifier: function wrapIdentifier(value) {
    return this.pgclient.wrapIdentifier(value);
  },

  initializeDriver: function initializeDriver() {
    return this.pgclient.initializeDriver();
  },

  initializePool: function initializePool(config) {
    return this.pgclient.initializePool(config);
  },

  poolDefaults: function poolDefaults(poolConfig) {
    return this.pgclient.pollDefaults(poolConfig);
  },

  // Acquire a connection from the pool.
  acquireConnection: function acquireConnection() {
    return this.pgclient.acquireConnection();
  },

  // Releases a connection back to the connection pool,
  // returning a promise resolved when the connection is released.
  releaseConnection: function releaseConnection(connection) {
    return this.pgclient.releaseConnection(connection);
  },

  // Destroy the current connection pool for the client.
  destroy: function destroy(callback) {
    return this.pgclient.destroy(callback);
  },

  // Return the database being used by this client.
  database: function database() {
    return this.pgclient.database();
  },

  toString: function toString() {
    return '[object KnexCompositeClient]';
  }

});

module.exports = Composite_Client;
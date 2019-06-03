// Redshift
// -------
const inherits = require('inherits');
const Client_PG = require('../postgres');
const { assign, map } = require('lodash');

const Transaction = require('./transaction');
const QueryCompiler = require('./query/compiler');
const ColumnBuilder = require('./schema/columnbuilder');
const ColumnCompiler = require('./schema/columncompiler');
const TableCompiler = require('./schema/tablecompiler');
const SchemaCompiler = require('./schema/compiler');

function Client_Redshift(config) {
  Client_PG.apply(this, arguments);
}
inherits(Client_Redshift, Client_PG);

assign(Client_Redshift.prototype, {
  transaction() {
    return new Transaction(this, ...arguments);
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments);
  },

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  },

  dialect: 'redshift',

  driverName: 'pg-redshift',

  _driver() {
    return require('pg');
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse(obj, runner) {
    const resp = obj.response;
    if (obj.output) return obj.output.call(runner, resp);
    if (obj.method === 'raw') return resp;
    if (resp.command === 'SELECT') {
      if (obj.method === 'first') return resp.rows[0];
      if (obj.method === 'pluck') return map(resp.rows, obj.pluck);
      return resp.rows;
    }
    if (
      resp.command === 'INSERT' ||
      resp.command === 'UPDATE' ||
      resp.command === 'DELETE'
    ) {
      return resp.rowCount;
    }
    return resp;
  },
});

module.exports = Client_Redshift;

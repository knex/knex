// Redshift
// -------
const Client_PG = require('../postgres');
const map = require('lodash/map');

const Transaction = require('./transaction');
const QueryCompiler = require('./query/redshift-querycompiler');
const ColumnBuilder = require('./schema/redshift-columnbuilder');
const ColumnCompiler = require('./schema/redshift-columncompiler');
const TableCompiler = require('./schema/redshift-tablecompiler');
const SchemaCompiler = require('./schema/redshift-compiler');
const ViewCompiler = require('./schema/redshift-viewcompiler');

class Client_Redshift extends Client_PG {
  transaction() {
    return new Transaction(this, ...arguments);
  }

  queryCompiler(builder, formatter) {
    return new QueryCompiler(this, builder, formatter);
  }

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler(this, ...arguments);
  }

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments);
  }

  viewCompiler() {
    return new ViewCompiler(this, ...arguments);
  }

  _driver() {
    return require('pg');
  }

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
  }

  toPathForJson(jsonPath, builder, bindingsHolder) {
    return jsonPath
      .replace(/^(\$\.)/, '') // remove the first dollar
      .split('.')
      .map(
        function (v) {
          return this.parameter(v, builder, bindingsHolder);
        }.bind(this)
      )
      .join(', ');
  }
}

Object.assign(Client_Redshift.prototype, {
  dialect: 'redshift',

  driverName: 'pg-redshift',
});

module.exports = Client_Redshift;

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

/**
 * @typedef {Object} RedshiftResponse
 * @property {string} command
 * @property {any[]} rows
 * @property {number} rowCount
 *
 * @typedef {never} RedshiftContext
 *
 * @typedef {import('../../query/querycompiler').ProcessResponseQueryObject<RedshiftResponse, RedshiftContext>} QueryObject
 */

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

  /**
   * Ensures the response is returned in the same format as other clients.
   *
   * @param {QueryObject} query
   * @returns {any}
   */
  processResponse(query) {
    const resp = query.response;
    if (query.method === 'raw') return resp;
    if (resp.command === 'SELECT') {
      if (query.method === 'first') return resp.rows[0];
      if (query.method === 'pluck') return map(resp.rows, query.pluck);
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

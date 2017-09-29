
// Redshift
// -------
import inherits from 'inherits';
import Client_PG from '../postgres';
import { assign, extend, flatten, map, reverse, values } from 'lodash'
import Promise from 'bluebird';

import * as helpers from '../../helpers';
import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import ColumnBuilder from './schema/columnbuilder';
import ColumnCompiler from './schema/columncompiler';
import TableCompiler from './schema/tablecompiler';
import SchemaCompiler from './schema/compiler';

function Client_Redshift(config) {
  Client_PG.apply(this, arguments)
}
inherits(Client_Redshift, Client_PG)

assign(Client_Redshift.prototype, {
  transaction() {
    return new Transaction(this, ...arguments)
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments)
  },

  columnBuilder() {
    return new ColumnBuilder(this, ...arguments);
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments)
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments)
  },

  schemaCompiler() {
    return new SchemaCompiler(this, ...arguments)
  },
  
  dialect: 'redshift',

  driverName: 'pg-redshift',

  _driver() {
    return require('pg')
  },

  // Runs the query on the specified connection, providing the bindings
  // and any other necessary prep work.
  _query(connection, obj) {
    // TODO: if deleting with returning, flip the order of delete and returning queries
    const that = this;
    let sql = obj.sql = that.positionBindings(obj.sql)
    if (obj.options) sql = extend({text: sql}, obj.options);
    return new Promise(function(resolver, rejecter) {
      connection.query(sql, obj.bindings, function(err, response) {
        if (err) { return rejecter(err); }
        obj.response = response;
        if (!obj.returning) { return resolver(obj); }
        const retSql = obj.returningSql(obj.returning);
        if (retSql.bindings && retSql.bindings.length > 0){
          retSql.sql = that.positionBindings(retSql.sql);
        }
        return connection.query(retSql.sql, retSql.bindings, function(err, response) {
          if (err) { return rejecter(err); }
          obj.response = response;
          return resolver(obj);
        });
      });
    });
  },

  // Process the response as returned from the query.
  processResponse(obj, runner) {
    if (obj == null) return;
    const { response } = obj
    const { method, output, pluck, returning } = obj
    if (output) { return output.call(runner, response); }
    if (method === 'raw') return response;
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first':
        if (method === 'pluck') return map(response.rows, pluck)
        return method === 'first' ? response.rows[0] : response.rows
      case 'insert':
      case 'update':
      case 'del':
      case 'counter':
        if (returning) {
          if ((Array.isArray(returning) && returning.length > 1) || returning[0] === '*') {
            return response.rows;
          }
          // return an array with values if only one returning value was specified
          return reverse(flatten(map(response.rows, values)));
        }
        return (method === "insert") ? response.rows : response.rowCount;
      default:
        return response
    }
  },
})

export default Client_Redshift;

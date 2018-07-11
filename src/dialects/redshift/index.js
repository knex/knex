// Redshift
// -------
import { Client_PG } from '../postgres';
import { map } from 'lodash';

import { Redshift_Transaction } from './transaction';
import { QueryCompiler_Redshift } from './query/compiler';
import { ColumnBuilder_Redshift } from './schema/columnbuilder';
import { ColumnCompiler_Redshift } from './schema/columncompiler';
import { TableCompiler_Redshift } from './schema/tablecompiler';
import { SchemaCompiler_Redshift } from './schema/compiler';

export class Client_Redshift extends Client_PG {
  transaction() {
    return new Redshift_Transaction(this, ...arguments);
  }

  queryCompiler() {
    return new QueryCompiler_Redshift(this, ...arguments);
  }

  columnBuilder() {
    return new ColumnBuilder_Redshift(this, ...arguments);
  }

  columnCompiler() {
    return new ColumnCompiler_Redshift(this, ...arguments);
  }

  tableCompiler() {
    return new TableCompiler_Redshift(this, ...arguments);
  }

  schemaCompiler() {
    return new SchemaCompiler_Redshift(this, ...arguments);
  }

  dialect = 'redshift';

  driverName = 'pg-redshift';

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
}

export default Client_Redshift;


// Redshift
// -------
import inherits from 'inherits';
import Client_PG from '../postgres';
import { assign } from 'lodash'

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
})

export default Client_Redshift;

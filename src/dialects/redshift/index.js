
// Redshift
// -------
import inherits from 'inherits';
import Client_PG from '../postgres';
import { assign } from 'lodash'

import Transaction from './transaction';
import QueryCompiler from './query/compiler';
import ColumnCompiler from './schema/columncompiler';
import TableCompiler from './schema/tablecompiler';

function Client_Redshift(config) {
  Client_PG.call(this, config)
}
inherits(Client_Redshift, Client_PG)

assign(Client_Redshift.prototype, {
  transaction() {
    return new Transaction(this, ...arguments)
  },

  queryCompiler() {
    return new QueryCompiler(this, ...arguments)
  },

  columnCompiler() {
    return new ColumnCompiler(this, ...arguments)
  },

  tableCompiler() {
    return new TableCompiler(this, ...arguments)
  },
  
  dialect: 'redshift'
})

export default Client_Redshift;

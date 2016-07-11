
// Redshift Client
// -------
import inherits from 'inherits';
import Client_PG from '../postgres';
import { assign } from 'lodash'

import QueryCompiler from './query/compiler';
import ColumnCompiler from './schema/columncompiler';
import TableCompiler from './schema/tablecompiler';

function Client_Redshift(config) {
  Client_PG.call(this, config)
}
inherits(Client_Redshift, Client_PG)

assign(Client_Redshift.prototype, {
  QueryCompiler,

  ColumnCompiler,

  TableCompiler,
  
  dialect: 'redshift'
})

export default Client_Redshift;

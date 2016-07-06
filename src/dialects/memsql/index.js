
// memsql Client
// -------
import inherits from 'inherits'
import { assign } from 'lodash'

import Client_MySQL2 from '../mysql2'
import ColumnBuilder from './schema/columnbuilder'
import ColumnCompiler from './schema/columncompiler'
import QueryCompiler from './query/compiler'

function Client_MemSQL(config) {
  Client_MySQL2.call(this, config)
}
inherits(Client_MemSQL, Client_MySQL2)

assign(Client_MemSQL.prototype, {

  driverName: 'memsql',

  ColumnBuilder,

  ColumnCompiler,

  QueryCompiler,

})

export default Client_MemSQL


import inherits from 'inherits'
import { assign } from 'lodash'

import QueryCompiler from '../../mysql/query/compiler'

function QueryCompiler_MemSQL(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_MemSQL, QueryCompiler)

assign(QueryCompiler_MemSQL.prototype, {

  // no select ... for update
  forUpdate() {
    return '';
  },

})

export default QueryCompiler_MemSQL

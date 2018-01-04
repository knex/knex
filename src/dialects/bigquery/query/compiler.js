
// BigQuery Query Compiler
// ------
import inherits from 'inherits';
import QueryCompiler from '../../../query/compiler';

import { assign } from 'lodash'

function QueryCompiler_BigQuery(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_BigQuery, QueryCompiler)

assign(QueryCompiler_BigQuery.prototype, {

  insert() {
    throw new Error("insert not supported by BigQuery");
  },

  update() {
    throw new Error("update not supported by BigQuery");
  },

  del() {
    throw new Error("del not supported by BigQuery");
  },

  columnInfo() {
    throw new Error("columnInfo not supported by BigQuery");
  }

})

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
export default QueryCompiler_BigQuery;

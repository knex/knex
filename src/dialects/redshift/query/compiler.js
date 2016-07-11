
// Redshift Query Builder & Compiler
// ------
import inherits from 'inherits';

import QueryCompiler_PG from '../../postgres/query/compiler';

import { assign } from 'lodash'

function QueryCompiler_Redshift(client, builder) {
  QueryCompiler_PG.call(this, client, builder);
}
inherits(QueryCompiler_Redshift, QueryCompiler_PG);

assign(QueryCompiler_Redshift.prototype, {
  _returning(value) {
    return '';
  }
})

export default QueryCompiler_Redshift;

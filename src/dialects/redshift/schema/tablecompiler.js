/* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

import { warn } from '../../../helpers';
import inherits from 'inherits';
import TableCompiler_PG from '../../postgres/schema/tablecompiler';

function TableCompiler_Redshift() {
  TableCompiler_PG.apply(this, arguments);
}
inherits(TableCompiler_Redshift, TableCompiler_PG);

TableCompiler_Redshift.prototype.index = function(columns, indexName, indexType) {
  warn('Redshift does not support the creation of indexes.');
};
TableCompiler_Redshift.prototype.dropIndex = function(columns, indexName) {
  warn('Redshift does not support the deletion of indexes.');
};

export default TableCompiler_Redshift;

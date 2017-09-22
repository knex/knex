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

TableCompiler_Redshift.prototype.primary = function(columns, constraintName) {
	// What this actually needs to do is warn if the columns are nullable, and do nothing...
  constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
  if (columns.constructor !== Array){
    columns = [columns];
  }
  for (let i = 0; i < columns.length; i++){
    this.pushQuery(`alter table ${this.tableName()} alter column ${this.formatter.columnize(columns[i])} set not null`);
  }
  this.pushQuery(`alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(columns)})`);
};

export default TableCompiler_Redshift;

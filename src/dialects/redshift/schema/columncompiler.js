
// Redshift Column Compiler
// -------

import inherits from 'inherits';
import ColumnCompiler_PG from '../../postgres/schema/columncompiler';

import { assign } from 'lodash'

function ColumnCompiler_Redshift() {
  ColumnCompiler_PG.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment']
}
inherits(ColumnCompiler_Redshift, ColumnCompiler_PG);

assign(ColumnCompiler_Redshift.prototype, {
  bigincrements: 'bigint identity(1,1) primary key not null',
  binary: 'varchar(max)',
  bit(column) {
    return column.length !== false ? `char(${column.length})` : 'char(1)';
  },
  blob: 'varchar(max)',
  datetime: 'timestamp',
  enu: 'text',
  enum: 'text',
  increments: 'integer identity(1,1) primary key not null',
  json: 'varchar(max)',
  jsonb: 'varchar(max)',
  longblob: 'varchar(max)',
  mediumblob: 'varchar(max)',
  set: 'text',
  text: 'varchar(max)',
  timestamp: 'timestamp',
  tinyblob: 'text',
  uuid: 'char(32)',
  varbinary: 'varchar(max)'
})

export default ColumnCompiler_Redshift;

// DB2 Column Compiler
// -------

import inherits from 'inherits';
import ColumnCompiler from '../../../schema/columncompiler';
import * as helpers from '../../../helpers';

import { assign } from 'lodash'

function ColumnCompiler_DB2() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment']
}
inherits(ColumnCompiler_DB2, ColumnCompiler);

assign(ColumnCompiler_DB2.prototype, {

  // Types
  // ------
  bigincrements: 'bigint not null generated always as identity (start with 1 increment by 1) primary key',
  bigint: 'bigint',
  binary: 'varbinary(255)',

  bit(column) {
    return column.length !== false ? `bit(${column.length})` : 'bit';
  },

  bool: 'smallint',

  // Create the column definition for an enum type.
  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
  enu(allowed) {
    return `text check (${this.formatter.wrap(this.args[0])} in ('${allowed.join("', '")}'))`;
  },

  double: 'double precision',
  floating: 'real',
  text: 'varchar(255)',
  increments: 'int not null generated always as identity (start with 1 increment by 1) primary key',
  json(jsonb) {
    if (jsonb) helpers.deprecate('json(true)', 'jsonb()')
    return jsonColumn(this.client, jsonb);
  },
  jsonb() {
    return jsonColumn(this.client, true);
  },
  smallint: 'smallint',
  tinyint:  'smallint',
  datetime: 'date',
  date: 'date',
  timestamp: 'timestamp',
  // Modifiers:
  // ------
  comment(comment) {
    this.pushAdditional(function() {
      this.pushQuery(`comment on column ${this.tableCompiler.tableName()}.` +
        this.formatter.wrap(this.args[0]) + " is " + (comment ? `'${comment}'` : 'NULL'));
    }, comment);
  }

})

function jsonColumn(client, jsonb) {
  if (!client.version || parseFloat(client.version) >= 9.2) return jsonb ? 'jsonb' : 'json';
  return 'text';
}

export default ColumnCompiler_DB2;

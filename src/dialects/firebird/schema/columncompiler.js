// Firebird Column Compiler
// -------
import inherits from 'inherits';
import ColumnCompiler from '../../../schema/columncompiler';

import { assign } from 'lodash';

function ColumnCompiler_Firebird() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [
    'unsigned',
    'nullable',
    'defaultTo',
    'first',
    'after',
    'comment',
  ];
}
inherits(ColumnCompiler_Firebird, ColumnCompiler);

// Types
// ------

assign(ColumnCompiler_Firebird.prototype, {
  increments: 'int not null primary key',

  bigincrements: 'bigint not null primary key',

  bigint: 'bigint',

  double(precision, scale) {
    if (!precision) return 'double';
    return `double(${this._num(precision, 8)}, ${this._num(scale, 2)})`;
  },

  integer: function integer(length) {
    length = length ? `(${this._num(length, 11)})` : '';
    return `int${length}`;
  },

  mediumint: 'mediumint',

  smallint: 'smallint',

  tinyint(length) {
    length = length ? `(${this._num(length, 1)})` : '';
    return `tinyint${length}`;
  },

  text(column) {
    switch (column) {
      case 'medium':
      case 'mediumtext':
        return 'mediumtext';
      case 'long':
      case 'longtext':
        return 'longtext';
      default:
        return 'text';
    }
  },

  mediumtext() {
    return this.text('medium');
  },

  longtext() {
    return this.text('long');
  },

  enu: 'varchar(100)',

  datetime: 'datetime',

  timestamp: 'timestamp',

  time: 'time',

  bit: 'char(1)',

  binary(length) {
    return length ? `char(${this._num(length)})` : 'blob sub_type text';
  },

  // Modifiers
  // ------

  defaultTo(value) {
    const defaultVal = ColumnCompiler_Firebird.super_.prototype.defaultTo.apply(
      this,
      arguments
    );
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  unsigned() {
    return '';
  },

  first() {
    this.client.logger.warn('Column first modifier not available for Firebird');
    return '';
  },

  after(column) {
    this.client.logger.warn('Column after modifier not available for Firebird');
    return '';
  },

  comment(comment) {
    this.client.logger.warn(
      'Column comment modifier not available for Firebird'
    );
    return '';
  },

  varchar(length) {
    return 'varchar(' + this._num(length, 255) + ')  CHARACTER SET UTF8';
  },
});

export default ColumnCompiler_Firebird;

// MySQL Column Compiler
// -------
import inherits from 'inherits';
import ColumnCompiler from '../../../schema/columncompiler';

import { assign } from 'lodash';

function supportsPreciseTimestamps(client) {
  if (!client.version) {
    const message =
      'To get rid of this warning you should specify the mysql dialect version in ' +
      'your knex configuration. Currently this defaults to 5.5, but in a future ' +
      'release it will default to 5.6 which supports high precision timestamps. ' +
      'See http://knexjs.org/#Schema-timestamps for more information.';
    client.logger.warn(message);
  }

  return client.version && parseFloat(client.version) > 5.5;
}

function ColumnCompiler_MySQL() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = [
    'unsigned',
    'nullable',
    'defaultTo',
    'comment',
    'collate',
    'first',
    'after',
  ];
}
inherits(ColumnCompiler_MySQL, ColumnCompiler);

// Types
// ------

assign(ColumnCompiler_MySQL.prototype, {
  increments: 'int unsigned not null auto_increment primary key',

  bigincrements: 'bigint unsigned not null auto_increment primary key',

  bigint: 'bigint',

  double(precision, scale) {
    if (!precision) return 'double';
    return `double(${this._num(precision, 8)}, ${this._num(scale, 2)})`;
  },

  integer(length) {
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

  enu(allowed) {
    return `enum('${allowed.join("', '")}')`;
  },

  datetime() {
    return supportsPreciseTimestamps(this.client) ? 'datetime(6)' : 'datetime';
  },

  timestamp() {
    return supportsPreciseTimestamps(this.client)
      ? 'timestamp(6)'
      : 'timestamp';
  },

  bit(length) {
    return length ? `bit(${this._num(length)})` : 'bit';
  },

  binary(length) {
    return length ? `varbinary(${this._num(length)})` : 'blob';
  },

  json() {
    return 'json';
  },

  // Modifiers
  // ------

  defaultTo(value) {
    const defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(
      this,
      arguments
    );
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  unsigned() {
    return 'unsigned';
  },

  comment(comment) {
    if (comment && comment.length > 255) {
      this.client.logger.warn(
        'Your comment is longer than the max comment length for MySQL'
      );
    }
    return comment && `comment '${comment}'`;
  },

  first() {
    return 'first';
  },

  after(column) {
    return `after ${this.formatter.wrap(column)}`;
  },

  collate(collation) {
    return collation && `collate '${collation}'`;
  },
});

export default ColumnCompiler_MySQL;

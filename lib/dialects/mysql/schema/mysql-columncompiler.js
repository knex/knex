// MySQL Column Compiler
// -------
const ColumnCompiler = require('../../../schema/columncompiler');
const { isObject } = require('../../../util/is');
const { toNumber } = require('../../../util/helpers');

const commentEscapeRegex = /(?<!\\)'/g;

class ColumnCompiler_MySQL extends ColumnCompiler {
  constructor(client, tableCompiler, columnBuilder) {
    super(client, tableCompiler, columnBuilder);
    this.modifiers = [
      'unsigned',
      'nullable',
      'defaultTo',
      'comment',
      'collate',
      'first',
      'after',
    ];
    this._addCheckModifiers();
  }

  // Types
  // ------

  double(precision, scale) {
    if (!precision) return 'double';
    return `double(${toNumber(precision, 8)}, ${toNumber(scale, 2)})`;
  }

  integer(length) {
    length = length ? `(${toNumber(length, 11)})` : '';
    return `int${length}`;
  }

  tinyint(length) {
    length = length ? `(${toNumber(length, 1)})` : '';
    return `tinyint${length}`;
  }

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
  }

  mediumtext() {
    return this.text('medium');
  }

  longtext() {
    return this.text('long');
  }

  enu(allowed) {
    return `enum('${allowed.join("', '")}')`;
  }

  datetime(precision) {
    if (isObject(precision)) {
      ({ precision } = precision);
    }

    return typeof precision === 'number'
      ? `datetime(${precision})`
      : 'datetime';
  }

  timestamp(precision) {
    if (isObject(precision)) {
      ({ precision } = precision);
    }

    return typeof precision === 'number'
      ? `timestamp(${precision})`
      : 'timestamp';
  }

  time(precision) {
    if (isObject(precision)) {
      ({ precision } = precision);
    }

    return typeof precision === 'number' ? `time(${precision})` : 'time';
  }

  bit(length) {
    return length ? `bit(${toNumber(length)})` : 'bit';
  }

  binary(length) {
    return length ? `varbinary(${toNumber(length)})` : 'blob';
  }

  json() {
    return 'json';
  }

  jsonb() {
    return 'json';
  }

  // Modifiers
  // ------

  defaultTo(value) {
    // MySQL defaults to null by default, but breaks down if you pass it explicitly
    // Note that in MySQL versions up to 5.7, logic related to updating
    // timestamps when no explicit value is passed is quite insane - https://dev.mysql.com/doc/refman/5.7/en/server-system-variables.html#sysvar_explicit_defaults_for_timestamp
    if (value === null || value === undefined) {
      return;
    }
    if ((this.type === 'json' || this.type === 'jsonb') && isObject(value)) {
      // Default value for json will work only it is an expression
      return `default ('${JSON.stringify(value)}')`;
    }
    const defaultVal = super.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  }

  unsigned() {
    return 'unsigned';
  }

  comment(comment) {
    if (comment && comment.length > 255) {
      this.client.logger.warn(
        'Your comment is longer than the max comment length for MySQL'
      );
    }
    return comment && `comment '${comment.replace(commentEscapeRegex, "\\'")}'`;
  }

  first() {
    return 'first';
  }

  after(column) {
    return `after ${this.formatter.wrap(column)}`;
  }

  collate(collation) {
    return collation && `collate '${collation}'`;
  }

  checkRegex(regex, constraintName) {
    return this._check(
      `${this.formatter.wrap(
        this.getColumnName()
      )} REGEXP ${this.client._escapeBinding(regex)}`,
      constraintName
    );
  }

  increments(options = { primaryKey: true }) {
    return (
      'int unsigned not null' +
      // In MySQL autoincrement are always a primary key. If you already have a primary key, we
      // initialize this column as classic int column then modify it later in table compiler
      (this.tableCompiler._canBeAddPrimaryKey(options)
        ? ' auto_increment primary key'
        : '')
    );
  }

  bigincrements(options = { primaryKey: true }) {
    return (
      'bigint unsigned not null' +
      // In MySQL autoincrement are always a primary key. If you already have a primary key, we
      // initialize this column as classic int column then modify it later in table compiler
      (this.tableCompiler._canBeAddPrimaryKey(options)
        ? ' auto_increment primary key'
        : '')
    );
  }
}

ColumnCompiler_MySQL.prototype.bigint = 'bigint';
ColumnCompiler_MySQL.prototype.mediumint = 'mediumint';
ColumnCompiler_MySQL.prototype.smallint = 'smallint';

module.exports = ColumnCompiler_MySQL;

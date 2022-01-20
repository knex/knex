const uniq = require('lodash/uniq');
const Raw = require('../../../raw');
const ColumnCompiler = require('../../../schema/columncompiler');
const {
  createAutoIncrementTriggerAndSequence,
} = require('./internal/incrementUtils');
const { toNumber } = require('../../../util/helpers');

// Column Compiler
// -------

class ColumnCompiler_Oracle extends ColumnCompiler {
  constructor() {
    super(...arguments);
    this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
  }

  increments(options = { primaryKey: true }) {
    createAutoIncrementTriggerAndSequence(this);
    return (
      'integer not null' +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '')
    );
  }

  bigincrements(options = { primaryKey: true }) {
    createAutoIncrementTriggerAndSequence(this);
    return (
      'number(20, 0) not null' +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '')
    );
  }

  floating(precision) {
    const parsedPrecision = toNumber(precision, 0);
    return `float${parsedPrecision ? `(${parsedPrecision})` : ''}`;
  }

  double(precision, scale) {
    // if (!precision) return 'number'; // TODO: Check If default is ok
    return `number(${toNumber(precision, 8)}, ${toNumber(scale, 2)})`;
  }

  decimal(precision, scale) {
    if (precision === null) return 'decimal';
    return `decimal(${toNumber(precision, 8)}, ${toNumber(scale, 2)})`;
  }

  integer(length) {
    return length ? `number(${toNumber(length, 11)})` : 'integer';
  }

  enu(allowed) {
    allowed = uniq(allowed);
    const maxLength = (allowed || []).reduce(
      (maxLength, name) => Math.max(maxLength, String(name).length),
      1
    );

    // implicitly add the enum values as checked values
    this.columnBuilder._modifiers.checkIn = [allowed];

    return `varchar2(${maxLength})`;
  }

  datetime(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  }

  timestamp(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  }

  bool() {
    // implicitly add the check for 0 and 1
    this.columnBuilder._modifiers.checkIn = [[0, 1]];
    return 'number(1, 0)';
  }

  varchar(length) {
    return `varchar2(${toNumber(length, 255)})`;
  }

  // Modifiers
  // ------

  comment(comment) {
    const columnName = this.args[0] || this.defaults('columnName');

    this.pushAdditional(function () {
      this.pushQuery(
        `comment on column ${this.tableCompiler.tableName()}.` +
          this.formatter.wrap(columnName) +
          " is '" +
          (comment || '') +
          "'"
      );
    }, comment);
  }

  checkIn(value) {
    // TODO: Maybe accept arguments also as array
    // TODO: value(s) should be escaped properly
    if (value === undefined) {
      return '';
    } else if (value instanceof Raw) {
      value = value.toQuery();
    } else if (Array.isArray(value)) {
      value = value.map((v) => `'${v}'`).join(', ');
    } else {
      value = `'${value}'`;
    }
    return `check (${this.formatter.wrap(this.args[0])} in (${value}))`;
  }
}

ColumnCompiler_Oracle.prototype.tinyint = 'smallint';
ColumnCompiler_Oracle.prototype.smallint = 'smallint';
ColumnCompiler_Oracle.prototype.mediumint = 'integer';
ColumnCompiler_Oracle.prototype.biginteger = 'number(20, 0)';
ColumnCompiler_Oracle.prototype.text = 'clob';
ColumnCompiler_Oracle.prototype.time = 'timestamp with time zone';
ColumnCompiler_Oracle.prototype.bit = 'clob';
ColumnCompiler_Oracle.prototype.json = 'clob';

module.exports = ColumnCompiler_Oracle;

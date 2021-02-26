// Column Compiler
// Used for designating column definitions
// during the table "create" / "alter" statements.
// -------
const helpers = require('./internal/helpers');
const groupBy = require('lodash/groupBy');
const first = require('lodash/first');
const has = require('lodash/has');
const tail = require('lodash/tail');
const { toNumber } = require('../util/helpers');
const { formatDefault } = require('../formatter/formatterUtils');

class ColumnCompiler {
  constructor(client, tableCompiler, columnBuilder) {
    this.client = client;
    this.tableCompiler = tableCompiler;
    this.columnBuilder = columnBuilder;
    this._commonBuilder = this.columnBuilder;
    this.args = columnBuilder._args;
    this.type = columnBuilder._type.toLowerCase();
    this.grouped = groupBy(columnBuilder._statements, 'grouping');
    this.modified = columnBuilder._modifiers;
    this.isIncrements = this.type.indexOf('increments') !== -1;

    this.formatter = client.formatter(columnBuilder);
    this.bindings = [];
    this.formatter.bindings = this.bindings;
    this.bindingsHolder = this;

    this.sequence = [];
    this.modifiers = [];
  }

  defaults(label) {
    if (Object.prototype.hasOwnProperty.call(this._defaultMap, label)) {
      return this._defaultMap[label].bind(this)();
    } else {
      throw new Error(
        `There is no default for the specified identifier ${label}`
      );
    }
  }

  // To convert to sql, we first go through and build the
  // column as it would be in the insert statement
  toSQL() {
    this.pushQuery(this.compileColumn());
    if (this.sequence.additional) {
      this.sequence = this.sequence.concat(this.sequence.additional);
    }
    return this.sequence;
  }

  // Compiles a column.
  compileColumn() {
    return (
      this.formatter.wrap(this.getColumnName()) +
      ' ' +
      this.getColumnType() +
      this.getModifiers()
    );
  }

  // Assumes the autoincrementing key is named `id` if not otherwise specified.
  getColumnName() {
    const value = first(this.args);
    return value || this.defaults('columnName');
  }

  getColumnType() {
    // Column type is cached so side effects (such as in pg native enums) are only run once
    if (!this._columnType) {
      const type = this[this.type];
      this._columnType =
        typeof type === 'function' ? type.apply(this, tail(this.args)) : type;
    }

    return this._columnType;
  }

  getModifiers() {
    const modifiers = [];

    for (let i = 0, l = this.modifiers.length; i < l; i++) {
      const modifier = this.modifiers[i];

      //Cannot allow 'nullable' modifiers on increments types
      if (!this.isIncrements || (this.isIncrements && modifier === 'comment')) {
        if (has(this.modified, modifier)) {
          const val = this[modifier].apply(this, this.modified[modifier]);
          if (val) modifiers.push(val);
        }
      }
    }

    return modifiers.length > 0 ? ` ${modifiers.join(' ')}` : '';
  }

  // Types
  // ------
  varchar(length) {
    return `varchar(${toNumber(length, 255)})`;
  }

  floating(precision, scale) {
    return `float(${toNumber(precision, 8)}, ${toNumber(scale, 2)})`;
  }

  decimal(precision, scale) {
    if (precision === null) {
      throw new Error(
        'Specifying no precision on decimal columns is not supported for that SQL dialect.'
      );
    }
    return `decimal(${toNumber(precision, 8)}, ${toNumber(scale, 2)})`;
  }

  // Used to support custom types
  specifictype(type) {
    return type;
  }

  // Modifiers
  // -------

  nullable(nullable) {
    return nullable === false ? 'not null' : 'null';
  }

  notNullable() {
    return this.nullable(false);
  }

  defaultTo(value) {
    return `default ${formatDefault(value, this.type, this.client)}`;
  }
}

ColumnCompiler.prototype.binary = 'blob';
ColumnCompiler.prototype.bool = 'boolean';
ColumnCompiler.prototype.date = 'date';
ColumnCompiler.prototype.datetime = 'datetime';
ColumnCompiler.prototype.time = 'time';
ColumnCompiler.prototype.timestamp = 'timestamp';
ColumnCompiler.prototype.enu = 'varchar';
ColumnCompiler.prototype.bit = ColumnCompiler.prototype.json = 'text';
ColumnCompiler.prototype.uuid = 'char(36)';
ColumnCompiler.prototype.increments = ({ primaryKey = true } = {}) =>
  'integer not null' + (primaryKey ? ' primary key' : '') + ' autoincrement';
ColumnCompiler.prototype.bigincrements = ({ primaryKey = true } = {}) =>
  'integer not null' + (primaryKey ? ' primary key' : '') + ' autoincrement';
ColumnCompiler.prototype.integer = ColumnCompiler.prototype.smallint = ColumnCompiler.prototype.mediumint =
  'integer';
ColumnCompiler.prototype.biginteger = 'bigint';
ColumnCompiler.prototype.text = 'text';
ColumnCompiler.prototype.tinyint = 'tinyint';

ColumnCompiler.prototype.pushQuery = helpers.pushQuery;
ColumnCompiler.prototype.pushAdditional = helpers.pushAdditional;
ColumnCompiler.prototype.unshiftQuery = helpers.unshiftQuery;

ColumnCompiler.prototype._defaultMap = {
  columnName: function () {
    if (!this.isIncrements) {
      throw new Error(
        `You did not specify a column name for the ${this.type} column.`
      );
    }
    return 'id';
  },
};

module.exports = ColumnCompiler;

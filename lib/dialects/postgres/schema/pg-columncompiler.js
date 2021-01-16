// PostgreSQL Column Compiler
// -------

const ColumnCompiler = require('../../../schema/columncompiler');
const { isObject } = require('../../../util/is');
const { toNumber } = require('../../../util/helpers');
const commentEscapeRegex = /(?<!')'(?!')/g;

class ColumnCompiler_PG extends ColumnCompiler {
  constructor() {
    super(...arguments);
    this.modifiers = ['nullable', 'defaultTo', 'comment'];
  }

  // Types
  // ------

  bit(column) {
    return column.length !== false ? `bit(${column.length})` : 'bit';
  }

  // Create the column definition for an enum type.
  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
  enu(allowed, options) {
    options = options || {};

    const values =
      options.useNative && options.existingType
        ? undefined
        : allowed.join("', '");

    if (options.useNative) {
      let enumName = '';
      const schemaName = options.schemaName || this.tableCompiler.schemaNameRaw;

      if (schemaName) {
        enumName += `"${schemaName}".`;
      }

      enumName += `"${options.enumName}"`;

      if (!options.existingType) {
        this.tableCompiler.unshiftQuery(
          `create type ${enumName} as enum ('${values}')`
        );
      }

      return enumName;
    }
    return `text check (${this.formatter.wrap(this.args[0])} in ('${values}'))`;
  }

  decimal(precision, scale) {
    if (precision === null) return 'decimal';
    return `decimal(${toNumber(precision, 8)}, ${toNumber(scale, 2)})`;
  }

  json(jsonb) {
    if (jsonb) this.client.logger.deprecate('json(true)', 'jsonb()');
    return jsonColumn(this.client, jsonb);
  }

  jsonb() {
    return jsonColumn(this.client, true);
  }

  datetime(withoutTz = false, precision) {
    let useTz;
    if (isObject(withoutTz)) {
      ({ useTz, precision } = withoutTz);
    } else {
      useTz = !withoutTz;
    }

    return `${useTz ? 'timestamptz' : 'timestamp'}${
      precision ? '(' + precision + ')' : ''
    }`;
  }

  timestamp(withoutTz = false, precision) {
    let useTz;
    if (isObject(withoutTz)) {
      ({ useTz, precision } = withoutTz);
    } else {
      useTz = !withoutTz;
    }

    return `${useTz ? 'timestamptz' : 'timestamp'}${
      precision ? '(' + precision + ')' : ''
    }`;
  }

  // Modifiers:
  // ------
  comment(comment) {
    const columnName = this.args[0] || this.defaults('columnName');
    const escapedComment = comment
      ? `'${comment.replace(commentEscapeRegex, "''")}'`
      : 'NULL';

    this.pushAdditional(function () {
      this.pushQuery(
        `comment on column ${this.tableCompiler.tableName()}.` +
          this.formatter.wrap(columnName) +
          ` is ${escapedComment}`
      );
    }, comment);
  }
}

ColumnCompiler_PG.prototype.bigincrements = 'bigserial primary key';
ColumnCompiler_PG.prototype.bigint = 'bigint';
ColumnCompiler_PG.prototype.binary = 'bytea';
ColumnCompiler_PG.prototype.bool = 'boolean';
ColumnCompiler_PG.prototype.double = 'double precision';
ColumnCompiler_PG.prototype.floating = 'real';
ColumnCompiler_PG.prototype.increments = 'serial primary key';
ColumnCompiler_PG.prototype.smallint = 'smallint';
ColumnCompiler_PG.prototype.tinyint = 'smallint';
ColumnCompiler_PG.prototype.uuid = 'uuid';

function jsonColumn(client, jsonb) {
  if (!client.version || parseFloat(client.version) >= 9.2)
    return jsonb ? 'jsonb' : 'json';
  return 'text';
}

module.exports = ColumnCompiler_PG;

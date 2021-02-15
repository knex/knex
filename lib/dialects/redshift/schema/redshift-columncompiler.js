// Redshift Column Compiler
// -------

const ColumnCompiler_PG = require('../../postgres/schema/pg-columncompiler');

class ColumnCompiler_Redshift extends ColumnCompiler_PG {
  constructor() {
    super(...arguments);
  }

  // Types:
  // ------

  bit(column) {
    return column.length !== false ? `char(${column.length})` : 'char(1)';
  }

  datetime(without) {
    return without ? 'timestamp' : 'timestamptz';
  }

  timestamp(without) {
    return without ? 'timestamp' : 'timestamptz';
  }

  // Modifiers:
  // ------
  comment(comment) {
    this.pushAdditional(function () {
      this.pushQuery(
        `comment on column ${this.tableCompiler.tableName()}.` +
          this.formatter.wrap(this.args[0]) +
          ' is ' +
          (comment ? `'${comment}'` : 'NULL')
      );
    }, comment);
  }
}

ColumnCompiler_Redshift.prototype.increments = ({ primaryKey = true } = {}) =>
  'integer identity(1,1)' + (primaryKey ? ' primary key' : '') + ' not null';
ColumnCompiler_Redshift.prototype.bigincrements = ({
  primaryKey = true,
} = {}) =>
  'bigint identity(1,1)' + (primaryKey ? ' primary key' : '') + ' not null';
ColumnCompiler_Redshift.prototype.binary = 'varchar(max)';
ColumnCompiler_Redshift.prototype.blob = 'varchar(max)';
ColumnCompiler_Redshift.prototype.enu = 'varchar(255)';
ColumnCompiler_Redshift.prototype.enum = 'varchar(255)';
ColumnCompiler_Redshift.prototype.json = 'varchar(max)';
ColumnCompiler_Redshift.prototype.jsonb = 'varchar(max)';
ColumnCompiler_Redshift.prototype.longblob = 'varchar(max)';
ColumnCompiler_Redshift.prototype.mediumblob = 'varchar(16777218)';
ColumnCompiler_Redshift.prototype.set = 'text';
ColumnCompiler_Redshift.prototype.text = 'varchar(max)';
ColumnCompiler_Redshift.prototype.tinyblob = 'varchar(256)';
ColumnCompiler_Redshift.prototype.uuid = 'char(36)';
ColumnCompiler_Redshift.prototype.varbinary = 'varchar(max)';
ColumnCompiler_Redshift.prototype.bigint = 'bigint';
ColumnCompiler_Redshift.prototype.bool = 'boolean';
ColumnCompiler_Redshift.prototype.double = 'double precision';
ColumnCompiler_Redshift.prototype.floating = 'real';
ColumnCompiler_Redshift.prototype.smallint = 'smallint';
ColumnCompiler_Redshift.prototype.tinyint = 'smallint';

module.exports = ColumnCompiler_Redshift;

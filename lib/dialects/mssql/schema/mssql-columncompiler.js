// MSSQL Column Compiler
// -------
const ColumnCompiler = require('../../../schema/columncompiler');
const { toNumber } = require('../../../util/helpers');
const { formatDefault } = require('../../../formatter/formatterUtils');
const { operator: operator_ } = require('../../../formatter/wrappingFormatter');

class ColumnCompiler_MSSQL extends ColumnCompiler {
  constructor(client, tableCompiler, columnBuilder) {
    super(client, tableCompiler, columnBuilder);
    this.modifiers = ['nullable', 'defaultTo', 'first', 'after', 'comment'];
    this._addCheckModifiers();
  }

  // Types
  // ------

  double(precision, scale) {
    return 'float';
  }

  floating(precision, scale) {
    // ignore precicion / scale which is mysql specific stuff
    return `float`;
  }

  integer() {
    // mssql does not support length
    return 'int';
  }

  tinyint() {
    // mssql does not support length
    return 'tinyint';
  }

  varchar(length) {
    return `nvarchar(${toNumber(length, 255)})`;
  }

  timestamp({ useTz = false } = {}) {
    return useTz ? 'datetimeoffset' : 'datetime2';
  }

  bit(length) {
    if (length > 1) {
      this.client.logger.warn('Bit field is exactly 1 bit length for MSSQL');
    }
    return 'bit';
  }

  binary(length) {
    return length ? `varbinary(${toNumber(length)})` : 'varbinary(max)';
  }

  // Modifiers
  // ------

  first() {
    this.client.logger.warn('Column first modifier not available for MSSQL');
    return '';
  }

  after(column) {
    this.client.logger.warn('Column after modifier not available for MSSQL');
    return '';
  }

  defaultTo(value, { constraintName } = {}) {
    const formattedValue = formatDefault(value, this.type, this.client);
    constraintName =
      typeof constraintName !== 'undefined'
        ? constraintName
        : `${
            this.tableCompiler.tableNameRaw
          }_${this.getColumnName()}_default`.toLowerCase();
    if (this.columnBuilder._method === 'alter') {
      this.pushAdditional(function () {
        this.pushQuery(
          `ALTER TABLE ${this.tableCompiler.tableName()} ADD CONSTRAINT ${this.formatter.wrap(
            constraintName
          )} DEFAULT ${formattedValue} FOR ${this.formatter.wrap(
            this.getColumnName()
          )}`
        );
      });
      return '';
    }
    if (!constraintName) {
      return `DEFAULT ${formattedValue}`;
    }
    return `CONSTRAINT ${this.formatter.wrap(
      constraintName
    )} DEFAULT ${formattedValue}`;
  }

  comment(/** @type {string} */ comment) {
    if (!comment) {
      return;
    }

    // XXX: This is a byte limit, not character, so we cannot definitively say they'll exceed the limit without database collation info.
    // (Yes, even if the column has its own collation, the sqlvariant still uses the database collation.)
    // I'm not sure we even need to raise a warning, as MSSQL will return an error when the limit is exceeded itself.
    if (comment && comment.length > 7500 / 2) {
      this.client.logger.warn(
        'Your comment might be longer than the max comment length for MSSQL of 7,500 bytes.'
      );
    }

    // See: https://docs.microsoft.com/en-us/sql/relational-databases/system-stored-procedures/sp-addextendedproperty-transact-sql?view=sql-server-ver15#b-adding-an-extended-property-to-a-column-in-a-table
    const value = this.formatter.escapingStringDelimiters(comment);
    const level0name = this.tableCompiler.schemaNameRaw || 'dbo';
    const level1name = this.formatter.escapingStringDelimiters(
      this.tableCompiler.tableNameRaw
    );
    const level2name = this.formatter.escapingStringDelimiters(
      this.args[0] || this.defaults('columnName')
    );

    const args = `N'MS_Description', N'${value}', N'Schema', N'${level0name}', N'Table', N'${level1name}', N'Column', N'${level2name}'`;

    this.pushAdditional(function () {
      const isAlreadyDefined = `EXISTS(SELECT * FROM sys.fn_listextendedproperty(N'MS_Description', N'Schema', N'${level0name}', N'Table', N'${level1name}', N'Column', N'${level2name}'))`;
      this.pushQuery(
        `IF ${isAlreadyDefined}\n  EXEC sys.sp_updateextendedproperty ${args}\nELSE\n  EXEC sys.sp_addextendedproperty ${args}`
      );
    });
    return '';
  }

  checkLength(operator, length, constraintName) {
    return this._check(
      `LEN(${this.formatter.wrap(this.getColumnName())}) ${operator_(
        operator,
        this.columnBuilder,
        this.bindingsHolder
      )} ${toNumber(length)}`,
      constraintName
    );
  }

  checkRegex(regex, constraintName) {
    return this._check(
      `${this.formatter.wrap(
        this.getColumnName()
      )} LIKE ${this.client._escapeBinding('%' + regex + '%')}`,
      constraintName
    );
  }

  increments(options = { primaryKey: true }) {
    return (
      'int identity(1,1) not null' +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '')
    );
  }

  bigincrements(options = { primaryKey: true }) {
    return (
      'bigint identity(1,1) not null' +
      (this.tableCompiler._canBeAddPrimaryKey(options) ? ' primary key' : '')
    );
  }
}

ColumnCompiler_MSSQL.prototype.bigint = 'bigint';
ColumnCompiler_MSSQL.prototype.mediumint = 'int';
ColumnCompiler_MSSQL.prototype.smallint = 'smallint';
ColumnCompiler_MSSQL.prototype.text = 'nvarchar(max)';
ColumnCompiler_MSSQL.prototype.mediumtext = 'nvarchar(max)';
ColumnCompiler_MSSQL.prototype.longtext = 'nvarchar(max)';
ColumnCompiler_MSSQL.prototype.json = ColumnCompiler_MSSQL.prototype.jsonb =
  'nvarchar(max)';

// TODO: mssql supports check constraints as of SQL Server 2008
// so make enu here more like postgres
ColumnCompiler_MSSQL.prototype.enu = 'nvarchar(100)';
ColumnCompiler_MSSQL.prototype.uuid = ({ useBinaryUuid = false } = {}) =>
  useBinaryUuid ? 'binary(16)' : 'uniqueidentifier';

ColumnCompiler_MSSQL.prototype.datetime = 'datetime2';
ColumnCompiler_MSSQL.prototype.bool = 'bit';

module.exports = ColumnCompiler_MSSQL;

// MSSQL Column Compiler
// -------
const ColumnCompiler = require('../../../schema/columncompiler');
const { toNumber } = require('../../../util/helpers');

class ColumnCompiler_MSSQL extends ColumnCompiler {
  constructor() {
    super(...arguments);
    this.modifiers = ['nullable', 'defaultTo', 'first', 'after', 'comment'];
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

  comment(comment) {
    if (comment && comment.length > 255) {
      this.client.logger.warn(
        'Your comment is longer than the max comment length for MSSQL'
      );
    }
    return '';
  }
}

ColumnCompiler_MSSQL.prototype.increments =
  'int identity(1,1) not null primary key';
ColumnCompiler_MSSQL.prototype.bigincrements =
  'bigint identity(1,1) not null primary key';
ColumnCompiler_MSSQL.prototype.bigint = 'bigint';
ColumnCompiler_MSSQL.prototype.mediumint = 'int';
ColumnCompiler_MSSQL.prototype.smallint = 'smallint';
ColumnCompiler_MSSQL.prototype.text = 'nvarchar(max)';
ColumnCompiler_MSSQL.prototype.mediumtext = 'nvarchar(max)';
ColumnCompiler_MSSQL.prototype.longtext = 'nvarchar(max)';

// TODO: mssql supports check constraints as of SQL Server 2008
// so make enu here more like postgres
ColumnCompiler_MSSQL.prototype.enu = 'nvarchar(100)';
ColumnCompiler_MSSQL.prototype.uuid = 'uniqueidentifier';
ColumnCompiler_MSSQL.prototype.datetime = 'datetime2';
ColumnCompiler_MSSQL.prototype.bool = 'bit';

module.exports = ColumnCompiler_MSSQL;

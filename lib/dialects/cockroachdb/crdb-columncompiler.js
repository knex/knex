const ColumnCompiler_PG = require('../postgres/schema/pg-columncompiler.js');

class ColumnCompiler_CRDB extends ColumnCompiler_PG {
  uuid(options = { primaryKey: false }) {
    return (
      'uuid' +
      (this.tableCompiler._canBeAddPrimaryKey(options)
        ? ' primary key default gen_random_uuid()'
        : '')
    );
  }
}

module.exports = ColumnCompiler_CRDB;

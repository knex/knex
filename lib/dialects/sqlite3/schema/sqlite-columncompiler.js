const ColumnCompiler = require('../../../schema/columncompiler');

// Column Compiler
// -------

class ColumnCompiler_SQLite3 extends ColumnCompiler {
  constructor() {
    super(...arguments);
    this.modifiers = ['nullable', 'defaultTo'];
  }

  // Types
  // -------

  enu(allowed) {
    return `text check (${this.formatter.wrap(
      this.args[0]
    )} in ('${allowed.join("', '")}'))`;
  }
}

ColumnCompiler_SQLite3.prototype.json = 'json';
ColumnCompiler_SQLite3.prototype.jsonb = 'json';
ColumnCompiler_SQLite3.prototype.double = ColumnCompiler_SQLite3.prototype.decimal = ColumnCompiler_SQLite3.prototype.floating =
  'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

module.exports = ColumnCompiler_SQLite3;

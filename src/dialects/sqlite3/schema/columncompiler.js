import inherits from 'inherits';
import ColumnCompiler from '../../../schema/columncompiler';

// Column Compiler
// -------

function ColumnCompiler_SQLite3() {
  ColumnCompiler.apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo'];
}
inherits(ColumnCompiler_SQLite3, ColumnCompiler);

// Types
// -------

ColumnCompiler_SQLite3.prototype.double = ColumnCompiler_SQLite3.prototype.decimal = ColumnCompiler_SQLite3.prototype.floating =
  'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';
ColumnCompiler_SQLite3.prototype.enu = function(allowed) {
  return `text check (${this.formatter.wrap(this.args[0])} in ('${allowed.join(
    "', '"
  )}'))`;
};

export default ColumnCompiler_SQLite3;

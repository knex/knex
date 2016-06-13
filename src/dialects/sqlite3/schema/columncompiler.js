
import inherits from 'inherits';
import ColumnCompiler from '../../../schema/columncompiler';

// Column Compiler
// -------

function ColumnCompiler_SQLite3() {
  this.modifiers = ['nullable', 'defaultTo'];
  ColumnCompiler.apply(this, arguments);
}
inherits(ColumnCompiler_SQLite3, ColumnCompiler);

// Types
// -------

ColumnCompiler_SQLite3.prototype.double =
ColumnCompiler_SQLite3.prototype.decimal =
ColumnCompiler_SQLite3.prototype.floating = 'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';

export default ColumnCompiler_SQLite3;

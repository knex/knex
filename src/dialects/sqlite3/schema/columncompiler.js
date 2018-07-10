import ColumnCompiler from '../../../schema/columncompiler';

// Column Compiler
// -------

class ColumnCompiler_SQLite3 extends ColumnCompiler {
  modifiers = ['nullable', 'defaultTo'];
  double = 'float';
  decimal = 'float';
  floating = 'float';
  timestamp = 'datetime';
  enu(allowed) {
    return `text check (${this.formatter.wrap(
      this.args[0]
    )} in ('${allowed.join("', '")}'))`;
  }
}

export default ColumnCompiler_SQLite3;

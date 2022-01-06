const ColumnCompiler = require('../../../schema/columncompiler');

// Column Compiler
// -------

class ColumnCompiler_SQLite3 extends ColumnCompiler {
  constructor() {
    super(...arguments);
    this.modifiers = ['nullable', 'defaultTo'];
    this._addCheckModifiers();
  }

  // Types
  // -------

  enu(allowed) {
    return `text check (${this.formatter.wrap(
      this.args[0]
    )} in ('${allowed.join("', '")}'))`;
  }

  _pushAlterCheckQuery(checkPredicate, constraintName) {
    throw new Error(
      `Alter table with to add constraints is not permitted in SQLite`
    );
  }

  checkRegex(regexes, constraintName) {
    return this._check(
      `${this.formatter.wrap(
        this.getColumnName()
      )} REGEXP ${this.client._escapeBinding(regexes)}`,
      constraintName
    );
  }
}

ColumnCompiler_SQLite3.prototype.json = 'json';
ColumnCompiler_SQLite3.prototype.jsonb = 'json';
ColumnCompiler_SQLite3.prototype.double =
  ColumnCompiler_SQLite3.prototype.decimal =
  ColumnCompiler_SQLite3.prototype.floating =
    'float';
ColumnCompiler_SQLite3.prototype.timestamp = 'datetime';
// autoincrement without primary key is a syntax error in SQLite, so it's necessary
ColumnCompiler_SQLite3.prototype.increments =
  ColumnCompiler_SQLite3.prototype.bigincrements =
    'integer not null primary key autoincrement';

module.exports = ColumnCompiler_SQLite3;

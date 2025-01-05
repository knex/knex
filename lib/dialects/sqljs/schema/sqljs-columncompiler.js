const ColumnCompiler = require('../../../schema/columncompiler');

// Column Compiler
// -------

class ColumnCompiler_SQLJS extends ColumnCompiler {
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
      `Alter table with to add constraints is not permitted in SQLJS`
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

ColumnCompiler_SQLJS.prototype.json = 'json';
ColumnCompiler_SQLJS.prototype.jsonb = 'json';
ColumnCompiler_SQLJS.prototype.double =
  ColumnCompiler_SQLJS.prototype.decimal =
  ColumnCompiler_SQLJS.prototype.floating =
    'float';
ColumnCompiler_SQLJS.prototype.timestamp = 'datetime';
// autoincrement without primary key is a syntax error in SQLJS, so it's necessary
ColumnCompiler_SQLJS.prototype.increments =
  ColumnCompiler_SQLJS.prototype.bigincrements =
    'integer not null primary key autoincrement';

module.exports = ColumnCompiler_SQLJS;

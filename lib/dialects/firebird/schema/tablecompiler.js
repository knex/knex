'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablecompiler = require('../../../schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Table Compiler
// ------

function TableCompiler_Firebird() {
  _tablecompiler2.default.apply(this, arguments);
} /* eslint max-len:0 no-console:0*/

// Firebird Table Builder & Compiler
// -------

(0, _inherits2.default)(TableCompiler_Firebird, _tablecompiler2.default);

(0, _lodash.assign)(TableCompiler_Firebird.prototype, {
  createQuery: function createQuery(columns, ifNot) {
    var createStatement = ifNot
      ? "EXECUTE BLOCK AS BEGIN if (not exists(select 1 from rdb$relations where lower(rdb$relation_name) = lower('" +
        this.tableName() +
        "'))) then \n      execute statement 'create table "
      : 'create table ';

    var sql =
      '' +
      createStatement +
      this.tableName() +
      ' (' +
      columns.sql.join(', ') +
      ');' +
      (ifNot ? "'; END;" : '');

    this.pushQuery({
      sql: sql,
      bindings: columns.bindings,
    });

    if (this.single.comment) this.comment(this.single.comment);
  },

  addColumnsPrefix: 'add ',

  dropColumnPrefix: 'drop ',

  alterColumnPrefix: 'alter column ',

  // Compiles the comment on the table.
  comment: function comment(_comment) {
    this.pushQuery(
      'comment on table ' + this.tableName() + " is '" + _comment + "';"
    );
  },

  // Renames a column on the table.
  renameColumn: function renameColumn(from, to) {
    var table = this.tableName();
    var wrapped = this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to);

    this.pushQuery({
      sql: 'alter table ' + table + ' alter column ' + wrapped,
    });
  },
  index: function index(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(
      'create index ' +
        indexName +
        ' on ' +
        this.tableName() +
        ' (' +
        this.formatter.columnize(columns) +
        ');'
    );
  },
  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName + ';');
  },
  primary: function primary(columns) {
    this.pushQuery(
      'alter table ' +
        this.tableName() +
        ' add primary key (' +
        this.formatter.columnize(columns) +
        ')'
    );
  },
  unique: function unique(columns, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(
      'create unique index ' +
        indexName +
        ' on ' +
        this.tableName() +
        ' (' +
        this.formatter.columnize(columns) +
        ');'
    );
  },
  dropUnique: function dropUnique(column, indexName) {
    indexName = indexName
      ? this.formatter.wrap(indexName)
      : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('drop index ' + indexName + ';');
  },
  foreign: function foreign(foreignData) {
    if (foreignData.inTable && foreignData.references) {
      var column = this.formatter.columnize(foreignData.column);
      var references = this.formatter.columnize(foreignData.references);
      var inTable = this.formatter.wrap(foreignData.inTable);
      var keyName = foreignData.keyName
        ? this.formatter.wrap(foreignData.keyName)
        : this._indexCommand('fk', this.tableNameRaw, foreignData.column);
      var onUpdate = foreignData.onUpdate
        ? ' on update ' + foreignData.onUpdate
        : '';
      var onDelete = foreignData.onDelete
        ? ' on delete ' + foreignData.onDelete
        : '';

      this.pushQuery(
        (!this.forCreate ? 'alter table ' + this.tableName() + ' add ' : '') +
          'constraint ' +
          keyName +
          ' ' +
          'foreign key (' +
          column +
          ') references ' +
          inTable +
          ' (' +
          references +
          ')' +
          onUpdate +
          onDelete
      );
    }
  },
  dropForeign: function dropForeign(columns, foreignConstraintName) {
    foreignConstraintName = foreignConstraintName
      ? this.formatter.wrap(foreignConstraintName)
      : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(
      'alter table ' +
        this.tableName() +
        ' drop constraint ' +
        foreignConstraintName
    );
  },

  // Compile a drop primary key command.
  dropPrimary: function dropPrimary(pkConstraintName) {
    this.pushQuery(
      'alter table ' + this.tableName() + ' drop constraint ' + pkConstraintName
    );
  },
});

exports.default = TableCompiler_Firebird;
module.exports = exports['default'];

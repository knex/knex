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
      ? "if (not exists(select 1 from rdb$relations where rdb$relation_name = '" +
        this.tableName() +
        "')) then \n      execute statement ' create table "
      : 'create table ';

    var sql =
      '' +
      createStatement +
      this.tableName() +
      ' (' +
      columns.sql.join(', ') +
      ');';

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
  changeType: function changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
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
    this.client.logger.warn('table index pending implementation');
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
    this.client.logger.warn('table unique pending implementation');
  },

  // Compile a drop index command.
  dropIndex: function dropIndex(columns, indexName) {
    this.client.logger.warn('table drop index pending implementation');
  },

  // Compile a drop foreign key command.
  dropForeign: function dropForeign(columns, indexName) {
    this.client.logger.warn('table drop foreign pending implementation');
  },

  // Compile a drop primary key command.
  dropPrimary: function dropPrimary(pkConstraintName) {
    this.pushQuery(
      'alter table ' + this.tableName() + ' drop constraint ' + pkConstraintName
    );
  },

  // Compile a drop unique key command.
  dropUnique: function dropUnique(column, indexName) {
    this.client.logger.warn('table drop unique pending implementation');
  },
});

exports.default = TableCompiler_Firebird;
module.exports = exports['default'];

'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablecompiler = require('../../../schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Compiler
// ------

/* eslint max-len:0 */

// MSSQL Table Builder & Compiler
// -------
function TableCompiler_MSSQL() {
  _tablecompiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(TableCompiler_MSSQL, _tablecompiler2.default);

(0, _assign3.default)(TableCompiler_MSSQL.prototype, {

  createAlterTableMethods: ['foreign', 'primary', 'unique'],
  createQuery: function createQuery(columns, ifNot) {
    var createStatement = ifNot ? 'if object_id(\'' + this.tableName() + '\', \'U\') is null CREATE TABLE ' : 'CREATE TABLE ';
    var sql = createStatement + this.tableName() + (this._formatting ? ' (\n    ' : ' (') + columns.sql.join(this._formatting ? ',\n    ' : ', ') + ')';

    if (this.single.comment) {
      var comment = this.single.comment || '';
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
    }

    this.pushQuery(sql);
  },


  lowerCase: false,

  addColumnsPrefix: 'ADD ',

  dropColumnPrefix: 'DROP COLUMN ',

  // Compiles column add.  Multiple columns need only one ADD clause (not one ADD per column) so core addColumns doesn't work.  #1348
  addColumns: function addColumns(columns) {
    if (columns.sql.length > 0) {
      this.pushQuery({
        sql: (this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + this.addColumnsPrefix + columns.sql.join(', '),
        bindings: columns.bindings
      });
    }
  },


  // Compiles column drop.  Multiple columns need only one DROP clause (not one DROP per column) so core dropColumn doesn't work.  #1348
  dropColumn: function dropColumn() {
    var _this2 = this;
    var columns = helpers.normalizeArr.apply(null, arguments);

    var drops = (Array.isArray(columns) ? columns : [columns]).map(function (column) {
      return _this2.formatter.wrap(column);
    });
    this.pushQuery((this.lowerCase ? 'alter table ' : 'ALTER TABLE ') + this.tableName() + ' ' + this.dropColumnPrefix + drops.join(', '));
  },


  // Compiles the comment on the table.
  comment: function comment() {},
  changeType: function changeType() {},


  // Renames a column on the table.
  renameColumn: function renameColumn(from, to) {
    this.pushQuery('exec sp_rename ' + this.formatter.parameter(this.tableName() + '.' + from) + ', ' + this.formatter.parameter(to) + ', \'COLUMN\'');
  },
  dropFKRefs: function dropFKRefs(runner, refs) {
    var formatter = this.client.formatter();
    return _bluebird2.default.all(refs.map(function (ref) {
      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
      var tableName = formatter.wrap(ref.TABLE_NAME);
      return runner.query({
        sql: 'ALTER TABLE ' + tableName + ' DROP CONSTRAINT ' + constraintName
      });
    }));
  },
  createFKRefs: function createFKRefs(runner, refs) {
    var formatter = this.client.formatter();

    return _bluebird2.default.all(refs.map(function (ref) {
      var tableName = formatter.wrap(ref.TABLE_NAME);
      var keyName = formatter.wrap(ref.CONSTRAINT_NAME);
      var column = formatter.columnize(ref.COLUMN_NAME);
      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      var inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      var onUpdate = ' ON UPDATE ' + ref.UPDATE_RULE;
      var onDelete = ' ON DELETE ' + ref.DELETE_RULE;

      return runner.query({
        sql: 'ALTER TABLE ' + tableName + ' ADD CONSTRAINT ' + keyName + ' FOREIGN KEY (' + column + ') REFERENCES ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }));
  },
  index: function index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('CREATE INDEX ' + indexName + ' ON ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },
  primary: function primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    if (!this.forCreate) {
      this.pushQuery('ALTER TABLE ' + this.tableName() + ' ADD CONSTRAINT ' + constraintName + ' PRIMARY KEY (' + this.formatter.columnize(columns) + ')');
    } else {
      this.pushQuery('CONSTRAINT ' + constraintName + ' PRIMARY KEY (' + this.formatter.columnize(columns) + ')');
    }
  },
  unique: function unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    if (!this.forCreate) {
      this.pushQuery('CREATE UNIQUE INDEX ' + indexName + ' ON ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
    } else {
      this.pushQuery('CONSTRAINT ' + indexName + ' UNIQUE (' + this.formatter.columnize(columns) + ')');
    }
  },


  // Compile a drop index command.
  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('DROP INDEX ' + indexName + ' ON ' + this.tableName());
  },


  // Compile a drop foreign key command.
  dropForeign: function dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP CONSTRAINT ' + indexName);
  },


  // Compile a drop primary key command.
  dropPrimary: function dropPrimary(constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP CONSTRAINT ' + constraintName);
  },


  // Compile a drop unique key command.
  dropUnique: function dropUnique(column, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('ALTER TABLE ' + this.tableName() + ' DROP CONSTRAINT ' + indexName);
  }
});

exports.default = TableCompiler_MSSQL;
module.exports = exports['default'];
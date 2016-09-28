'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var _tablecompiler = require('../../../schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Compiler
// ------

/* eslint max-len:0 */

function TableCompiler_Oracle() {
  _tablecompiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(TableCompiler_Oracle, _tablecompiler2.default);

(0, _assign3.default)(TableCompiler_Oracle.prototype, {

  // Compile a rename column command.
  renameColumn: function renameColumn(from, to) {
    return this.pushQuery({
      sql: 'alter table ' + this.tableName() + ' rename column ' + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
    });
  },
  compileAdd: function compileAdd(builder) {
    var table = this.formatter.wrap(builder);
    var columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: 'alter table ' + table + ' ' + columns.join(', ')
    });
  },


  // Adds the "create" query to the query sequence.
  createQuery: function createQuery(columns, ifNot) {
    var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';
    this.pushQuery({
      // catch "name is already used by an existing object" for workaround for "if not exists"
      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
      bindings: columns.bindings
    });
    if (this.single.comment) this.comment(this.single.comment);
  },


  // Compiles the comment on the table.
  comment: function comment(_comment) {
    this.pushQuery('comment on table ' + this.tableName() + ' is \'' + (_comment || '') + '\'');
  },


  addColumnsPrefix: 'add ',

  dropColumn: function dropColumn() {
    var columns = helpers.normalizeArr.apply(null, arguments);
    this.pushQuery('alter table ' + this.tableName() + ' drop (' + this.formatter.columnize(columns) + ')');
  },
  changeType: function changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },
  _indexCommand: function _indexCommand(type, tableName, columns) {
    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
  },
  primary: function primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + constraintName + ' primary key (' + this.formatter.columnize(columns) + ')');
  },
  dropPrimary: function dropPrimary(constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + constraintName);
  },
  index: function index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },
  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName);
  },
  unique: function unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')');
  },
  dropUnique: function dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  },
  dropForeign: function dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  }
});

exports.default = TableCompiler_Oracle;
module.exports = exports['default'];
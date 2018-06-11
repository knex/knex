'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var _tablecompiler = require('../../../schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _trigger = require('./trigger');

var _trigger2 = _interopRequireDefault(_trigger);

var _lodash = require('lodash');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Compiler
// ------

/* eslint max-len:0 */

function TableCompiler_Oracle() {
  _tablecompiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(TableCompiler_Oracle, _tablecompiler2.default);

(0, _lodash.assign)(TableCompiler_Oracle.prototype, {

  addColumns(columns, prefix) {
    if (columns.sql.length > 0) {
      prefix = prefix || this.addColumnsPrefix;

      const columnSql = (0, _lodash.map)(columns.sql, column => column);
      const alter = this.lowerCase ? 'alter table ' : 'ALTER TABLE ';

      let sql = `${alter}${this.tableName()} ${prefix}`;
      if (columns.sql.length > 1) {
        sql += `(${columnSql.join(', ')})`;
      } else {
        sql += columnSql.join(', ');
      }

      this.pushQuery({
        sql,
        bindings: columns.bindings
      });
    }
  },

  // Compile a rename column command.
  renameColumn(from, to) {
    // Remove quotes around tableName
    const tableName = this.tableName().slice(1, -1);
    return this.pushQuery(_trigger2.default.renameColumnTrigger(this.client.logger, tableName, from, to));
  },

  compileAdd(builder) {
    const table = this.formatter.wrap(builder);
    const columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: `alter table ${table} ${columns.join(', ')}`
    });
  },

  // Adds the "create" query to the query sequence.
  createQuery(columns, ifNot) {
    const sql = `create table ${this.tableName()} (${columns.sql.join(', ')})`;
    this.pushQuery({
      // catch "name is already used by an existing object" for workaround for "if not exists"
      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
      bindings: columns.bindings
    });
    if (this.single.comment) this.comment(this.single.comment);
  },

  // Compiles the comment on the table.
  comment(comment) {
    this.pushQuery(`comment on table ${this.tableName()} is '${comment}'`);
  },

  addColumnsPrefix: 'add ',

  alterColumnsPrefix: 'modify ',

  dropColumn() {
    const columns = helpers.normalizeArr.apply(null, arguments);
    this.pushQuery(`alter table ${this.tableName()} drop (${this.formatter.columnize(columns)})`);
  },

  changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  _indexCommand(type, tableName, columns) {
    return this.formatter.wrap(utils.generateCombinedName(this.client.logger, type, tableName, columns));
  },

  primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(`${this.tableNameRaw}_pkey`);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${constraintName} primary key (${this.formatter.columnize(columns)})`);
  },

  dropPrimary(constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery(`alter table ${this.tableName()} drop constraint ${constraintName}`);
  },

  index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`create index ${indexName} on ${this.tableName()}` + ' (' + this.formatter.columnize(columns) + ')');
  },

  dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery(`drop index ${indexName}`);
  },

  unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} add constraint ${indexName}` + ' unique (' + this.formatter.columnize(columns) + ')');
  },

  dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} drop constraint ${indexName}`);
  },

  dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery(`alter table ${this.tableName()} drop constraint ${indexName}`);
  }

});

exports.default = TableCompiler_Oracle;
module.exports = exports['default'];
'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function QueryCompiler_PG(client, builder) {
  _compiler2.default.call(this, client, builder);
}
// PostgreSQL Query Builder & Compiler
// ------

(0, _inherits2.default)(QueryCompiler_PG, _compiler2.default);

(0, _lodash.assign)(QueryCompiler_PG.prototype, {

  // Compiles a truncate query.
  truncate() {
    return `truncate ${this.tableName} restart identity`;
  },

  // is used if the an array with multiple empty values supplied
  _defaultInsertValue: 'default',

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert() {
    const sql = _compiler2.default.prototype.insert.call(this);
    if (sql === '') return sql;
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  update() {
    const updateData = this._prepUpdate(this.single.update);
    const wheres = this.where();
    const { returning } = this.single;
    return {
      sql: this.with() + `update ${this.single.only ? 'only ' : ''}${this.tableName} ` + `set ${updateData.join(', ')}` + (wheres ? ` ${wheres}` : '') + this._returning(returning),
      returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  del() {
    const sql = _compiler2.default.prototype.del.apply(this, arguments);
    const { returning } = this.single;
    return {
      sql: sql + this._returning(returning),
      returning
    };
  },

  aggregate(stmt) {
    return this._aggregate(stmt, { distinctParentheses: true });
  },

  _returning(value) {
    return value ? ` returning ${this.formatter.columnize(value)}` : '';
  },

  forUpdate() {
    return 'for update';
  },

  forShare() {
    return 'for share';
  },

  // Compiles a columnInfo query
  columnInfo() {
    const column = this.single.columnInfo;
    let schema = this.single.schema;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    const table = this.client.customWrapIdentifier(this.single.table, _lodash.identity);

    if (schema) {
      schema = this.client.customWrapIdentifier(schema, _lodash.identity);
    }

    let sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    const bindings = [table, this.client.database()];

    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    return {
      sql,
      bindings,
      output(resp) {
        const out = (0, _lodash.reduce)(resp.rows, function (columns, val) {
          columns[val.column_name] = {
            type: val.data_type,
            maxLength: val.character_maximum_length,
            nullable: val.is_nullable === 'YES',
            defaultValue: val.column_default
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  }

});

exports.default = QueryCompiler_PG;
module.exports = exports['default'];
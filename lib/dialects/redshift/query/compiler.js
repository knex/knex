'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _compiler3 = require('../../postgres/query/compiler');

var _compiler4 = _interopRequireDefault(_compiler3);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Redshift Query Builder & Compiler
// ------
function QueryCompiler_Redshift(client, builder) {
  _compiler4.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_Redshift, _compiler4.default);

(0, _lodash.assign)(QueryCompiler_Redshift.prototype, {
  truncate: function truncate() {
    return 'truncate ' + this.tableName.toLowerCase();
  },


  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var sql = _compiler2.default.prototype.insert.apply(this, arguments);
    if (sql === '') return sql;
    this._slightReturn();
    return {
      sql: sql
    };
  },


  // Compiles an `update` query, warning on unsupported returning
  update: function update() {
    var sql = _compiler2.default.prototype.update.apply(this, arguments);
    this._slightReturn();
    return {
      sql: sql
    };
  },


  // Compiles an `delete` query, warning on unsupported returning
  del: function del() {
    var sql = _compiler2.default.prototype.del.apply(this, arguments);
    this._slightReturn();
    return {
      sql: sql
    };
  },


  // simple: if trying to return, warn
  _slightReturn: function _slightReturn() {
    if (this.single.isReturning) {
      this.client.logger.warn('insert/update/delete returning is not supported by redshift dialect');
    }
  },
  forUpdate: function forUpdate() {
    this.client.logger.warn('table lock is not supported by redshift dialect');
    return '';
  },
  forShare: function forShare() {
    this.client.logger.warn('lock for share is not supported by redshift dialect');
    return '';
  },


  // Compiles a columnInfo query
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;
    var schema = this.single.schema;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    var table = this.client.customWrapIdentifier(this.single.table, _lodash.identity);

    if (schema) {
      schema = this.client.customWrapIdentifier(schema, _lodash.identity);
    }

    var sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    var bindings = [table.toLowerCase(), this.client.database().toLowerCase()];

    if (schema) {
      sql += ' and table_schema = ?';
      bindings.push(schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    return {
      sql: sql,
      bindings: bindings,
      output: function output(resp) {
        var out = (0, _lodash.reduce)(resp.rows, function (columns, val) {
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

exports.default = QueryCompiler_Redshift;
module.exports = exports['default'];
'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _trigger = require('./trigger');

var _trigger2 = _interopRequireDefault(_trigger);

var _lodash = require('lodash');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Firebird Schema Compiler
// -------
function SchemaCompiler_Firebird(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(SchemaCompiler_Firebird, _compiler2.default);

(0, _lodash.assign)(SchemaCompiler_Firebird.prototype, {
  dropTablePrefix: 'DROP TABLE ',

  dropTable: function dropTable(tableName) {
    SchemaCompiler_Firebird.super_.prototype.dropTable.apply(this, arguments);

    var dropAutoIncrementSQL = _trigger2.default.dropAutoIncrementSequence(
      this.client.logger,
      tableName
    );
    this.pushQuery(dropAutoIncrementSQL);
  },
  dropTableIfExists: function dropTableIfExists(tableName) {
    var queryDrop =
      'execute block ' +
      'as ' +
      'begin ' +
      "  if (exists(select 1 from RDB$RELATION_FIELDS where RDB$SYSTEM_FLAG=0 AND RDB$RELATION_NAME = UPPER('" +
      tableName +
      "'))) then " +
      ("    execute statement 'drop table " + tableName + "' ") +
      '      WITH AUTONOMOUS TRANSACTION; ' +
      'end;';

    this.pushQuery(queryDrop);

    var dropAutoIncrementSQL = _trigger2.default.dropAutoIncrementSequence(
      this.client.logger,
      tableName
    );
    this.pushQuery(dropAutoIncrementSQL);
  },

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.client.logger.warn('Rename table not available for Firebird');
  },

  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    this.pushQuery({
      sql:
        'select trim(rdb$relation_name)\n        from rdb$relations\n        where trim(lower(rdb$relation_name)) = lower(?) and rdb$view_blr is null and (rdb$system_flag is null or rdb$system_flag = 0);',
      bindings: [tableName],
      output: function output(resp) {
        return resp.length > 0;
      },
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql:
        '\n      SELECT\n        TRIM(R.RDB$RELATION_NAME) AS RELATION_NAME, \n        TRIM(R.RDB$FIELD_NAME) AS FIELD_NAME\n      FROM RDB$RELATION_FIELDS R WHERE TRIM(R.RDB$RELATION_NAME) LIKE ? and TRIM(R.RDB$FIELD_NAME) like ?',
      bindings: [
        this.formatter.wrap(tableName),
        this.formatter.parameter(column),
      ],
      output: function output(resp) {
        return resp.length > 0;
      },
    });
  },
});

exports.default = SchemaCompiler_Firebird;
module.exports = exports['default'];

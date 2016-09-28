'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _helpers = require('./helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(client, builder) {
  this.builder = builder;
  this.client = client;
  this.schema = builder._schema;
  this.formatter = client.formatter();
  this.sequence = [];
}

(0, _assign3.default)(SchemaCompiler.prototype, {

  pushQuery: _helpers.pushQuery,

  pushAdditional: _helpers.pushAdditional,

  createTable: buildTable('create'),

  createTableIfNotExists: buildTable('createIfNot'),

  alterTable: buildTable('alter'),

  dropTablePrefix: 'drop table ',

  dropTable: function dropTable(tableName) {
    this.pushQuery(this.dropTablePrefix + this.formatter.wrap(prefixedTableName(this.schema, tableName)));
  },
  dropTableIfExists: function dropTableIfExists(tableName) {
    this.pushQuery(this.dropTablePrefix + 'if exists ' + this.formatter.wrap(prefixedTableName(this.schema, tableName)));
  },
  raw: function raw(sql, bindings) {
    this.sequence.push(this.client.raw(sql, bindings).toSQL());
  },
  toSQL: function toSQL() {
    var sequence = this.builder._sequence;
    for (var i = 0, l = sequence.length; i < l; i++) {
      var query = sequence[i];
      this[query.method].apply(this, query.args);
    }
    return this.sequence;
  }
});

function buildTable(type) {
  return function (tableName, fn) {
    var builder = this.client.tableBuilder(type, tableName, fn);

    builder.setSchema(this.schema);
    var sql = builder.toSQL();

    for (var i = 0, l = sql.length; i < l; i++) {
      this.sequence.push(sql[i]);
    }
  };
}

function prefixedTableName(prefix, table) {
  return prefix ? prefix + '.' + table : table;
}

exports.default = SchemaCompiler;
module.exports = exports['default'];
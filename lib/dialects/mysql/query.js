// MySQL Query Builder & Compiler
// ------
module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');
var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// Query Builder
// -------

// Extend the QueryBuilder base class to include the "Formatter"
// which has been defined on the client, as well as the
function QueryBuilder_MySQL() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_MySQL, QueryBuilder);

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_MySQL() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_MySQL, QueryCompiler);

QueryCompiler_MySQL.prototype._emptyInsertValue = '() values ()';

// Update method, including joins, wheres, order & limits.
QueryCompiler_MySQL.prototype.update = function() {
  var join    = this.join();
  var updates = this._prepUpdate(this.single.update);
  var where   = this.where();
  var order   = this.order();
  var limit   = this.limit();
  return 'update ' + this.tableName +
    (join ? ' ' + join : '') +
    ' set ' + updates.join(', ') +
    (where ? ' ' + where : '') +
    (order ? ' ' + order : '') +
    (limit ? ' ' + limit : '');
};

QueryCompiler_MySQL.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_MySQL.prototype.forShare = function() {
  return 'lock in share mode';
};

// Compiles a `columnInfo` query.
QueryCompiler_MySQL.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
    bindings: [this.single.table, client.database()],
    output: function(resp) {
      var out = _.reduce(resp, function(columns, val) {
        columns[val.COLUMN_NAME] = {
          defaultValue: val.COLUMN_DEFAULT,
          type: val.DATA_TYPE,
          maxLength: val.CHARACTER_MAXIMUM_LENGTH,
          nullable: (val.IS_NULLABLE === 'YES')
        };
        return columns;
      }, {});
      return column && out[column] || out;
    }
  };
};

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
client.QueryBuilder  = QueryBuilder_MySQL;
client.QueryCompiler = QueryCompiler_MySQL;

};
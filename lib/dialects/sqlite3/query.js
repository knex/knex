// Extend the base compiler with the necessary grammar
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// The SQLite3 specific QueryBuilder constructor.
function QueryBuilder_SQLite3() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_SQLite3, QueryBuilder);

// The SQLite3 specific QueryCompiler constructor.
function QueryCompiler_SQLite3() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_SQLite3, QueryCompiler);

// The locks are not applicable in SQLite3
QueryCompiler_SQLite3.prototype.forShare =
QueryCompiler_SQLite3.prototype.forUpdate = function() {
  return '';
};

// SQLite requires us to build the multi-row insert as a listing of select with
// unions joining them together. So we'll build out this list of columns and
// then join them all together with select unions to complete the queries.
QueryCompiler_SQLite3.prototype.insert = function() {
  var insert = this.single.insert;
  var sql = 'insert into ' + this.tableName + ' ';
  if (_.isEmpty(this.single.insert)) return sql + 'default values';
  var insertData = this._prepInsert(insert);
  sql += '(' + this.formatter.columnize(insertData.columns) + ')';
  if (insertData.values.length === 1) {
    return sql + ' values ' + this.formatter.parameterize(insertData.values[0]);
  }
  var blocks = [];
  for (var i = 0, l = insertData.values.length; i < l; i++) {
    var block = blocks[i] = [];
    var current = insertData.values[i];
    for (var i2 = 0, l2 = insertData.columns.length; i2 < l2; i2++) {
      block.push(this.formatter.parameter(current[i2]) + ' as ' + this.formatter.wrap(insertData.columns[i2]));
    }
    blocks[i] = block.join(', ');
  }
  return sql + ' select ' + blocks.join(' union all select ');
};

// Adds a `order by` clause to the query, using "collate nocase" for the sort.
QueryCompiler_SQLite3.prototype.order = function(column, direction) {
  var cols = _.isArray(column) ? column : [column];
  return this.f.columnize(cols) + ' collate nocase ' + this.f.direction(direction);
};

// Compiles an `update` query.
QueryCompiler_SQLite3.prototype.update = function() {
  var wheres = this.where();
  var joins  = this.join();
  var join   = joins.sql ? ' ' + joins.sql : '';
  var updateData = this.get('update');
  return {
    sql: 'update ' + this.tableName + join + ' set ' + updateData.columns + ' ' + wheres.sql,
    bindings: updateData.bindings.concat(wheres.bindings)
  };
};

// Compile a truncate table statement into SQL.
QueryCompiler_SQLite3.prototype.truncate = function() {
  var table = this.tableName;
  return {
    sql: 'delete from sqlite_sequence where name = ' + this.tableName,
    output: function() {
      return this.query({sql: 'delete from ' + table});
    }
  };
};

client.QueryBuilder = QueryBuilder_SQLite3;
client.QueryCompiler = QueryCompiler_SQLite3;

};
// Extend the base compiler with the necessary grammar
module.exports = function(client) {

var inherits = require('inherits');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

function QueryBuilder_PG() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_PG, QueryBuilder);

function QueryCompiler_PG() {
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_PG, QueryCompiler);

// Compiles a truncate query.
QueryCompiler_PG.prototype.truncate = function() {
  return 'truncate ' + this.tableName + ' restart identity';
};

// Compiles an `insert` query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_PG.prototype.insert = function() {
  var insertData = this.prepInsert();
  var sql = 'insert into ' + this.tableName + ' ';
  if (insertData.columns === '()') {
    sql += 'default values';
  } else {
    sql += insertData.columns + ' values ' + insertData.value;
  }
  var returning = this.get('returning');
  return sql + (returning.value ? ' ' + returning.value : '');
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_PG.prototype.update = function() {
  var wheres = this.where();
  var updateData = this.get('update');
  var returning = this.get('returning');
  var returnVal = (returning.value ? ' ' + returning.value : '');
  return {
    sql: 'update ' + this.tableName + ' set ' + updateData.columns + ' ' + wheres.sql + returnVal,
    bindings: updateData.bindings.concat(wheres.bindings)
  };
};

};
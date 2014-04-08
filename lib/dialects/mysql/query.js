module.exports = function(client) {

var inherits      = require('inherits');
var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// Query Builder
// ---------------

// Extend the QueryBuilder base class to include the "Formatter"
// which has been defined on the client, as well as the
function QueryBuilder_MySQL() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_MySQL, QueryBuilder);

// Query Compiler
// ---------------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_MySQL() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}

QueryBuilder_MySQL.prototype.insert = function() {

};

QueryBuilder_MySQL.prototype.update = function() {
  var where = this.where();
  var join  = this.join();
  var order = this.order();
  var limit = this.limit();

  var joinSql    = join.sql  ? ' ' + join.sql  : '';
  var orderSql   = order.sql ? ' ' + order.sql : '';
  var limitSql   = limit.sql ? ' ' + limit.sql : '';
  var updateData = this.get('update');

  return 'update ' + this.tableName + joinSql + ' set ' + updateData.columns + ' ' + where.sql + orderSql + limitSql;
};

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
client.QueryBuilder  = QueryBuilder_MySQL;
client.QueryCompiler = QueryCompiler_MySQL;

};
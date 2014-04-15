// PostgreSQL Query Builder & Compiler
// ------
module.exports = function(client) {

var inherits = require('inherits');
var _        = require('lodash');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// Query Builder
// ------

function QueryBuilder_PG() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_PG, QueryBuilder);

// Query Compiler
// ------

function QueryCompiler_PG() {
  this.formatter = new client.Formatter();
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
  var sql = 'insert into ' + this.tableName + ' ';
  if (_.isEmpty(this.single.insert)) {
    sql += 'default values';
  } else {
    var columns;
    var insertData = this._prepInsert(this.single.insert);
    if (_.isString(insertData)) {
      sql += insertData;
    } else  {
      sql += '(' + this.formatter.columnize(insertData.columns) + ') values (' +
        _.map(insertData.values, this.formatter.parameterize, this.formatter).join('), (') + ')';
    }
  }
  var returning = this.single.returning;
  return sql + this._returning();
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_PG.prototype.update = function() {
  var updateData = this._prepUpdate(this.single.update);
  var wheres     = this.where();
  var returning  = this.single.returning;
  return 'update ' + this.tableName + ' set ' + updateData.join(', ') +
    (wheres ? ' ' + wheres : '') +
    this._returning();
};

QueryCompiler_PG.prototype._returning = function() {
  var returning = this.single.returning;
  return returning ? ' returning ' + this.formatter.columnize(returning) : '';
};

QueryCompiler_PG.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_PG.prototype.forShare = function() {
  return 'for share';
};

client.QueryBuilder = QueryBuilder_PG;
client.QueryCompiler = QueryCompiler_PG;

};
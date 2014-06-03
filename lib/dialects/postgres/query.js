// PostgreSQL Query Builder & Compiler
// ------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

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

// Used when the insert call is empty.
QueryCompiler_PG.prototype._emptyInsertValue = 'default values';

// Compiles an `insert` query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_PG.prototype.insert = function() {
  var sql = QueryCompiler.prototype.insert.call(this);
  var returning  = this.single.returning;
  return {
    sql: sql + this._returning(returning),
    returning: returning
  };
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_PG.prototype.update = function() {
  var updateData = this._prepUpdate(this.single.update);
  var wheres     = this.where();
  var returning  = this.single.returning;
  return {
    sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') +
    (wheres ? ' ' + wheres : '') +
    this._returning(returning),
    returning: returning
  };
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_PG.prototype.del = function() {
  var sql = QueryCompiler.prototype.del.apply(this, arguments);
  var returning  = this.single.returning;
  return {
    sql: sql + this._returning(returning),
    returning: returning
  };
};

QueryCompiler_PG.prototype._returning = function(value) {
  return value ? ' returning ' + this.formatter.columnize(value) : '';
};

QueryCompiler_PG.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_PG.prototype.forShare = function() {
  return 'for share';
};

// Compiles a columnInfo query
QueryCompiler_PG.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_catalog = ?',
    bindings: [this.single.table, client.database()],
    output: function(resp) {
      var out = _.reduce(resp.rows, function(columns, val) {
        columns[val.column_name] = {
          type: val.data_type,
          maxLength: val.character_maximum_length,
          nullable: (val.is_nullable === 'YES'),
          defaultValue: val.column_default
        };
        return columns;
      }, {});
      return column && out[column] || out;
    }
  };
};

client.QueryBuilder = QueryBuilder_PG;
client.QueryCompiler = QueryCompiler_PG;

};
// Extend the base compiler with the necessary grammar
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// The SQLite3 specific QueryBuilder constructor.
function QueryBuilder_SQLite3() {
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_SQLite3, QueryBuilder);

// The SQLite3 specific QueryCompiler constructor.
function QueryCompiler_SQLite3() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_SQLite3, QueryCompiler);

// The locks are not applicable
QueryCompiler_SQLite3.prototype.forShare =
QueryCompiler_SQLite3.prototype.forUpdate = function() {
  return '';
};

// Compile an insert statement into SQL.
QueryCompiler_SQLite3.prototype.insert = function() {
  var insert = this.single.insert;

  var sql = 'insert into ' + this.tableName + ' ';

  // If the insert
  if (insert.rawData[0].length === 0) {
    sql += 'default values';
  } else {
    sql += insert.columns;

    if (insert.rawData.length === 1) {
      sql += ' values ' + insert.value;
    }
  }

  // If there is only one record being inserted, we will just use the usual query
  // grammar insert builder because no special syntax is needed for the single
  // row inserts in SQLite. However, if there are multiples, we'll continue.
  if (insert.rawData.length <= 1) {
    return {
      sql: sql,
      bindings: insert.bindings
    };
  }

  var blocks = [];

  // SQLite requires us to build the multi-row insert as a listing of select with
  // unions joining them together. So we'll build out this list of columns and
  // then join them all together with select unions to complete the queries.
  for (var i = 0, l = insert.rawData.length; i < l; i++) {
    var block = blocks[i] = [];
    var current = insert.rawData[i];
    var columnList = insert.columnList;
    for (var i2 = 0, l2 = current.length; i2 < l2; i2++) {
      block.push('? as ' + columnList[i2]);
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
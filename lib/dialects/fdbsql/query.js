'use strict';

// FDB SQL Layer Query Builder & Compiler
// This file was adapted from the PostgreSQL Query Builder & Compiler

module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');

var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

// Query Builder
// ------

function QueryBuilder_FDB() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
  if (client.defaultReturning) {
    this._single.returning = client.defaultReturning;
  }
}
inherits(QueryBuilder_FDB, QueryBuilder);

// Query Compiler
// ------

function QueryCompiler_FDB() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_FDB, QueryCompiler);

// Compiles a truncate query.
QueryCompiler_FDB.prototype.truncate = function() {
  return 'truncate table ' + this.tableName;
};

// Used when the insert call is empty.
QueryCompiler_FDB.prototype._emptyInsertValue = 'default values';

// is used if the an array with multiple empty values supplied
QueryCompiler_FDB.prototype._defaultInsertValue = 'default';

// The locks are not applicable in SQL Layer
QueryCompiler_FDB.prototype.forShare =
QueryCompiler_FDB.prototype.forUpdate = function() {
  return '';
};

// Compiles an `insert` query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_FDB.prototype.insert = function() {
  var self = this;
  var insertValues = this.single.insert;

  var sql = 'insert into ' + this.tableName + ' ';

  if (_.isArray(insertValues) && (insertValues.length === 1) && _.isEmpty(insertValues[0])) {
    insertValues = [];
  }

  if (_.isEmpty(insertValues) && !_.isFunction(insertValues)) {
    sql += this._emptyInsertValue;
  } else {
    var insertData = this._prepInsert(insertValues);

    if (_.isString(insertData)) {
      sql += insertData;
    } else  {
      if (insertData.columns.length) {
        sql += '(' + this.formatter.columnize(insertData.columns) + ') values (' +
          _.map(insertData.values, this.formatter.parameterize, this.formatter).join('), (') + ')';
      } else {
        // if there is no target column only insert default values
        sql += 'values ' + _.map(insertData.values, function () { return '(' + (self._defaultInsertValue || '') + ')'; }).join(', ');
      }
    }
  }

  var returning  = this.single.returning;
  return {
    sql: sql + this._returning(returning),
    returning: returning
  };
};

// Compiles an `update` query, allowing for a return value.
QueryCompiler_FDB.prototype.update = function() {
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

// Compiles a `delete` query, allowing for a return value.
QueryCompiler_FDB.prototype.del = function() {
  var sql = QueryCompiler.prototype.del.apply(this, arguments);
  var returning  = this.single.returning;
  return {
    sql: sql + this._returning(returning),
    returning: returning
  };
};

QueryCompiler_FDB.prototype._returning = function(value) {
  return value ? ' returning ' + this.formatter.columnize(value) : '';
};

// Compiles a columnInfo query
QueryCompiler_FDB.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'select * from information_schema.columns where table_name = ? and table_schema = ? and table_schema = CURRENT_SCHEMA',
    bindings: [this.single.table, client.database()],
    output: function(resp) {
      var out = _.reduce(resp.rows, function(columns, val) {
        var maxLen = val.character_maximum_length;
        columns[val.column_name] = {
          type: val.data_type,
          maxLength: maxLen ? parseInt(maxLen) : null,
          nullable: (val.is_nullable === 'YES'),
          defaultValue: val.column_default
        };
        return columns;
      }, {});
      return column && out[column] || out;
    }
  };
};

client.QueryBuilder = QueryBuilder_FDB;
client.QueryCompiler = QueryCompiler_FDB;

};

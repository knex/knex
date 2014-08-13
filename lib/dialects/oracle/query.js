// Oracle Query Builder & Compiler
// ------

'use strict';
module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');
var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');

var ReturningHelper = require('./utils').ReturningHelper;

// Query Builder
// -------

// Extend the QueryBuilder base class to include the "Formatter"
// which has been defined on the client, as well as the
function QueryBuilder_Oracle() {
  this.client = client;
  QueryBuilder.apply(this, arguments);
}
inherits(QueryBuilder_Oracle, QueryBuilder);

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_Oracle() {
  this.formatter = new client.Formatter();
  QueryCompiler.apply(this, arguments);
}
inherits(QueryCompiler_Oracle, QueryCompiler);


QueryCompiler_Oracle.prototype._returningParams = function (value) {
  if (!value || value === '*') {
    return;
  }

  var self = this;
  var returningValues = _.isArray(value) ? value : [value];
  var returning = [];
  var outParams = _.map(returningValues, function (v) {
      var returningHelper = new ReturningHelper(v);
      returning.push(returningHelper);
      return self.formatter.parameter(returningHelper);
    }).join (', ');

  return {
    columns: this.formatter.columnize(value),
    outParams: outParams,
    returning: returning
  };
};

QueryCompiler_Oracle.prototype._addReturningToSqlAndConvert = function (sql, returning) {
  var res = {
    sql: sql
  };
  var returningInfo = this._returningParams(returning);
  if (returningInfo) {
    res.sql = sql + ' returning ' + returningInfo.columns + ' into ' + returningInfo.outParams;
    res.returning = returningInfo.returning;
  }

  return res;
};

// Compiles an "insert" query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_Oracle.prototype.insert = function() {
  var self = this;
  var returning  = self.single.returning;
  if (_.isEmpty(self.single.insert)) {
    return self._addReturningToSqlAndConvert('insert into ' + self.tableName + ' (' + self.formatter.wrap(self.single.returning) + ') values (default)', returning);
  }

  var insertData = self._prepInsert(self.single.insert);
  if (_.isString(insertData)) {
    return self._addReturningToSqlAndConvert('insert into ' + self.tableName + ' ' + insertData, returning);
  }

  if (insertData.values.length === 1) {
    return self._addReturningToSqlAndConvert('insert into ' + self.tableName + ' (' + self.formatter.columnize(insertData.columns) + ') values (' + self.formatter.parameterize(insertData.values[0]) + ')', returning);
  }

  var sql = {};
  sql.sql = 'begin ' +
    _.map(insertData.values, function (value) {
        var parameterizedValues = self.formatter.parameterize(value);
        var returningInfo = self._returningParams(returning);
        var subSql = 'insert into ' + self.tableName + ' (' + self.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')' + (returningInfo ? ' returning ' + returningInfo.columns + ' into ' + returningInfo.outParams : '');
        // pre bind position because subSql is an execute immediate parameter
        // later position binding will only convert the ? params
        subSql = self.formatter.client.positionBindings(subSql);

        if (returningInfo) {
          sql.returning = (sql.returning || []).concat(returningInfo.returning.length > 1 ? [returningInfo.returning]: returningInfo.returning);
        }
        return 'execute immediate \'' + subSql.replace(/'/g, "''") + '\' using ' + parameterizedValues + (returningInfo ? ', ' + returningInfo.outParams.replace(/\?/g, 'out ?') : '') + ';';
      }
    ).join(' ') +
    'end;';

  return sql;
};

// Update method, including joins, wheres, order & limits.
QueryCompiler_Oracle.prototype.update = function() {
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

// Compiles a `truncate` query.
QueryCompiler_Oracle.prototype.truncate = function() {
  return 'truncate table ' + this.tableName;
};

QueryCompiler_Oracle.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_Oracle.prototype.forShare = function() {
  return 'lock in share mode';
};

// Compiles a `columnInfo` query.
QueryCompiler_Oracle.prototype.columnInfo = function() {
  var column = this.single.columnInfo;
  return {
    sql: 'select COLUMN_NAME, DATA_TYPE, CHAR_COL_DECL_LENGTH, NULLABLE from USER_TAB_COLS where TABLE_NAME = :1',
    bindings: [this.single.table],
    output: function(resp) {
      var out = _.reduce(resp, function(columns, val) {
        columns[val.COLUMN_NAME] = {
          type: val.DATA_TYPE,
          maxLength: val.CHAR_COL_DECL_LENGTH,
          nullable: (val.NULLABLE === 'Y')
        };
        return columns;
      }, {});
      return column && out[column] || out;
    }
  };
};

QueryCompiler_Oracle.prototype.limit = function() {
  // throw new Error("This function should never be called for oracle");
};

QueryCompiler_Oracle.prototype.offset = function() {
  // throw new Error("This function should never be called for oracle");
};

function surroundQueryWithLimitAndOffset(self, query, limit, offset) {
  if (!limit && !offset) {
    return query;
  }

  query = query || "";

  if (limit && !offset) {
    return "select * from (" + query + ") where rownum <= " + self.formatter.parameter(limit);
  }

  var endRow = +(offset) + (+limit || 10000000000000);

  return "select * from " +
         "(select row_.*, ROWNUM rownum_ from (" + query + ") row_ " +
         "where rownum <= " + self.formatter.parameter(endRow) + ") " +
         "where rownum_ > " + self.formatter.parameter(offset);
}

var components = [
  'columns', 'join', 'where', 'union', 'group',
  'having', 'order', /*'limit', 'offset', */'lock'
];

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler_Oracle.prototype.select = function() {
  var self = this;
  var statements = _.map(components, function (component) {
    return self[component](self);
  });
  var query = _.compact(statements).join(' ');
  return surroundQueryWithLimitAndOffset(self, query, this.single.limit, this.single.offset);
};

QueryCompiler_Oracle.prototype.aggregate = function(stmt) {
  var val = stmt.value;
  var splitOn = val.toLowerCase().indexOf(' as ');
  // Allows us to speciy an alias for the aggregate types.
  if (splitOn !== -1) {
    var col = val.slice(0, splitOn);
    var alias = val.slice(splitOn + 4);
    return stmt.method + '(' + this.formatter.wrap(col) + ') ' + this.formatter.wrap(alias);
  }
  return stmt.method + '(' + this.formatter.wrap(val) + ')';
};

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
client.QueryBuilder  = QueryBuilder_Oracle;
client.QueryCompiler = QueryCompiler_Oracle;

};

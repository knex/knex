'use strict';

// Oracle Query Builder & Compiler
// ------
module.exports = function(client) {

var _             = require('lodash');
var inherits      = require('inherits');
var QueryBuilder  = require('../../query/builder');
var QueryCompiler = require('../../query/compiler');
var helpers       = require('../../helpers');

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

// for single commands only
QueryCompiler_Oracle.prototype._addReturningToSqlAndConvert = function (sql, returning, tableName) {
  var res = {
    sql: sql
  };

  if (!returning) {
    return res;
  }

  var returningValues = _.isArray(returning) ? returning : [returning];
  var returningHelper = new ReturningHelper(returningValues.join(':'));
  res.sql = sql + ' returning ROWID into ' + this.formatter.parameter(returningHelper);
  res.returningSql = 'select ' + this.formatter.columnize(returning) + ' from ' + tableName + ' where ROWID = :1';
  res.outParams = [returningHelper];
  res.returning = returning;
  return res;
};

// Compiles an "insert" query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_Oracle.prototype.insert = function() {
  var self = this;
  var returning  = self.single.returning;

  // always wrap returning argument in array
  if (returning && !_.isArray(returning)) {
    returning = [returning];
  }

  if (_.isArray(self.single.insert) && (self.single.insert.length === 1) && _.isEmpty(self.single.insert[0])) {
    self.single.insert = [];
  }

  if (_.isEmpty(self.single.insert) && !_.isFunction(this.single.insert)) {
    return self._addReturningToSqlAndConvert('insert into ' + self.tableName + ' (' + self.formatter.wrap(self.single.returning) + ') values (default)', returning, self.tableName);
  }

  var insertData = self._prepInsert(self.single.insert);

  var sql = {};

  if (_.isString(insertData)) {
    return self._addReturningToSqlAndConvert('insert into ' + self.tableName + ' ' + insertData, returning);
  }

  if (insertData.values.length === 1) {
    return self._addReturningToSqlAndConvert('insert into ' + self.tableName + ' (' + self.formatter.columnize(insertData.columns) + ') values (' + self.formatter.parameterize(insertData.values[0]) + ')', returning, self.tableName);
  }

  var insertDefaultsOnly = (insertData.columns.length === 0);

  sql.sql = 'begin ' +
    _.map(insertData.values, function (value) {
        var returningHelper;
        var parameterizedValues = !insertDefaultsOnly ? self.formatter.parameterize(value) : '';
        var returningValues = _.isArray(returning) ? returning : [returning];
        var subSql = 'insert into ' + self.tableName + ' ';

        if (returning) {
          returningHelper = new ReturningHelper(returningValues.join(':'));
          sql.outParams = (sql.outParams || []).concat(returningHelper);
        }

        if (insertDefaultsOnly) {
          // no columns given so only the default value
          subSql += '(' + self.formatter.wrap(self.single.returning) + ') values (default)';
        } else {
          subSql += '(' + self.formatter.columnize(insertData.columns) + ') values (' + parameterizedValues + ')';
        }
        subSql += (returning ? ' returning ROWID into ' + self.formatter.parameter(returningHelper) : '');

        // pre bind position because subSql is an execute immediate parameter
        // later position binding will only convert the ? params
        subSql = self.formatter.client.positionBindings(subSql);
        return 'execute immediate \'' + subSql.replace(/'/g, "''") +
          ((parameterizedValues || returning) ? '\' using ' : '') +
          parameterizedValues +
          ((parameterizedValues && returning) ? ', ' : '') +
          (returning ? 'out ?' : '') + ';';
      }
    ).join(' ') +
    'end;';

  if (returning) {
    sql.returning = returning;
    // generate select statement with special order by to keep the order because 'in (..)' may change the order
    sql.returningSql = 'select ' + this.formatter.columnize(returning) +
      ' from ' + self.tableName +
      ' where ROWID in (' + sql.outParams.map(function (v, i) {return ':' + (i + 1);}).join(', ') + ')' +
      ' order by case ROWID ' + sql.outParams.map(function (v, i) {return 'when CHARTOROWID(:' + (i + 1) + ') then ' + i;}).join(' ') + ' end';
  }

  return sql;
};

// Update method, including joins, wheres, order & limits.
QueryCompiler_Oracle.prototype.update = function() {
  var updates = this._prepUpdate(this.single.update);
  var where   = this.where();
  return 'update ' + this.tableName +
    ' set ' + updates.join(', ') +
    (where ? ' ' + where : '');
};

// Compiles a `truncate` query.
QueryCompiler_Oracle.prototype.truncate = function() {
  return 'truncate table ' + this.tableName;
};

QueryCompiler_Oracle.prototype.forUpdate = function() {
  return 'for update';
};
QueryCompiler_Oracle.prototype.forShare = function() {
  // lock for share is not directly supported by oracle
  // use LOCK TABLE .. IN SHARE MODE; instead
  helpers.warn('lock for share is not supported by oracle dialect');
  return '';
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

QueryCompiler_Oracle.prototype.first =
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

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

QueryCompiler_Oracle.prototype._returning = function(value) {
  if (!value || value === '*') {
    return '';
  }

  var outParams;
  var self = this;
  if (_.isArray(value)) {
    outParams = _.map(value, function (v) {
      return self.formatter.parameter(new ReturningHelper(v));
    }).join (', ');
  } else {
    outParams = self.formatter.parameter(new ReturningHelper(value));
  }

  return ' returning ' + this.formatter.columnize(value) + ' into ' + outParams;
};

// Compiles an "insert" query, allowing for multiple
// inserts using a single query statement.
QueryCompiler_Oracle.prototype.insert = function() {
  var returning  = this.single.returning;
  var sql;
  if (_.isEmpty(this.single.insert)) {
    sql = 'insert into ' + this.tableName + ' (' + this.formatter.wrap(this.single.returning) + ') values (default)';
    sql += this._returning(returning);
  } else {
    var insertData = this._prepInsert(this.single.insert);
    if (_.isString(insertData)) {
      sql = 'insert into ' + this.tableName + ' ' + insertData;
      sql += this._returning(returning);
    } else  {
      var self = this;
      var multiInsert = insertData.values.length > 1;
      sql = (multiInsert ? 'insert all ' : 'insert ') +
        _.map(
          _.map(insertData.values, self.formatter.parameterize, self.formatter),
          function (value) {
            return 'into ' + self.tableName +
              ' (' + self.formatter.columnize(insertData.columns) + ') values (' + value + ')' +
              (multiInsert ? '' : self._returning(returning));
          }
        ).join(' ') + (multiInsert ? ' select 1 from dual' : '');
    }
  }
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

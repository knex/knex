
// Sqlanywhere Query Builder & Compiler
// ------
import {assign, reduce, compact} from 'lodash'
var inherits        = require('inherits');
var QueryCompiler   = require('../../../query/compiler');

// Query Compiler
// -------

// Set the "Formatter" to use for the queries,
// ensuring that all parameterized values (even across sub-queries)
// are properly built into the same query.
function QueryCompiler_Sqlanywhere(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_Sqlanywhere, QueryCompiler)

assign(QueryCompiler_Sqlanywhere.prototype, {

  _selectOverDML: function( dml, columns ) {
    if (!columns) {
        return dml;
    }
    if (!Array.isArray(columns)) {
      columns = [columns];
    }

    return {
      sql: 'select ' + this.formatter.columnize(columns) + ' from (' + dml + ') referencing (final as t_final)',
      returning: columns
    }
  },

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function() {
    var returning = this.single.returning;

    var insertValues = this.single.insert || [];
    var insertData = this._prepInsert(insertValues);
    var multiRow = (insertData.values && insertData.values.length > 1);

    var sql = '';
    if (returning && multiRow) {
      var sqls = [];
      var origValues = insertValues;
      if (!Array.isArray(insertValues)) {
        insertValues = [insertValues];
      }
      var i = -1;
      while (++i < insertValues.length) {
        this.single.insert = insertValues[i];
        sqls.push( this.insert().sql );
      }
      this.single.insert = origValues;

      if (!Array.isArray(returning)) {
        returning = [returning];
      }

      return {
        sql: sqls.join( ' union all ' ),
        returning: returning
      }
    }

    sql = QueryCompiler.prototype.insert.call(this)
    if (sql === '') return sql;
    return this._selectOverDML( sql, returning );
  },

  // Update method, including joins, wheres, order & limits.
  update: function() {
    var sql = QueryCompiler.prototype.update.call(this)
    if (sql === '') return sql;
    return this._selectOverDML( sql, this.single.returning );
  },

  // Compiles a `truncate` query.
  truncate: function() {
    return 'truncate table ' + this.tableName;
  },

  forUpdate: function() {
    return 'for update';
  },

  forShare: function() {
    return 'for read only';
  },

  // Compiles a `columnInfo` query.
  columnInfo: function() {
    var column = this.single.columnInfo;
    return {
      sql: 'select COLUMN_NAME, DOMAIN_NAME, WIDTH, NULLS, "DEFAULT" from SYS.SYSTABCOL C join SYS.SYSTAB T on C.TABLE_ID = T.TABLE_ID join SYS.SYSDOMAIN D on C.DOMAIN_ID = D.DOMAIN_ID where TABLE_NAME = ?',
      bindings: [this.single.table],
      output: function(resp) {
          var out = reduce(resp, function(columns, val) {
          columns[val.COLUMN_NAME] = {
            type: val.DOMAIN_NAME,
            maxLength: val.WIDTH,
            nullable: (val.NULLS === 'Y')
          };
          if (val.DEFAULT !== null) {
            columns[val.COLUMN_NAME].defaultValue = val.DEFAULT;
          }
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  },

  // Compiles the `select` statement, or nested sub-selects
  // by calling each of the component compilers, trimming out
  // the empties, and returning a generated query string.
  select: function() {
    var i = -1, statements = [];
    while (++i < components.length) {
      statements.push(this[components[i]](this));
    }
    return compact(statements).join(' ');
  },

  limit: function() {
    var limit = this.single.lmit;
    var noLimit = !limit && limit !== 0;
    if(this.single.offset && noLimit) {
      noLimit = false;
      limit = 1234;
    }
    if (noLimit) return '';
    return 'top ' + this.formatter.parameter(limit) + ' ';
  },

  offset: function() {
    if (!this.single.offset) return '';
    return 'start at ' + this.formatter.parameter(this.single.offset) + ' ';
  },

  columns: function() {
    var distinct = false;
    if (this.onlyUnions()) return ''
    var columns = this.grouped.columns || []
    var i = -1, sql = [];
    if (columns) {
      while (++i < columns.length) {
        var stmt = columns[i];
        if (stmt.distinct) distinct = true
        if (stmt.type === 'aggregate') {
          sql.push(this.aggregate(stmt))
        }
        else if (stmt.value && stmt.value.length > 0) {
          sql.push(this.formatter.columnize(stmt.value))
        }
      }
    }
    if (sql.length === 0) sql = ['*'];
    return 'select ' + (distinct ? 'distinct ' : '') +
      this.limit() + this.offset() +
      sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
  },

  aggregate: function(stmt) {
    var val = stmt.value;
    var splitOn = val.toLowerCase().indexOf(' as ');
    var distinct = stmt.aggregateDistinct ? 'distinct ' : '';
    // Allows us to speciy an alias for the aggregate types.
    if (splitOn !== -1) {
      var col = val.slice(0, splitOn);
      var alias = val.slice(splitOn + 4);
      return stmt.method + '(' + distinct + this.formatter.wrap(col) + ') ' + this.formatter.wrap(alias);
    }
    return stmt.method + '(' + distinct + this.formatter.wrap(val) + ')';
  },

  multiWhereIn: function(statement) {
    var i = -1, sql = 'ROW(' + this.formatter.columnize(statement.column) + ') '
    sql += this._not(statement, 'in ') + '(ROW('
    while (++i < statement.value.length) {
      if (i !== 0) sql += '),ROW('
      sql += this.formatter.parameterize(statement.value[i])
    }
    return sql + '))'
  },

})

// Compiles the `select` statement, or nested sub-selects
// by calling each of the component compilers, trimming out
// the empties, and returning a generated query string.
QueryCompiler_Sqlanywhere.prototype.first = QueryCompiler_Sqlanywhere.prototype.select

var components = [
  'columns', 'join', 'where', 'union', 'group', 'having', 'order', 'lock'
];


module.exports = QueryCompiler_Sqlanywhere;

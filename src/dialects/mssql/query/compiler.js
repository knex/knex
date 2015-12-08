
// MSSQL Query Compiler
// ------
var inherits      = require('inherits')
var QueryCompiler = require('../../../query/compiler')
var assign        = require('lodash/object/assign');

function QueryCompiler_MSSQL(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_MSSQL, QueryCompiler)

assign(QueryCompiler_MSSQL.prototype, {

  _emptyInsertValue: '() values ()',

  // Update method, including joins, wheres, order & limits.
  update: function() {
    var join    = this.join();
    var updates = this._prepUpdate(this.single.update);
    var where   = this.where();
    var order   = this.order();
    var limit   = this.limit_();
    return 'update ' + (limit ? limit + ' ' : '') + this.tableName +
      (join ? ' ' + join : '') +
      ' set ' + updates.join(', ') +
      (where ? ' ' + where : '') +
      (order ? ' ' + order : '');
  },

  // Compiles the columns in the query, specifying if an item was distinct.
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
    var limit = this.limit_();
    return 'select ' + (distinct ? 'distinct ' : '') + 
      (limit ? limit + ' ' : '') +
      sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
  },
  
  // Compiles a `truncate` query.
  truncate: function() {
    return 'truncate table ' + this.tableName;
  },

  forUpdate: function() {
    return 'with (READCOMMITTEDLOCK)';
  },

  forShare: function() {
    return 'with (NOLOCK)';
  },

  // Compiles a `columnInfo` query.
  columnInfo: function() {
    var column = this.single.columnInfo;
    return {
      sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
      bindings: [this.single.table, this.client.database()],
      output: function(resp) {
        var out = resp.reduce(function(columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE,
            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
            nullable: (val.IS_NULLABLE === 'YES')
          };
          return columns
        }, {})
        return column && out[column] || out;
      }
    };
  },

  limit_: function() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit) return '';
    return 'top (' + this.formatter.parameter(this.single.limit) + ')';
  },

  limit: function() {
    return '';
  }

})

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_MSSQL;

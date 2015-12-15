
// MSSQL Query Compiler
// ------
var _             = require('lodash');
var inherits      = require('inherits')
var QueryCompiler = require('../../../query/compiler')
var assign        = require('lodash/object/assign');

function QueryCompiler_MSSQL(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_MSSQL, QueryCompiler)

assign(QueryCompiler_MSSQL.prototype, {

  _emptyInsertValue: 'default values',

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function() {
    var insertValues = this.single.insert || [];
    var sql = 'insert into ' + this.tableName + ' ';
    var returning = this.single.returning;
    var returningSql = (returning ? this._returning('insert', returning) + ' ' : '')

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return ''
      }
    } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
      return {
        sql: sql + returningSql + this._emptyInsertValue,
        returning: returning
      };
    }

    var insertData = this._prepInsert(insertValues);
    if (typeof insertData === 'string') {
      sql += insertData;
    } else  {
      if (insertData.columns.length) {
        sql += '(' + this.formatter.columnize(insertData.columns) 
        sql += ') ' + returningSql + 'values ('
        var i = -1
        while (++i < insertData.values.length) {
          if (i !== 0) sql += '), ('
          sql += this.formatter.parameterize(insertData.values[i])
        }
        sql += ')';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue
      } else {
        sql = ''
      }
    }
    return {
      sql: sql,
      returning: returning
    };
  },
  
  // Compiles an `update` query, allowing for a return value.
  update: function() {
    var updates   = this._prepUpdate(this.single.update);
    var join      = this.join();
    var where     = this.where();
    var order     = this.order();
    var top       = this.top();
    var returning = this.single.returning;
    return {
      sql: 'update ' + (top ? top + ' ' : '') + this.tableName +
        (join ? ' ' + join : '') +
        ' set ' + updates.join(', ') +
        (returning ? ' ' + this._returning('update', returning) : '') +
        (where ? ' ' + where : '') +
        (order ? ' ' + order : '') +
        (!returning ? this._returning('rowcount', '@@rowcount') : ''),
      returning: returning || '@@rowcount'
    };
  },

  // Compiles a `delete` query.
  del: function() {
    // Make sure tableName is processed by the formatter first.
    var tableName  = this.tableName;
    var wheres = this.where();
    var returning = this.single.returning;
    return {
      sql: 'delete from ' + tableName +
        (returning ? ' ' + this._returning('del', returning) : '') +
        (wheres ? ' ' + wheres : '') +
        (!returning ? this._returning('rowcount', '@@rowcount') : ''),
      returning: returning || '@@rowcount'
    };
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
    var top = this.top();
    return 'select ' + (distinct ? 'distinct ' : '') + 
      (top ? top + ' ' : '') +
      sql.join(', ') + (this.tableName ? ' from ' + this.tableName : '');
  },

  _returning: function(method, value) {
    switch (method) {
      case 'update':
      case 'insert': return value ? 'output ' + this.formatter.columnizeWithPrefix('inserted.', value) : '';
      case 'del': return value ? 'output ' + this.formatter.columnizeWithPrefix('deleted.', value) : '';
      case 'rowcount': return value ? ';select @@rowcount' : '';
    }
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
      sql: 'select * from information_schema.columns where table_name = ? and table_schema = \'dbo\'',
      bindings: [this.single.table],
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

  top: function() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    var noOffset = !this.single.offset;
    if (noLimit || !noOffset) return '';
    return 'top (' + this.formatter.parameter(this.single.limit) + ')';
  },

  limit: function() {
    return '';
  },
  
  offset: function() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    var noOffset = !this.single.offset;
    if (noOffset) return '';
    var offset = 'offset ' + (noOffset ? '0' : this.formatter.parameter(this.single.offset)) + ' rows';
    if (!noLimit) {
      offset += ' fetch next ' + this.formatter.parameter(this.single.limit) + ' rows only';
    }
    return offset;
  },
  
})

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_MSSQL;


// Firebird Query Compiler
// ------
var _             = require('lodash');
var inherits      = require('inherits')
var QueryCompiler = require('../../../query/compiler')
var assign        = require('lodash/object/assign')

function QueryCompiler_Firebird(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_Firebird, QueryCompiler)

assign(QueryCompiler_Firebird.prototype, {

  _emptyInsertValue: '() values ()',

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
        
        console.log('insertData ------');
        console.log(insertData.values.length);
        console.log(insertData);
        
        while (++i < insertData.values.length) {
          if (i !== 0) sql += '), ('
          sql += this.formatter.parameterize(insertData.values[i])
          
        console.log('CONCATENATION');
        console.log(insertData.values[i]);
        console.log(sql);
            
        }
        sql += ')';
      } else if (insertValues.length === 1 && insertValues[0]) {
        sql += returningSql + this._emptyInsertValue
      } else {
        sql = ''
      }
    }
    console.log(sql);
    console.log(returning);
    return {
      sql: sql,
      returning: returning
    };
  },
  
  
  _returning: function(method, value) {
    switch (method) {
      case 'update':
      case 'insert': return 'ROWID';
      case 'del': return value ? 'output ' + this.columnizeWithPrefix('deleted.', value) : '';
      case 'rowcount': return value ? ';select @@rowcount' : '';
    }
  },
  
  columnizeWithPrefix: function(prefix, target) {
    var columns = typeof target === 'string' ? [target] : target
    var str = '', i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', '
      str += prefix + this.wrap(columns[i])
    }
    return str
  },
  
  // Update method, including joins, wheres, order & limits.
  update: function() {
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

  limit: function() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    return 'limit ' + ((this.single.offset && noLimit) ? '18446744073709551615' : this.formatter.parameter(this.single.limit));
  }

})

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_Firebird;
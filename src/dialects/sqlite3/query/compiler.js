
// SQLite3 Query Builder & Compiler

var _             = require('lodash')
var inherits      = require('inherits')
var QueryCompiler = require('../../../query/compiler')
var assign        = require('lodash/object/assign');

function QueryCompiler_SQLite3(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_SQLite3, QueryCompiler)

assign(QueryCompiler_SQLite3.prototype, {

  // The locks are not applicable in SQLite3
  forShare:  emptyStr,
  
  forUpdate: emptyStr,

  // SQLite requires us to build the multi-row insert as a listing of select with
  // unions joining them together. So we'll build out this list of columns and
  // then join them all together with select unions to complete the queries.
  insert: function() {
    var insertValues = this.single.insert || []
    var sql = 'insert into ' + this.tableName + ' '

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return ''
      }
      else if (insertValues.length === 1 && insertValues[0] && _.isEmpty(insertValues[0])) {
        return sql + this._emptyInsertValue
      }
    } else if (typeof insertValues === 'object' && _.isEmpty(insertValues)) {
      return sql + this._emptyInsertValue
    }

    var insertData = this._prepInsert(insertValues)
    
    if (_.isString(insertData)) {
      return sql + insertData
    }
    
    if (insertData.columns.length === 0) {
      return '';
    }

    sql += '(' + this.formatter.columnize(insertData.columns) + ')'
    
    if (insertData.values.length === 1) {
      return sql + ' values (' + this.formatter.parameterize(insertData.values[0]) + ')'
    }
    
    var blocks = []
    var i      = -1
    while (++i < insertData.values.length) {
      var i2 = -1, block = blocks[i] = []
      var current = insertData.values[i]
      while (++i2 < insertData.columns.length) {
        block.push(this.formatter.alias(
          this.formatter.parameter(current[i2]),
          this.formatter.wrap(insertData.columns[i2])
        ))
      }
      blocks[i] = block.join(', ')
    }
    return sql + ' select ' + blocks.join(' union all select ')
  },

  // Compile a truncate table statement into SQL.
  truncate: function() {
    var table = this.tableName
    return {
      sql: 'delete from ' + table,
      output: function() {
        return this.query({sql: 'delete from sqlite_sequence where name = ' + table}).catch(function() {})
      }
    }
  },

  // Compiles a `columnInfo` query
  columnInfo: function() {
    var column = this.single.columnInfo
    return {
      sql: 'PRAGMA table_info(' + this.single.table +')',
      output: function(resp) {
        var maxLengthRegex = /.*\((\d+)\)/
        var out = _.reduce(resp, function (columns, val) {
          var type = val.type
          var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1]
          type = maxLength ? type.split('(')[0] : type
          columns[val.name] = {
            type: type.toLowerCase(),
            maxLength: maxLength,
            nullable: !val.notnull,
            defaultValue: val.dflt_value
          }
          return columns
        }, {})
        return column && out[column] || out
      }
    }
  },

  limit: function() {
    var noLimit = !this.single.limit && this.single.limit !== 0
    if (noLimit && !this.single.offset) return ''
  
    // Workaround for offset only, 
    // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
    return 'limit ' + this.formatter.parameter(noLimit ? -1 : this.single.limit)
  }

})

function emptyStr() {
  return ''
}


module.exports = QueryCompiler_SQLite3

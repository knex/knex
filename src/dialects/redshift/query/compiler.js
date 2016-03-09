
// Redshift Query Builder & Compiler
// ------
var _        = require('lodash');
var inherits = require('inherits');

var QueryCompiler = require('../../../query/compiler');
var assign        = require('lodash/object/assign');

function QueryCompiler_Redshift(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_Redshift, QueryCompiler);

assign(QueryCompiler_Redshift.prototype, {

  // Compiles a truncate query.
  truncate: function() {
    return 'truncate ' + this.tableName + ' restart identity';
  },

  // is used if the an array with multiple empty values supplied
  _defaultInsertValue: 'default',

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert: function() {
    var sql = QueryCompiler.prototype.insert.call(this)
    if (sql === '') return sql;
    return {
      sql: sql
    };
  },

  // Compiles an `update` query, allowing for a return value.
  update: function() {
    var updateData = this._prepUpdate(this.single.update);
    var wheres     = this.where();
    return {
      sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') + (wheres ? ' ' + wheres : '')
    };
  },

  // Compiles an `update` query, allowing for a return value.
  del: function() {
    var sql = QueryCompiler.prototype.del.apply(this, arguments);
    return {
      sql: sql
    };
  },

  forUpdate: function() {
    return 'for update';
  },

  forShare: function() {
    return 'for share';
  },

  // Compiles a columnInfo query
  columnInfo: function() {
    var column = this.single.columnInfo;

    var sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    var bindings = [this.single.table, this.client.database()];

    if (this.single.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.single.schema);
    } else {
      sql += ' and table_schema = current_schema';
    }

    return {
      sql: sql,
      bindings: bindings,
      output: function(resp) {
        var out = _.reduce(resp.rows, function(columns, val) {
          columns[val.column_name] = {
            type: val.data_type,
            maxLength: val.character_maximum_length,
            nullable: (val.is_nullable === 'YES'),
            defaultValue: val.column_default
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  }

})

module.exports = QueryCompiler_Redshift;


// PostgreSQL Query Builder & Compiler
// ------
var _        = require('lodash');
var inherits = require('inherits');

var QueryCompiler = require('../../../query/compiler');
var assign        = require('lodash/object/assign');

function QueryCompiler_PG(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_PG, QueryCompiler);

assign(QueryCompiler_PG.prototype, {

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
    var returning = this.single.returning;
    return {
      sql: sql + this._returning(returning),
      returning: returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  update: function() {
    var updateData = this._prepUpdate(this.single.update);
    var wheres     = this.where();
    var returning  = this.single.returning;
    return {
      sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') +
      (wheres ? ' ' + wheres : '') +
      this._returning(returning),
      returning: returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  del: function() {
    var sql = QueryCompiler.prototype.del.apply(this, arguments);
    var returning  = this.single.returning;
    return {
      sql: sql + this._returning(returning),
      returning: returning
    };
  },

  _returning: function(value) {
    return value ? ' returning ' + this.formatter.columnize(value) : '';
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

module.exports = QueryCompiler_PG;

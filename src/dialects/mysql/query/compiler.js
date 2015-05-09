
// MySQL Query Compiler
// ------
var inherits      = require('inherits')
var QueryCompiler = require('../../../query/compiler')
var assign        = require('lodash/object/assign');

function QueryCompiler_MySQL(client, builder) {
  QueryCompiler.call(this, client, builder)
}
inherits(QueryCompiler_MySQL, QueryCompiler)

assign(QueryCompiler_MySQL.prototype, {

  _emptyInsertValue: '() values ()',

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

  forUpdate: function() {
    return 'for update';
  },

  forShare: function() {
    return 'lock in share mode';
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

    // Workaround for offset only, see http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
    return 'limit ' + ((this.single.offset && noLimit) ? '18446744073709551615' : this.formatter.parameter(this.single.limit));
  }

})

// Set the QueryBuilder & QueryCompiler on the client object,
// incase anyone wants to modify things to suit their own purposes.
module.exports = QueryCompiler_MySQL;

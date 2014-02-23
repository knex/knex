// Extend the base compiler with the necessary grammar
var push = Array.prototype.push;

module.exports = function(client) {

  var QueryCompiler = require('../../../query/compiler')(client);

  return QueryCompiler.extend({

    // Compile an insert statement into SQL.
    insert: function() {
      var insert = this.get('insert');

      var sql = 'insert into ' + this.tableName + ' ';
      if (insert.rawData[0].length === 0) {
        sql += 'default values';
      } else {
        sql += insert.columns;

        if (insert.rawData.length === 1) {
          sql += ' values ' + insert.value;
        }
      }

      // If there is only one record being inserted, we will just use the usual query
      // grammar insert builder because no special syntax is needed for the single
      // row inserts in SQLite. However, if there are multiples, we'll continue.
      if (insert.rawData.length <= 1) {
        push.apply(this.bindings, insert.bindings);
        return sql;
      }

      var blocks = [];

      // SQLite requires us to build the multi-row insert as a listing of select with
      // unions joining them together. So we'll build out this list of columns and
      // then join them all together with select unions to complete the queries.
      for (var i = 0, l = insert.rawData.length; i < l; i++) {
        var block = blocks[i] = [];
        var current = insert.rawData[i];
        var columnList = insert.columnList;
        for (var i2 = 0, l2 = current.length; i2 < l2; i2++) {
          block.push('? as ' + columnList[i2]);
        }
        blocks[i] = block.join(', ');
      }
      push.apply(this.bindings, insert.bindings);

      return sql + ' select ' + blocks.join(' union all select ');
    },

    // Compiles an `update` query.
    update: function() {
      var updateData = this.get('update');
      push.apply(this.bindings, updateData.bindings);
      var wheres = this.where();
      var joins  = this.join();
      var join   = joins.sql ? ' ' + joins.sql : '';
      return 'update ' + this.tableName + join + ' set ' + updateData.columns + ' ' + wheres;
    },

    // Compile a truncate table statement into SQL.
    truncate: function() {
      var table = this.tableName;
      return {
        sql: 'delete from sqlite_sequence where name = ' + this.tableName,
        output: function() {
          return this.query({sql: 'delete from ' + table});
        }
      };
    }

  });

};
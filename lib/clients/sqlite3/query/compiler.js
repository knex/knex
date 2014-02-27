// Extend the base compiler with the necessary grammar
module.exports = function(client) {

  var _ = require('lodash');
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
        return {
          sql: sql,
          bindings: insert.bindings
        };
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

      return {
        sql: sql + ' select ' + blocks.join(' union all select '),
        bindings: insert.bindings
      };
    },

    // Compiles an `update` query.
    update: function() {
      var wheres = this.where();
      var joins  = this.join();
      var join   = joins.sql ? ' ' + joins.sql : '';
      var updateData = this.get('update');
      return {
        sql: 'update ' + this.tableName + join + ' set ' + updateData.columns + ' ' + wheres.sql,
        bindings: updateData.bindings.concat(wheres.bindings)
      };
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
    },

    // Compiles a columnInfo query
    columnInfo: function () {
      var tableName = this.tableName.substr(1, this.tableName.length-2);

      return {
        sql: 'PRAGMA table_info(' + tableName +')',
        output: function(resp) {
          var maxLengthRegex = /.*\((\d+)\)/;
          return _.reduce(resp, function (columns, val) {
            var type = val.type;
            var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1];
            type = maxLength ? type.split('(')[0] : type;
            columns[val.name] = {
              type: type.toLowerCase(),
              charMaxLength: maxLength
            };
            return columns;
          }, {});
        }
      };
    }

  });

};

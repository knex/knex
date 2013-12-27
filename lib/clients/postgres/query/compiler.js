
// Extend the base compiler with the necessary grammar
module.exports = function(client) {

  var _        = require('lodash');
  var QueryCompiler = require('../../../query/compiler')(client);

  return QueryCompiler.extend({

    // Compiles a truncate query.
    truncate: function() {
      return {
        sql: 'truncate ' + this.tableName + ' restart identity'
      };
    },

    // Compiles an `insert` query, allowing for multiple
    // inserts using a single query statement.
    insert: function() {
      var insertData = this.get('insert');
      var sql = 'insert into ' + this.tableName + ' ';
      if (insertData.columns === '()') {
        sql += 'default values';
      } else {
        sql += insertData.columns + ' values ' + insertData.value;
      }
      var returning = this.get('returning');
      return {
        sql: sql + (returning.value ? ' ' + returning.value : ''),
        bindings: _.flatten(insertData.bindings)
      };
    },

    // TODO: Update all the response thingers here.

    // Compiles an `update` query, allowing for a return value.
    update: function() {
      var wheres = this.where();
      var updateData = this.get('update');
      var returning = this.get('returning');
      var returnVal = (returning.value ? ' ' + returning.value : '');
      return {
        sql: 'update ' + this.tableName + ' set ' + updateData.columns + ' ' + wheres.sql + returnVal,
        bindings: updateData.bindings.concat(wheres.bindings),
      };
    }

  });

};
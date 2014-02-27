module.exports = function(client) {

  var _ = require('lodash');
  var QueryCompiler = require('../../../query/compiler')(client);

  return QueryCompiler.extend({

    update: function() {
      var where  = this.where();
      var join   = this.join();
      var order  = this.order();
      var limit  = this.limit();

      var joinSql  = join.sql ? ' ' + join.sql : '';
      var orderSql = order.sql ? ' ' + order.sql : '';
      var limitSql = limit.sql ? ' ' + limit.sql : '';
      var updateData = this.get('update');
      return {
        sql: 'update ' + this.tableName + joinSql + ' set ' + updateData.columns + ' ' + where.sql + orderSql + limitSql,
        bindings: _.compact(updateData.bindings.concat(where.bindings, order.bindings, limit.bindings))
      };
    },

    // Compiles a columnInfo query
    columnInfo: function () {
      // this.tableName is already escaped, so we unescape it
      var tableName = this.tableName.substr(1, this.tableName.length-2);

      return {
        sql: 'select column_name, data_type, character_maximum_length from information_schema.columns where table_name = "' + tableName + '" and table_schema = "' + client.database() + '"',
        output: function(resp) {
          return _.reduce(resp, function (columns, val) {
            columns[val.column_name] = {
              type: val.data_type,
              charMaxLength: val.character_maximum_length
            };
            return columns;
          }, {});
        }
      };
    }

  });

};

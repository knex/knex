module.exports = function(client) {

  var _ = require('lodash');
  var QueryCompiler = require('../../../query/compiler')(client);

  return QueryCompiler.extend({

    update: function() {
      var where  = this.where();
      var join   = this.join();
      var order  = this.order();
      var limit  = this.limit();

      var joinSql  = join.sql  ? ' ' + join.sql  : '';
      var orderSql = order.sql ? ' ' + order.sql : '';
      var limitSql = limit.sql ? ' ' + limit.sql : '';
      var updateData = this.get('update');
      return {
        sql: 'update ' + this.tableName + joinSql + ' set ' + updateData.columns + ' ' + where.sql + orderSql + limitSql,
        bindings: _.compact(updateData.bindings.concat(where.bindings, order.bindings, limit.bindings))
      };
    }

  });

};
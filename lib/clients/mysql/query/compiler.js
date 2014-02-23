var push = Array.prototype.push;

module.exports = function(client) {

  var _ = require('lodash');
  var QueryCompiler = require('../../../query/compiler')(client);

  return QueryCompiler.extend({

    update: function() {
      var updateData = this.get('update');
      push.apply(this.bindings, updateData.bindings);
      var where  = this.where();
      var join   = this.join();
      var order  = this.order();
      var limit  = this.limit();

      var joinSql  = join ? ' ' + join : '';
      var orderSql = order ? ' ' + order : '';
      var limitSql = limit ? ' ' + limit : '';
      return 'update ' + this.tableName + joinSql + ' set ' + updateData.columns + ' ' + where + orderSql + limitSql;
    }

  });

};
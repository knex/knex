var _ = require('lodash');
var inherits = require('inherits');
var assign = require('lodash/object/assign');
var Oracle_Compiler = require('../../oracle/query/compiler');
var ReturningHelper = require('../../oracle/utils').ReturningHelper;
var BlobHelper = require('../utils').BlobHelper;

function Oracledb_Compiler(client, builder) {
  Oracle_Compiler.call(this, client, builder);
}
inherits(Oracledb_Compiler, Oracle_Compiler);

assign(Oracledb_Compiler.prototype, {
  _addReturningToSqlAndConvert: function(sql, returning) {
    var self = this;
    var res = {
      sql: sql
    };

    if (!returning) {
      return res;
    }
    
    var returningValues = Array.isArray(returning) ? returning : [returning];
    var returningClause = '';
    var intoClause = '';
    _.remove(returningValues, function(ret){
      var columnName = ret.columnName || ret;
      returningClause += '"' + columnName + '",';
      intoClause += '?,';
      if (ret instanceof BlobHelper) {
        return true;
      }
      self.formatter.bindings.push(new ReturningHelper(columnName));
      return false;
    });
    returningClause = returningClause.slice(0,-1);
    intoClause = intoClause.slice(0,-1);
    res.sql = sql + ' returning ' + returningClause + ' into ' + intoClause;
    res.returning = returningValues.length;
    var returningHelper = new ReturningHelper(returningValues.join(':'));
    res.outParams = [returningHelper];
    return res;
  }  
});

module.exports = Oracledb_Compiler;
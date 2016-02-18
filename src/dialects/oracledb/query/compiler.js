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
    var res = {
      sql: sql
    };

    if (!returning) {
      return res;
    }
    
    var returningValues = Array.isArray(returning) ? returning : [returning];
    this.formatter.bindings.unshift(new ReturningHelper('ROWID'));
    var returningClause = 'ROWID,';
    var intoClause = ':1,';
    returningValues.forEach(function(ret, index){
      returningClause += '"' + ret.columnName + '",';
      intoClause += ':' + (index + 2) + ',';
    });
    returningClause = returningClause.slice(0,-1);
    intoClause = intoClause.slice(0,-1);
    res.sql = sql + ' returning ' + returningClause + ' into ' + intoClause;
    _.remove(returningValues, function(val){
      if (val instanceof BlobHelper) {
        return true;
      }
      return false;
    });
    if (!returningValues.length) {
      returningValues.push(new ReturningHelper('ROWID'));
    }
    var returningHelper = new ReturningHelper(returningValues.join(':'));
    res.outParams = [returningHelper];
    return res;
  }  
});

module.exports = Oracledb_Compiler;
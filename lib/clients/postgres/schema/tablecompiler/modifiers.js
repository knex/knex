module.exports = function() {
  var _ = require('lodash');
  return _.extend({}, require('../../../../schema/tablecompiler/modifiers'), {

    comment: function(comment) {
      this.returnSql.push({
        sql: 'comment on column ' + this.tableName + '.' + this._wrap(this.currentColumn.args[0]) + " is " + (comment ? "'" + comment + "'" : 'NULL')
      });
    }

  });
};
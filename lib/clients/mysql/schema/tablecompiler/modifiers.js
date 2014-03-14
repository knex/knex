module.exports = function(client) {
  var _ = require('lodash');
  var BaseModifiers = require('../../../../schema/tablecompiler/modifiers');

  return _.extend({}, BaseModifiers, {

    // Get the SQL for a default column modifier.
    defaultTo: function MySQLModifiers$defaultTo(value) {
      var defaultVal = BaseModifiers.defaultTo.apply(this, arguments);
      var column = this.currentColumn;
      if (column.method != 'blob' && column.method.indexOf('text') === -1) {
        return defaultVal;
      }
      return '';
    },

    // Get the SQL for an unsigned column modifier.
    unsigned: function() {
      return 'unsigned';
    },

    // Get the SQL for an "after" column modifier.
    after: function(column) {
      return 'after ' + this.formatter.wrap(column);
    },

    // Get the SQL for a comment column modifier.
    comment: function(comment) {
      var maxColumnCommentLength = 255;
      if (comment) return "comment '" + comment + "'";
    }

  });
};
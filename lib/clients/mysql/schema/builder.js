module.exports = function(client) {
  var _       = require('lodash');
  var Helpers = require('../../../helpers');
  var SchemaBuilder = require('../../../schema/builder')(client);

  return SchemaBuilder.extend({

    // Rename a table on the schema.
    renameTable: function(tableName, to) {
      this.sequence.push({
        sql: 'rename table ' + this._wrap(tableName) + ' to ' + this._wrap(to)
      });
      return this;
    },

    hasTable: function(tableName) {
      this.sequence.push({
        sql: 'select * from information_schema.tables where table_schema = ? and table_name = ?',
        bindings: [client.database(), tableName],
        output: function(resp) {
          return resp.length > 0;
        }
      });
      return this;
    },

    hasColumn: function(tableName, column) {
      this.sequence.push({
        sql: 'show columns from ' + this._wrap(tableName) + ' like ?',
        bindings: [column],
        output: function(resp) {
          return resp.length > 0;
        }
      });
      return this;
    }

  });

};
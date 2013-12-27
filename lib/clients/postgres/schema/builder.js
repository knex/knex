module.exports = function(client) {
  var _       = require('lodash');
  var Helpers = require('../../../helpers');
  var SchemaBuilder = require('../../../schema/builder')(client);

  return SchemaBuilder.extend({

    // Compile the query to determine if a table exists.
    hasTable: function(tableName) {
      this.sequence.push({
        sql: 'select * from information_schema.tables where table_name = ?',
        bindings: [tableName],
        output: function(resp) {
          return resp.rows.length > 0;
        }
      });
      return this;
    },

    // Compile the query to determine if a column exists in a table.
    hasColumn: function(tableName, columnName) {
      this.sequence.push({
        sql: 'select * from information_schema.columns where table_name = ? and column_name = ?',
        bindings: [tableName, columnName],
        output: function(resp) {
          return resp.rows.length > 0;
        }
      });
      return this;
    },

    // Compile a rename table command.
    renameTable: function(from, to) {
      this.sequence.push({
        sql: 'alter table ' + this._wrap(from) + ' rename to ' + this._wrap(to)
      });
      return this;
    }

  });

};
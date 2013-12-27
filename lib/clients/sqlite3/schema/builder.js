// SQLite3 SchemaGrammar
// -------
module.exports = function(client) {
  var _       = require('lodash');
  var Helpers = require('../../../helpers');
  var SchemaBuilder = require('../../../schema/builder')(client);

  return SchemaBuilder.extend({

    // Compile the query to determine if a table exists.
    hasTable: function(tableName) {
      this.sequence.push({
        sql: "select * from sqlite_master where type = 'table' and name = ?",
        bindings: [tableName],
        output: function(resp) {
          return resp.length > 0;
        }
      });
      return this;
    },

    // Compile the query to determine if a column exists.
    hasColumn: function(tableName, column) {
      this.sequence.push({
        sql: 'PRAGMA table_info(' + this._wrap(tableName) + ')',
        output: function(resp) {
          return _.findWhere(resp, {name: column}) != null;
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
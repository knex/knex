module.exports = function(client) {

  var _ = require('lodash');
  var SchemaTableCompiler = require('../../../schema/tablecompiler')(client);

  return SchemaTableCompiler.extend({

    // The possible column modifiers.
    modifierTypes: ['unsigned', 'nullable', 'defaultTo', 'after', 'comment'],

    // All types for sqlite3 builder. Feel free to fiddle with them on
    // the client object if you wish, they're unique per-client.
    types: require('./tablecompiler/types')(),

    // All modifiers for the sqlite3 builder.
    modifiers: require('./tablecompiler/modifiers')(),

    // All key related statements for the sqlite3 builder.
    keys: require('./tablecompiler/keys')(),

    // Create a new table
    create: function() {
      var conn = {};
      var returnSql = SchemaTableCompiler.prototype.create.apply(this, arguments);
      var sql = returnSql[0].sql;

      // Check if the connection settings are set.
      if (client.connectionSettings) {
        conn = client.connectionSettings;
      }
      var charset = this.attributes.charset || conn.charset;
      var collation = this.attributes.collate || conn.collate;
      var engine = this.attributes.engine;


      // var conn = builder.client.connectionSettings;
      if (charset) sql += ' default character set ' + charset;
      if (collation) sql += ' collate ' + collation;
      if (engine) sql += ' engine = ' + engine;

      // // TODO: Handle max comment length ?
      var maxTableCommentLength = 60;
      var hasComment = _.has(this.attributes, 'comment');
      if (hasComment) sql += " comment = '" + (this.attributes.comment || '') + "'";

      returnSql[0].sql = sql;

      return returnSql;
    },

    addColumnsPrefix: 'add ',

    dropColumnPrefix: 'drop ',

    // Compiles the comment on the table.
    comment: function(comment) {
      return {
        sql: 'alter table ' + this.tableName + " comment = '" + comment + "'"
      };
    },

    // Renames a column on the table.
    renameColumn: function(from, to) {
      var wrapped = this._wrap(from) + ' ' + this._wrap(to);
      var table = this.tableName;
      return {
        sql: 'show fields from ' + this.tableName + ' where field = ?',
        bindings: [from],
        output: function(resp) {
          var column = resp[0];
          return this.query({
            sql: 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type
          });
        }
      };
    }

  });

};
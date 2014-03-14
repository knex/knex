module.exports = function(client) {

  var _ = require('lodash');
  var SchemaTableCompiler = require('../../../schema/tablecompiler')(client);

  return SchemaTableCompiler.extend({

    // The possible column modifiers.
    modifierTypes: ['nullable', 'defaultTo', 'comment'],

    // All types for sqlite3 builder. Feel free to fiddle with them on
    // the client object if you wish, they're unique per-client.
    types: require('./tablecompiler/types')(client),

    // All modifiers for the sqlite3 builder.
    modifiers: require('./tablecompiler/modifiers')(client),

    // All key related statements for the sqlite3 builder.
    keys: require('./tablecompiler/keys')(client),

    // Compile a rename column command.
    renameColumn: function(from, to) {
      return {
        sql: 'alter table ' + this.tableName + ' rename '+ this._wrap(from) + ' to ' + this._wrap(to)
      };
    },

    compileAdd: function(builder) {
      var table = this._wrap(builder);
      var columns = this.prefixArray('add column', this.getColumns(builder));
      return {
        sql: 'alter table ' + table + ' ' + columns.join(', ')
      };
    },

    create: function() {
      var create = SchemaTableCompiler.prototype.create.apply(this, arguments);
      var hasComment = _.has(this.attributes, 'comment');
      if (hasComment) create.push({sql: 'comment on table ' + this.tableName + ' is ' + "'" + this.attributes.comment + "'"});
      return create;
    }

  });

};
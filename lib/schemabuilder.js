// Schema Builder
// -------
(function(define) {

"use strict";

define(function(require, exports) {

  var _       = require('underscore');

  var Common  = require('./common').Common;
  var Helpers = require('./helpers').Helpers;

  var SchemaBuilder = function(knex) {
    this.knex     = knex;
    this.client   = knex.client;
    this.grammar  = knex.schemaGrammar;
    this.columns  = [];
    this.commands = [];
    this.bindings = [];
    this.flags    = {};
    _.bindAll(this, 'handleResponse');
  };

  var toClone = ['columns', 'commands', 'bindings', 'flags'];

  _.extend(SchemaBuilder.prototype, Common, {

    _source: 'SchemaBuilder',

    clone: function() {
      return _.reduce(toClone, function(memo, key) {
        memo[key] = Helpers.deepClone(this[key]);
        return memo;
      }, this.instance(), this);
    },

    // A callback from the table building `Knex.schemaBuilder` calls.
    callback: function(callback) {
      if (callback) callback.call(this, this);
      return this;
    },

    // Determine if the blueprint has a create command.
    creating: function() {
      for (var i = 0, l = this.commands.length; i < l; i++) {
        if (this.commands[i].name == 'createTable') return true;
      }
      return false;
    },

    // Sets the engine to use when creating the table in MySql
    engine: function(name) {
      if (!this.creating()) throw new Error('The `engine` modifier may only be used while creating a table.');
      this.flags.engine = name;
      return this;
    },

    // Sets the character set for the table in MySql
    charset: function(charset) {
      if (!this.creating()) throw new Error('The `engine` modifier may only be used while creating a table.');
      this.flags.charset = charset;
      return this;
    },

    // Sets the collation for the table in MySql
    collate: function(collation) {
      if (!this.creating()) throw new Error('The `engine` modifier may only be used while creating a table.');
      this.flags.collation = collation;
      return this;
    },

    // Adds a comment to the current table being created.
    comment: function(comment) {
      return this._addCommand('comment', {comment: comment});
    },

    // Indicate that the given columns should be dropped.
    dropColumn: function(columns) {
      if (!_.isArray(columns)) columns = columns ? [columns] : [];
      return this._addCommand('dropColumn', {columns: columns});
    },

    // Indicate that the given columns should be dropped.
    dropColumns: function() {
      return this.dropColumn(arguments);
    },

    // Indicate that the given primary key should be dropped.
    dropPrimary: function(index) {
      return this._dropIndexCommand('dropPrimary', index);
    },

    // Indicate that the given unique key should be dropped.
    dropUnique: function(index) {
      return this._dropIndexCommand('dropUnique', index);
    },

    // Indicate that the given index should be dropped.
    dropIndex: function(index) {
      return this._dropIndexCommand('dropIndex', index);
    },

    // Indicate that the given foreign key should be dropped.
    dropForeign: function(index) {
      return this._dropIndexCommand('dropForeign', index);
    },

    // Specify the primary key(s) for the table.
    primary: function(columns, name) {
      return this._indexCommand('primary', columns, name);
    },

    // Specify a unique index for the table.
    unique: function(columns, name) {
      return this._indexCommand('unique', columns, name);
    },

    // Specify an index for the table.
    index: function(columns, name) {
      return this._indexCommand('index', columns, name);
    },

    // Rename a column from one value to another value.
    renameColumn: function(from, to) {
      return this._addCommand('renameColumn', {from: from, to: to});
    },

    // Specify a foreign key for the table, also getting any
    // relevant info from the chain during column.
    foreign: function(column, name) {
      var chained, chainable  = this._indexCommand('foreign', column, name);
      if (_.isObject(column)) {
        chained = _.pick(column, 'foreignColumn', 'foreignTable', 'commandOnDelete', 'commandOnUpdate');
      }
      return _.extend(chainable, ForeignChainable, chained);
    },

    // Create a new auto-incrementing column on the table.
    increments: function(column) {
      return this._addColumn('integer', (column || 'id'), {isUnsigned: true, autoIncrement: true, length: 11});
    },

    // Create a new auto-incrementing big-int on the table
    bigIncrements: function(column) {
      return this._addColumn('bigInteger', (column || 'id'), {isUnsigned: true, autoIncrement: true});
    },

    // Create a new string column on the table.
    string: function(column, length) {
      return this._addColumn('string', column, {length: (length || 255)});
    },

    // Alias varchar to string
    varchar: function(column, length) {
      return this.string(column, length);
    },

    // Create a new text column on the table.
    text: function(column, length) {
      return this._addColumn('text', column, {length: (length || false)});
    },

    // Create a new integer column on the table.
    integer: function(column, length) {
      return this._addColumn('integer', column, {length: (length || 11)});
    },

    // Create a new biginteger column on the table
    bigInteger: function(column) {
      return this._addColumn('bigInteger', column);
    },

    // Create a new tinyinteger column on the table.
    tinyInteger: function(column) {
      return this._addColumn('tinyInteger', column);
    },

    // Alias for tinyinteger column.
    tinyint: function(column) {
      return this.tinyInteger(column);
    },

    // Create a new float column on the table.
    float: function(column, precision, scale) {
      return this._addColumn('float', column, {
        precision: (precision == null ? 8 : precision),
        scale: (scale == null ? 2 : scale)
      });
    },

    // Create a new decimal column on the table.
    decimal: function(column, precision, scale) {
      return this._addColumn('decimal', column, {
        precision: (precision == null ? 8 : precision),
        scale: (scale == null ? 2 : scale)
      });
    },

    // Alias to "bool"
    boolean: function(column) {
      return this.bool(column);
    },

    // Create a new boolean column on the table
    bool: function(column) {
      return this._addColumn('boolean', column);
    },

    // Create a new date column on the table.
    date: function(column) {
      return this._addColumn('date', column);
    },

    // Create a new date-time column on the table.
    dateTime: function(column) {
      return this._addColumn('dateTime', column);
    },

    // Create a new time column on the table.
    time: function(column) {
      return this._addColumn('time', column);
    },

    // Create a new timestamp column on the table.
    timestamp: function(column) {
      return this._addColumn('timestamp', column);
    },

    // Add creation and update dateTime's to the table.
    timestamps: function() {
      this.dateTime('created_at');
      this.dateTime('updated_at');
    },

    // Alias to enum.
    "enum": function(column, allowed) {
      return this.enu(column, allowed);
    },

    // Create a new enum column on the table.
    enu: function(column, allowed) {
      if (!_.isArray(allowed)) allowed = [allowed];
      return this._addColumn('enum', column, {allowed: allowed});
    },

    // Create a new bit column on the table.
    bit: function(column, length) {
      return this._addColumn('bit', column, {length: (length || false)});
    },

    // Create a new binary column on the table.
    binary: function(column) {
      return this._addColumn('binary', column);
    },

    // Create a new json column on the table.
    json: function(column) {
      return this._addColumn('json', column);
    },

    // Create a new uuid column on the table.
    uuid: function(column) {
      return this._addColumn('uuid', column);
    },

    specificType: function(column, type) {
      return this._addColumn('specific', column, {specific: type});
    },

    // ----------------------------------------------------------------------

    // Create a new drop index command on the blueprint.
    // If the index is an array of columns, the developer means
    // to drop an index merely by specifying the columns involved.
    _dropIndexCommand: function(type, index) {
      var columns = [];
      if (_.isArray(index)) {
        columns = index;
        index = null;
      }
      return this._indexCommand(type, columns, index);
    },

    // Add a new index command to the blueprint.
    // If no name was specified for this index, we will create one using a basic
    // convention of the table name, followed by the columns, followed by an
    // index type, such as primary or index, which makes the index unique.
    _indexCommand: function(type, columns, index) {
      index || (index = null);
      if (!_.isArray(columns)) columns = columns ? [columns] : [];
      if (index === null) {
        var table = this.table.replace(/\.|-/g, '_');
        index = (table + '_' + _.map(columns, function(col) { return col.name || col; }).join('_') + '_' + type).toLowerCase();
      }
      return this._addCommand(type, {index: index, columns: columns});
    },

    // Add a new column to the blueprint.
    _addColumn: function(type, name, parameters) {
      if (!name) throw new Error('A `name` must be defined to add a column');
      var column = _.extend({type: type, name: name}, ChainableColumn, parameters);
      this.columns.push(column);
      return column;
    },

    // Add a new command to the blueprint.
    _addCommand: function(name, parameters) {
      var command = _.extend({name: name}, parameters);
      this.commands.push(command);
      return command;
    }
  });

  var ForeignChainable = {

    // Sets the "column" that the current column references
    // as the a foreign key
    references: function(column) {
      this.isForeign = true;
      this.foreignColumn = column || null;
      return this;
    },

    // Sets the "table" where the foreign key column is located.
    inTable: function(table) {
      this.foreignTable = table || null;
      return this;
    },

    // SQL command to run "onDelete"
    onDelete: function(command) {
      this.commandOnDelete = command || null;
      return this;
    },

    // SQL command to run "onUpdate"
    onUpdate: function(command) {
      this.commandOnUpdate = command || null;
      return this;
    }

  };

  var ChainableColumn = _.extend({

    // Sets the default value for a column.
    // For `boolean` columns, we'll permit 'false'
    // to be used as default values.
    defaultTo: function(value) {
      if (this.type === 'boolean') {
        if (value === 'false') value = 0;
        value = (value ? 1 : 0);
      }
      this.defaultValue = value;
      return this;
    },

    // Sets an integer as unsigned, is a no-op
    // if the column type is not an integer.
    unsigned: function() {
      this.isUnsigned = true;
      return this;
    },

    // Allows the column to contain null values.
    nullable: function() {
      this.isNullable = true;
      return this;
    },

    // Disallow the column from containing null values.
    notNull: function() {
      this.isNullable = false;
      return this;
    },

    // Disallow the column from containing null values.
    notNullable: function() {
      this.isNullable = false;
      return this;
    },

    // Adds an index on the specified column.
    index: function(name) {
      this.isIndex = name || true;
      return this;
    },

    // Sets this column as the primary key.
    primary: function(name) {
      if (!this.autoIncrement) {
        this.isPrimary = name || true;
      }
      return this;
    },

    // Sets this column as unique.
    unique: function(name) {
      this.isUnique = name || true;
      return this;
    },

    // Sets the column to be inserted after another,
    // used in MySql alter tables.
    after: function(name) {
      this.isAfter = name;
      return this;
    },

    // Adds a comment to this column.
    comment: function(comment) {
      this.isCommented = comment || null;
      return this;
    }

  }, ForeignChainable);

  exports.SchemaBuilder = SchemaBuilder;

});

})(
  typeof define === 'function' && define.amd ? define : function (factory) { factory(require, exports); }
);
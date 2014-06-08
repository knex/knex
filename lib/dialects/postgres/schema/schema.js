// PostgreSQL Schema Builder & Compiler
// -------
module.exports = function(client) {

var _        = require('lodash');
var inherits = require('inherits');
var Schema   = require('../../../schema');

// Schema Builder
// -------

function SchemaBuilder_PG() {
  this.client = client;
  Schema.Builder.apply(this, arguments);
}
inherits(SchemaBuilder_PG, Schema.Builder);

_.each([
  'searchPath', 'createSchema', 'dropSchema'
], function(method) {
  SchemaBuilder_PG.prototype[method]= function() {
      this._sequence.push({
        method: method,
        args: _.toArray(arguments)
      });
      return this;
  };
});

// Schema Compiler
// -------

function SchemaCompiler_PG() {
  this.client = client;
  this.Formatter = client.Formatter;
  Schema.Compiler.apply(this, arguments);
}
inherits(SchemaCompiler_PG, Schema.Compiler);

// Check whether the current table
SchemaCompiler_PG.prototype.hasTable = function(tableName) {
  this.pushQuery({
    sql: 'select * from information_schema.tables where table_schema = current_schema and table_name = ?',
    bindings: [tableName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile the query to determine if a column exists in a table.
SchemaCompiler_PG.prototype.hasColumn = function(tableName, columnName) {
  this.pushQuery({
    sql: 'select * from information_schema.columns where table_name = ? and column_name = ?',
    bindings: [tableName, columnName],
    output: function(resp) {
      return resp.rows.length > 0;
    }
  });
};

// Compile a rename table command.
SchemaCompiler_PG.prototype.renameTable = function(from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

// Get or set the schema search path.
SchemaCompiler_PG.prototype.searchPath = function() {
  var args = Array.prototype.slice.call(arguments),
      scope = '',
      formatter = this.formatter,
      config;

  if (args.length) {
    config = args.pop();
    if (typeof config !== 'string') {
      if (config.local) scope = 'local ';
    } else {
      args.push(config);
    }
    args.forEach(function(el, i, arr) {
      arr[i] = formatter.wrap(el);
    });

    this.pushQuery('set '+ scope + 'search_path to ' + args.join(','));
  } else {
    this.pushQuery({
      sql: 'show search_path',
      output: function(resp) {
        return resp.rows[0].search_path;
      }
    });
  }
};

// Create a schema
SchemaCompiler_PG.prototype.createSchema = function(schemaName) {
  this.pushQuery('create schema ' + this.formatter.wrap(schemaName));
};

// Drop a schema
SchemaCompiler_PG.prototype.dropSchema = function(schemaName) {
  this.pushQuery('drop schema ' + this.formatter.wrap(schemaName));
};

client.SchemaBuilder = SchemaBuilder_PG;
client.SchemaCompiler = SchemaCompiler_PG;

};

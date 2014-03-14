module.exports = function(client) {
  var push           = Array.prototype.push;
  var _              = require('lodash');
  var TableInterface = require('./table');
  var SqlString      = require('../sqlstring');

  // Constructor for the builder instance, typically called from
  // `knex.builder`, accepting the current `knex` instance,
  // and pulling out the `client` and `grammar` from the current
  // knex instance.
  var SchemaBuilder = function() {
    this.flags = {};
    this.sequence = [];
    this.formatter = new client.Formatter();
  };

  SchemaBuilder.prototype = {

    constructor: SchemaBuilder,

    toString: function() {
      return '[object Knex:SchemaBuilder]';
    },

    // Set a debug flag for the current schema query stack.
    debug: function(val) {
      this.flags.debug = (val == null ? true : val);
      return this;
    },

    // Turn the current schema builder into a string...
    toQuery: function() {
      return _.reduce(this.toSql(), function(memo, statement) {
        memo.push(SqlString.format(statement.sql, statement.bindings));
        return memo;
      }, [], this).join(';\n') + ';';
    },

    // Compiles the current stack to an array of arrays
    // of statements to conduct in sequence.
    toSql: function() {
      return this.sequence;
    },

    // Alias for `schema.table` for clarity.
    alterTable: function(tableName) {
      return this.table.apply(this, arguments);
    },

    // Modify a table on the schema.
    table: function(tableName, fn) {
      push.apply(this.sequence, new client.SchemaTableCompiler(new TableInterface('alter', tableName, fn)).toSql());
      return this;
    },

    // Create a new table on the schema.
    createTable: function(tableName, fn) {
      push.apply(this.sequence, new client.SchemaTableCompiler(new TableInterface('create', tableName, fn)).toSql());
      return this;
    },

    // Drop a table from the schema.
    dropTable: function(tableName) {
      this.sequence.push({
        sql: 'drop table ' + this.formatter.wrap(tableName)
      });
      return this;
    },

    // Drop a table from the schema if it exists.
    dropTableIfExists: function(tableName) {
      this.sequence.push({
        sql: 'drop table if exists ' + this.formatter.wrap(tableName)
      });
      return this;
    },

    // Set the "transacting" flag for the current sequence.
    transacting: function(t) {
      this.flags.transacting = t;
      return this;
    }

  };

  SchemaBuilder.prototype.then = function SchemaBuilder$then(onFulfilled, onRejected) {
    return client.runThen(this).then(onFulfilled, onRejected);
  };

  require('../coerceable')(SchemaBuilder);

  SchemaBuilder.extend = require('simple-extend');

  return SchemaBuilder;
};
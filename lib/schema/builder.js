'use strict';

var _            = require('lodash');
var inherits     = require('inherits');
var EventEmitter = require('events').EventEmitter;
var assign       = require('lodash/object/assign')

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
function SchemaBuilder(client) {
  this.client    = client
  this._sequence = []
}
inherits(SchemaBuilder, EventEmitter)

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.
_.each([
  'createTable', 
  'createTableIfNotExists', 
  'createSchema',
  'createSchemaIfNotExists', 
  'dropSchema', 
  'dropSchemaIfExists',
  'createExtension', 
  'createExtensionIfNotExists', 
  'dropExtension',
  'dropExtensionIfExists', 
  'table', 
  'alterTable', 
  'hasTable',
  'hasColumn', 
  'dropTable', 
  'renameTable', 
  'dropTableIfExists', 
  'raw',
  'debug'
], function(method) {
  SchemaBuilder.prototype[method] = function() {
    if (method === 'table') method = 'alterTable';
    this._sequence.push({
      method: method,
      args: _.toArray(arguments)
    });
    return this;
  }
})

SchemaBuilder.prototype.toString = function() {
  return this.toQuery()
}

SchemaBuilder.prototype.toSQL = function() {
  return this.client.schemaCompiler(this).toSQL()
}

require('../interface')(SchemaBuilder)

module.exports = SchemaBuilder

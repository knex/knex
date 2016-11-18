import Bluebird from 'bluebird'
import inherits from 'inherits'
import { EventEmitter } from 'events'

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
function SchemaBuilder(context) {
  const {client} = context
  this.__context = context
  this.client = client
  this._sequence = []
  this._debug = client.config && client.config.debug
}
inherits(SchemaBuilder, EventEmitter)

Object.defineProperty(SchemaBuilder.prototype, 'log', {
  get() {
    return this.client.log
  }
})

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.

SchemaBuilder.prototype.createTable = function createTable(...args) {
  return this._push('createTable', args)
}
SchemaBuilder.prototype.createTableIfNotExists = function createTableIfNotExists(...args) {
  return this._push('createTableIfNotExists', args)
}
SchemaBuilder.prototype.createSchema = function createSchema(...args) {
  return this._push('createSchema', args)
}
SchemaBuilder.prototype.createSchemaIfNotExists = function createSchemaIfNotExists(...args) {
  return this._push('createSchemaIfNotExists', args)
}
SchemaBuilder.prototype.dropSchema = function dropSchema(...args) {
  return this._push('dropSchema', args)
}
SchemaBuilder.prototype.dropSchemaIfExists = function dropSchemaIfExists(...args) {
  return this._push('dropSchemaIfExists', args)
}
SchemaBuilder.prototype.createExtension = function createExtension(...args) {
  return this._push('createExtension', args)
}
SchemaBuilder.prototype.createExtensionIfNotExists = function createExtensionIfNotExists(...args) {
  return this._push('createExtensionIfNotExists', args)
}
SchemaBuilder.prototype.dropExtension = function dropExtension(...args) {
  return this._push('dropExtension', args)
}
SchemaBuilder.prototype.dropExtensionIfExists = function dropExtensionIfExists(...args) {
  return this._push('dropExtensionIfExists', args)
}
SchemaBuilder.prototype.alterTable = function alterTable(...args) {
  return this._push('alterTable', args)
}
SchemaBuilder.prototype.hasTable = function hasTable(...args) {
  return this._push('hasTable', args)
}
SchemaBuilder.prototype.hasColumn = function hasColumn(...args) {
  return this._push('hasColumn', args)
}
SchemaBuilder.prototype.dropTable = function dropTable(...args) {
  return this._push('dropTable', args)
}
SchemaBuilder.prototype.renameTable = function renameTable(...args) {
  return this._push('renameTable', args)
}
SchemaBuilder.prototype.dropTableIfExists = function dropTableIfExists(...args) {
  return this._push('dropTableIfExists', args)
}
SchemaBuilder.prototype.raw = function raw(...args) {
  return this._push('raw', args)
}

SchemaBuilder.prototype.table = SchemaBuilder.prototype.alterTable

SchemaBuilder.prototype._push = function _push(method, args) {
  this._sequence.push({method, args})
  return this
}

SchemaBuilder.prototype.then = function(/* onFulfilled, onRejected */) {
  if (this.__promise) {
    this.log.error(
      'WARNING: for legacy reasons, this is still permitted ' +
      'but executing .then on a schema building chain more than ' +
      'once is highly discouraged and will be removed soon.\n' +
      'This is likely a result of destructuring schema, like so: const { schema } = knex'
    )
    this.__sequence = []
  }
  const result = this.client.runner(this).run()
  this.__promise = Bluebird.resolve(result.then.apply(result, arguments))
  return this.__promise
}

require('../interface')(SchemaBuilder)

SchemaBuilder.prototype.withSchema = function(schemaName) {
  this._schema = schemaName;
  return this;
}

SchemaBuilder.prototype.toString = function() {
  return this.toQuery()
}

SchemaBuilder.prototype.toSQL = function() {
  return this.client.schemaCompiler(this).toSQL()
}

export default SchemaBuilder

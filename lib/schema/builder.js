'use strict';

exports.__esModule = true;

var _toArray2 = require('lodash/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
function SchemaBuilder(client) {
  this.client = client;
  this._sequence = [];
  this._debug = client.config && client.config.debug;
}
(0, _inherits2.default)(SchemaBuilder, _events.EventEmitter);

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.
(0, _each3.default)(['createTable', 'createTableIfNotExists', 'createSchema', 'createSchemaIfNotExists', 'dropSchema', 'dropSchemaIfExists', 'createExtension', 'createExtensionIfNotExists', 'dropExtension', 'dropExtensionIfExists', 'table', 'alterTable', 'hasTable', 'hasColumn', 'dropTable', 'renameTable', 'dropTableIfExists', 'raw'], function (method) {
  SchemaBuilder.prototype[method] = function () {
    if (method === 'table') method = 'alterTable';
    this._sequence.push({
      method: method,
      args: (0, _toArray3.default)(arguments)
    });
    return this;
  };
});

require('../interface')(SchemaBuilder);

SchemaBuilder.prototype.withSchema = function (schemaName) {
  this._schema = schemaName;
  return this;
};

SchemaBuilder.prototype.toString = function () {
  return this.toQuery();
};

SchemaBuilder.prototype.toSQL = function () {
  return this.client.schemaCompiler(this).toSQL();
};

exports.default = SchemaBuilder;
module.exports = exports['default'];
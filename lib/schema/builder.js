'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _events = require('events');

var _lodash = require('lodash');

var _helpers = require('../helpers');

var _saveAsyncStack = require('../util/save-async-stack');

var _saveAsyncStack2 = _interopRequireDefault(_saveAsyncStack);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
function SchemaBuilder(client) {
  this.client = client;
  this._sequence = [];

  if (client.config) {
    this._debug = client.config.debug;
    (0, _saveAsyncStack2.default)(this, 4);
  }
}
(0, _inherits2.default)(SchemaBuilder, _events.EventEmitter);

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.
(0, _lodash.each)(['createTable', 'createTableIfNotExists', 'createSchema', 'createSchemaIfNotExists', 'dropSchema', 'dropSchemaIfExists', 'createExtension', 'createExtensionIfNotExists', 'dropExtension', 'dropExtensionIfExists', 'table', 'alterTable', 'hasTable', 'hasColumn', 'dropTable', 'renameTable', 'dropTableIfExists', 'raw'], function (method) {
  SchemaBuilder.prototype[method] = function () {
    if (method === 'createTableIfNotExists') {
      this.client.logger.warn(['Use async .hasTable to check if table exists and then use plain .createTable. Since ', '.createTableIfNotExists actually just generates plain "CREATE TABLE IF NOT EXIST..." ', 'query it will not work correctly if there are any alter table queries generated for ', 'columns afterwards. To not break old migrations this function is left untouched for now', ', but it should not be used when writing new code and it is removed from documentation.'].join(''));
    }
    if (method === 'table') method = 'alterTable';
    this._sequence.push({
      method: method,
      args: (0, _lodash.toArray)(arguments)
    });
    return this;
  };
});

require('../interface')(SchemaBuilder);
(0, _helpers.addQueryContext)(SchemaBuilder);

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
const { EventEmitter } = require('events');
const toArray = require('lodash/toArray');
const { addQueryContext } = require('../util/helpers');
const saveAsyncStack = require('../util/save-async-stack');
const {
  augmentWithBuilderInterface,
} = require('../builder-interface-augmenter');

// Constructor for the builder instance, typically called from
// `knex.builder`, accepting the current `knex` instance,
// and pulling out the `client` and `grammar` from the current
// knex instance.
class SchemaBuilder extends EventEmitter {
  constructor(client) {
    super();
    this.client = client;
    this._sequence = [];

    if (client.config) {
      this._debug = client.config.debug;
      saveAsyncStack(this, 4);
    }
  }

  withSchema(schemaName) {
    this._schema = schemaName;
    return this;
  }

  toString() {
    return this.toQuery();
  }

  toSQL() {
    return this.client.schemaCompiler(this).toSQL();
  }

  async generateDdlCommands() {
    return await this.client.schemaCompiler(this).generateDdlCommands();
  }
}

// Each of the schema builder methods just add to the
// "_sequence" array for consistency.
[
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
].forEach(function (method) {
  SchemaBuilder.prototype[method] = function () {
    if (method === 'createTableIfNotExists') {
      this.client.logger.warn(
        [
          'Use async .hasTable to check if table exists and then use plain .createTable. Since ',
          '.createTableIfNotExists actually just generates plain "CREATE TABLE IF NOT EXIST..." ',
          'query it will not work correctly if there are any alter table queries generated for ',
          'columns afterwards. To not break old migrations this function is left untouched for now',
          ', but it should not be used when writing new code and it is removed from documentation.',
        ].join('')
      );
    }
    if (method === 'table') method = 'alterTable';
    this._sequence.push({
      method,
      args: toArray(arguments),
    });
    return this;
  };
});

augmentWithBuilderInterface(SchemaBuilder);
addQueryContext(SchemaBuilder);

module.exports = SchemaBuilder;

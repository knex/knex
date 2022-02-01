const {
  pushQuery,
  pushAdditional,
  unshiftQuery,
} = require('./internal/helpers');

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
class SchemaCompiler {
  constructor(client, builder) {
    this.builder = builder;
    this._commonBuilder = this.builder;
    this.client = client;
    this.schema = builder._schema;

    this.bindings = [];
    this.bindingsHolder = this;
    this.formatter = client.formatter(builder);
    this.formatter.bindings = this.bindings;
    this.sequence = [];
  }

  createSchema() {
    throwOnlyPGError('createSchema');
  }

  createSchemaIfNotExists() {
    throwOnlyPGError('createSchemaIfNotExists');
  }

  dropSchema() {
    throwOnlyPGError('dropSchema');
  }

  dropSchemaIfExists() {
    throwOnlyPGError('dropSchemaIfExists');
  }

  dropTable(tableName) {
    this.pushQuery(
      this.dropTablePrefix +
        this.formatter.wrap(prefixedTableName(this.schema, tableName))
    );
  }

  dropTableIfExists(tableName) {
    this.pushQuery(
      this.dropTablePrefix +
        'if exists ' +
        this.formatter.wrap(prefixedTableName(this.schema, tableName))
    );
  }

  dropView(viewName) {
    this._dropView(viewName, false, false);
  }

  dropViewIfExists(viewName) {
    this._dropView(viewName, true, false);
  }

  dropMaterializedView(viewName) {
    throw new Error('materialized views are not supported by this dialect.');
  }

  dropMaterializedViewIfExists(viewName) {
    throw new Error('materialized views are not supported by this dialect.');
  }

  renameView(from, to) {
    throw new Error(
      'rename view is not supported by this dialect (instead drop then create another view).'
    );
  }

  refreshMaterializedView() {
    throw new Error('materialized views are not supported by this dialect.');
  }

  _dropView(viewName, ifExists, materialized) {
    this.pushQuery(
      (materialized ? this.dropMaterializedViewPrefix : this.dropViewPrefix) +
        (ifExists ? 'if exists ' : '') +
        this.formatter.wrap(prefixedTableName(this.schema, viewName))
    );
  }

  raw(sql, bindings) {
    this.sequence.push(this.client.raw(sql, bindings).toSQL());
  }

  toSQL() {
    const sequence = this.builder._sequence;
    for (let i = 0, l = sequence.length; i < l; i++) {
      const query = sequence[i];
      this[query.method].apply(this, query.args);
    }
    return this.sequence;
  }

  async generateDdlCommands() {
    const generatedCommands = this.toSQL();
    return {
      pre: [],
      sql: Array.isArray(generatedCommands)
        ? generatedCommands
        : [generatedCommands],
      check: null,
      post: [],
    };
  }
}

SchemaCompiler.prototype.dropTablePrefix = 'drop table ';
SchemaCompiler.prototype.dropViewPrefix = 'drop view ';
SchemaCompiler.prototype.dropMaterializedViewPrefix = 'drop materialized view ';
SchemaCompiler.prototype.alterViewPrefix = 'alter view ';

SchemaCompiler.prototype.alterTable = buildTable('alter');
SchemaCompiler.prototype.createTable = buildTable('create');
SchemaCompiler.prototype.createTableIfNotExists = buildTable('createIfNot');
SchemaCompiler.prototype.createTableLike = buildTable('createLike');

SchemaCompiler.prototype.createView = buildView('create');
SchemaCompiler.prototype.createViewOrReplace = buildView('createOrReplace');
SchemaCompiler.prototype.createMaterializedView = buildView(
  'createMaterializedView'
);
SchemaCompiler.prototype.alterView = buildView('alter');

SchemaCompiler.prototype.pushQuery = pushQuery;
SchemaCompiler.prototype.pushAdditional = pushAdditional;
SchemaCompiler.prototype.unshiftQuery = unshiftQuery;

function build(builder) {
  // pass queryContext down to tableBuilder but do not overwrite it if already set
  const queryContext = this.builder.queryContext();
  if (queryContext !== undefined && builder.queryContext() === undefined) {
    builder.queryContext(queryContext);
  }

  builder.setSchema(this.schema);
  const sql = builder.toSQL();

  for (let i = 0, l = sql.length; i < l; i++) {
    this.sequence.push(sql[i]);
  }
}

function buildTable(type) {
  if (type === 'createLike') {
    return function (tableName, tableNameLike, fn) {
      const builder = this.client.tableBuilder(
        type,
        tableName,
        tableNameLike,
        fn
      );
      build.call(this, builder);
    };
  } else {
    return function (tableName, fn) {
      const builder = this.client.tableBuilder(type, tableName, null, fn);
      build.call(this, builder);
    };
  }
}

function buildView(type) {
  return function (viewName, fn) {
    const builder = this.client.viewBuilder(type, viewName, fn);
    build.call(this, builder);
  };
}

function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}

function throwOnlyPGError(operationName) {
  throw new Error(
    `${operationName} is not supported for this dialect (only PostgreSQL supports it currently).`
  );
}

module.exports = SchemaCompiler;

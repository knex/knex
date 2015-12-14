
var helpers = require('./helpers')
var assign  = require('lodash/object/assign');

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(client, builder) {
  this.builder   = builder
  this.client    = client
  this.schema    = builder._schema;
  this.formatter = client.formatter()
  this.sequence  = []
}

assign(SchemaCompiler.prototype, {

  pushQuery: helpers.pushQuery,

  pushAdditional: helpers.pushAdditional,

  createTable: buildTable('create'),

  createTableIfNotExists: buildTable('createIfNot'),

  alterTable: buildTable('alter'),

  dropTablePrefix: 'drop table ',
  dropTable: function(tableName) {
    this.pushQuery(this.dropTablePrefix + this.formatter.wrap(prefixedTableName(this.schema, tableName)));
  },

  dropTableIfExists: function(tableName) {
    this.pushQuery(this.dropTablePrefix + 'if exists ' + this.formatter.wrap(prefixedTableName(this.schema, tableName)));
  },

  raw: function(sql, bindings) {
    this.sequence.push(this.client.raw(sql, bindings).toSQL());
  },

  toSQL: function() {
    var sequence = this.builder._sequence;
    for (var i = 0, l = sequence.length; i < l; i++) {
      var query = sequence[i];
      this[query.method].apply(this, query.args);
    }
    return this.sequence;
  }  

})

function buildTable(type) {
  return function(tableName, fn) {
    var builder = this.client.tableBuilder(type, tableName, fn);
    var sql;

    builder.setSchema(this.schema);
    sql = builder.toSQL();

    for (var i = 0, l = sql.length; i < l; i++) {
      this.sequence.push(sql[i]);
    }
  };
}

function prefixedTableName(prefix, table) {
  return prefix ? `${prefix}.${table}` : table;
}

module.exports = SchemaCompiler;

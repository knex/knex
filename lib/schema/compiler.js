'use strict';

var helpers = require('./helpers');
var assign = require('lodash/object/assign');

// The "SchemaCompiler" takes all of the query statements which have been
// gathered in the "SchemaBuilder" and turns them into an array of
// properly formatted / bound query strings.
function SchemaCompiler(client, builder) {
  this.builder = builder;
  this.client = client;
  this.formatter = client.formatter();
  this.sequence = [];
}

assign(SchemaCompiler.prototype, {

  pushQuery: helpers.pushQuery,

  pushAdditional: helpers.pushAdditional,

  createTable: buildTable('create'),

  createTableIfNotExists: buildTable('createIfNot'),

  alterTable: buildTable('alter'),

  dropTable: function dropTable(tableName) {
    this.pushQuery('drop table ' + this.formatter.wrap(tableName));
  },

  dropTableIfExists: function dropTableIfExists(tableName) {
    this.pushQuery('drop table if exists ' + this.formatter.wrap(tableName));
  },

  raw: function raw(sql, bindings) {
    this.sequence.push(this.client.raw(sql, bindings).toSQL());
  },

  toSQL: function toSQL() {
    var sequence = this.builder._sequence;
    for (var i = 0, l = sequence.length; i < l; i++) {
      var query = sequence[i];
      this[query.method].apply(this, query.args);
    }
    return this.sequence;
  }

});

function buildTable(type) {
  return function (tableName, fn) {
    var sql = this.client.tableBuilder(type, tableName, fn).toSQL();
    for (var i = 0, l = sql.length; i < l; i++) {
      this.sequence.push(sql[i]);
    }
  };
}

module.exports = SchemaCompiler;
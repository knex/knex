
var _ = require('lodash');

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
exports.pushQuery = function(query) {
  if (!query) return;
  if (_.isString(query)) {
    query = {sql: query};
  } else {
    query = query;
  }
  if (!query.bindings) {
    query.bindings = this.formatter.bindings;
  }
  this.sequence.push(query);
  this.formatter = this.client.formatter();
};

// Used in cases where we need to push some additional column specific statements.
exports.pushAdditional = function(fn) {
  var child = new this.constructor(this.client, this.tableCompiler, this.columnBuilder);
  fn.call(child, _.rest(arguments));
  this.sequence.additional = (this.sequence.additional || []).concat(child.sequence);
};

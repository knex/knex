var _ = require('lodash');

var Builder = require('./builder');
var Compiler = require('./compiler');
var TableBuilder = require('./tablebuilder');
var TableCompiler = require('./tablecompiler');
var ColumnBuilder = require('./columnbuilder');
var ColumnCompiler = require('./columncompiler');

// Initialize the compiler.
Compiler.prototype.initCompiler =
TableCompiler.prototype.initCompiler =
ColumnCompiler.prototype.initCompiler = function() {
  this.formatter = new this.Formatter();
  this.sequence  = [];
};

// Push a new query onto the compiled "sequence" stack,
// creating a new formatter, returning the compiler.
Compiler.prototype.pushQuery =
TableCompiler.prototype.pushQuery =
ColumnCompiler.prototype.pushQuery = function(query) {
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
  this.formatter = new this.Formatter();
};

module.exports = {
  Builder: Builder,
  Compiler: Compiler,
  TableBuilder: TableBuilder,
  TableCompiler: TableCompiler,
  ColumnBuilder: ColumnBuilder,
  ColumnCompiler: ColumnCompiler
};
// Raw
// -------
var _ = require('lodash');
var SqlString = require('./sqlstring');
var FluentChain = require('fluent-chain');

var Raw = module.exports = function(sql, bindings) {
  if (sql.toSql) {
    var output = sql.toSql();
    this.sql = output.sql;
    this.bindings = output.bindings;
  } else {
    this.sql = sql;
    this.bindings = bindings;
    this.flags = {};
  }
};

// Set to know to output the original output from the query builder.
Raw.prototype._method = 'raw';

// Set the transacting flag on the raw query, if this query is
// run independently and needs to be on the transaction.
Raw.prototype.transacting = function(t) {
  this.flags.transacting = t;
  return this;
};

Raw.prototype.wrap = function(before, after) {
  this.sql = before + this.sql + after;
  return this;
};

// Returns the raw sql for the query.
Raw.prototype.toSql = function() {
  return {
    sql: this.sql,
    bindings: this.bindings
  };
};

// Turn the raw query into a string.
Raw.prototype.toString = function() {
  return SqlString.format(this.sql, this.bindings) + ';';
};

// Assumes the "__client" property has been injected internally.
Raw.prototype.then = function(onFulfilled, onRejected) {
  return this.__client.runThen(this).spread(onFulfilled, onRejected);
};

// Coerce the `Raw`.
require('./coerceable')(Raw);
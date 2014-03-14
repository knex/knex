// Raw
// -------
var _ = require('lodash');
var SqlString = require('./sqlstring');
var FluentChain = require('fluent-chain');

function Raw(sql, bindings) {
  if (sql.toSql) {
    var output = sql.toSql();
    this.sql = output.sql;
    this.bindings = output.bindings;
  } else {
    this.sql = sql;
    this.bindings = bindings;
    this.flags = {};
  }
}

// Set to know to output the original output from the query builder.
Raw.prototype = {

  constructor: Raw,

  _method: 'raw',

  // Set the transacting flag on the raw query, if this query is
  // run independently and needs to be on the transaction.
  transacting: function(t) {
    this.flags.transacting = t;
    return this;
  },

  // Wraps the current sql with `before` and `after`.
  wrap: function(before, after) {
    this.sql = before + this.sql + after;
    return this;
  },

  // Returns the raw sql for the query.
  toSql: function() {
    return {
      sql: this.sql,
      bindings: this.bindings
    };
  },

  // Turn the raw query into a string.
  toQuery: function() {
    return SqlString.format(this.sql, this.bindings) + ';';
  },

  // Assumes the "__client" property has been injected internally,
  // as is the case when called with `knex.raw`.
  then: function(onFulfilled, onRejected) {
    return this.__client.runThen(this).spread(onFulfilled, onRejected);
  },

  // Calls `toString` on the Knex object.
  toString: function() {
    return '[object Knex$raw]';
  }

};

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./coerceable')(Raw);

module.exports = Raw;
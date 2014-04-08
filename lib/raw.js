// Raw
// -------
var SqlString = require('./sqlstring');
var shared    = require('./shared');

function Raw(sql, bindings) {
  this.sql = sql;
  this.bindings = bindings;
  this._debug = void 0;
  this._transacting = void 0;
}

// Set to know the original source of the request for
// post-processing.
Raw.prototype._method = 'raw',

// Set the transacting flag on the raw query, if this query is
// run independently and needs to be on the transaction.
Raw.prototype.transacting = shared.transacting;

Raw.prototype.debug = shared.debug;

// Wraps the current sql with `before` and `after`.
Raw.prototype.wrap = function(before, after) {
  this.sql = before + this.sql + after;
  return this;
};

// Turn the raw query into a string.
Raw.prototype.toQuery = function() {
  return SqlString.format(this.sql, this.bindings) + ';';
};

// Calls `toString` on the Knex object.
// return '[object Knex$raw]';
Raw.prototype.toString = function() {
  return this.toQuery();
};

// Returns the raw sql for the query.
Raw.prototype.toSql = function() {
  return {
    sql: this.sql,
    bindings: this.bindings
  };
};

// Call `runThen` on the client, processing the query and calling the `onFulfilled`
// and `onRejected` as defined
Raw.prototype.then = function(onFulfilled, onRejected) {
  return new this.client.Runner(this).then(onFulfilled, onRejected);
};

// Call `spread` rather than `then`.
Raw.prototype.spread = function(onFulfilled, onRejected) {
  return new this.client.Runner(this).spread(onFulfilled, onRejected);
};

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

module.exports = Raw;
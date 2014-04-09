// Raw
// -------
var SqlString = require('./sqlstring');

function Raw(sql, bindings) {
  this.sql = sql;
  this.bindings = bindings;
  this._debug = void 0;
  this._transacting = void 0;
}

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
Raw.prototype.toSQL = function() {
  return {
    sql: this.sql,
    method: 'raw',
    bindings: this.bindings
  };
};

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

module.exports = Raw;
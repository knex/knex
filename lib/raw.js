// Raw
// -------
var SqlString = require('./sqlstring');
var _ = require('lodash');

function Raw(sql, bindings) {
  if (sql.toSQL) {
    return this._processQuery(sql);
  }
  this.sql = sql;
  this.bindings = _.isArray(bindings) ? bindings :
    bindings ? [bindings] : [];
  this._debug = void 0;
  this._transacting = void 0;
}

// Wraps the current sql with `before` and `after`.
Raw.prototype.wrap = function(before, after) {
  this.sql = before + this.sql + after;
  return this;
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

// Convert the query toSQL.
Raw.prototype._processQuery = function(sql) {
  var processed = sql.toSQL();
  return new this.constructor(processed.sql, processed.bindings);
};

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

// Turn the raw query into a string.
Raw.prototype.toQuery = function() {
  return SqlString.format(this.sql, this.bindings);
};

module.exports = Raw;
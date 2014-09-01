'use strict';

// Raw
// -------
var _ = require('lodash');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;

function Raw(sql, bindings) {
  if (sql && sql.toSQL) {
    var output = sql.toSQL();
    sql = output.sql;
    bindings = output.bindings;
  }
  this.sql = sql + '';
  this.bindings = _.isArray(bindings) ? bindings :
    bindings ? [bindings] : [];
  this.interpolateBindings();
  this._debug       = void 0;
  this._transacting = void 0;
}
inherits(Raw, EventEmitter);

// Wraps the current sql with `before` and `after`.
Raw.prototype.wrap = function(before, after) {
  this.sql = before + this.sql + after;
  return this;
};

// Calls `toString` on the Knex object.
Raw.prototype.toString = function() {
  return this.toQuery();
};

// Ensure all Raw / builder bindings are mixed-in to the ? placeholders
// as appropriate.
Raw.prototype.interpolateBindings = function() {
  var replacements = [];
  this.bindings = _.reduce(this.bindings, function(accum, param, index) {
    var innerBindings = [param];
    if (param && param.toSQL) {
      var result    = this.splicer(param, index);
      innerBindings = result.bindings;
      replacements.push(result.replacer);
    }
    return accum.concat(innerBindings);
  }, [], this);

  // we run this in reverse order, because ? concats earlier in the
  // query string will disrupt indices for later ones
  this.sql = _.reduce(replacements.reverse(), function(accum, fn) {
    return fn(accum);
  }, this.sql.split('?')).join('?');
};

// Returns a replacer function that splices into the i'th
// ? in the sql string the inner raw's sql,
// and the bindings associated with it
Raw.prototype.splicer = function(raw, i) {
  var obj = raw.toSQL();

  // the replacer function assumes that the sql has been
  // already sql.split('?') and will be arr.join('?')
  var replacer = function(arr) {
    arr[i] = arr[i] + obj.sql + arr[i + 1];
    arr.splice(i + 1, 1);
    return arr;
  };

  return {
    replacer: replacer,
    bindings: obj.bindings
  };
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
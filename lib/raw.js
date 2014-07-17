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
  this.sql = sql;
  this.bindings = _.isArray(bindings) ? bindings :
    bindings ? [bindings] : [];

  var replacements = [];
  this.bindings = _.reduce(this.bindings, function(accum, param, index) {
    var innerBindings = [param];
    if (param instanceof Raw) {
      var result = this.splicer(param, index);
      innerBindings = result.bindings;
      replacements.push(result.replacer);
    }
    return accum.concat(innerBindings);
  }.bind(this), []);

  // we don't need to care about replacements adding more '?'s
  // and disrupting the indices, because we split first, join later
  this.sql = _.reduce(replacements, function(accum, fn) {
    return fn(accum);
  }, this.sql.split('?')).join('?');

  this._debug = void 0;
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

// Returns a replacer function that splices into the i'th
// ? in the sql string the inner raw's sql,
// and the bindings associated with it
Raw.prototype.splicer = function(raw, i) {
  var obj = raw.toSQL();

  // the replacer function assumes that the sql has been
  // already sql.split('?') and will be arr.join('?')
  var replacer = function(arr) {
    arr[i] = arr[i] + obj.sql + arr[i+1];
    arr.splice(i+1,1);
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
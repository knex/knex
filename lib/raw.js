
// Raw
// -------
'use strict';

var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var assign = require('lodash/object/assign');
var reduce = require('lodash/collection/reduce');
var isPlainObject = require('lodash/lang/isPlainObject');
var _ = require('lodash');

function Raw(client) {
  this.client = client;

  this.sql = '';
  this.bindings = [];
  this._cached = undefined;

  // Todo: Deprecate
  this._wrappedBefore = undefined;
  this._wrappedAfter = undefined;
  this._debug = client && client.config && client.config.debug;
}
inherits(Raw, EventEmitter);

assign(Raw.prototype, {

  set: function set(sql, bindings) {
    this._cached = undefined;
    this.sql = sql;
    this.bindings = _.isObject(bindings) || _.isUndefined(bindings) ? bindings : [bindings];

    return this;
  },

  // Wraps the current sql with `before` and `after`.
  wrap: function wrap(before, after) {
    this._cached = undefined;
    this._wrappedBefore = before;
    this._wrappedAfter = after;
    return this;
  },

  // Calls `toString` on the Knex object.
  toString: function toString() {
    return this.toQuery();
  },

  // Returns the raw sql for the query.
  toSQL: function toSQL() {
    if (this._cached) return this._cached;
    if (Array.isArray(this.bindings)) {
      this._cached = replaceRawArrBindings(this);
    } else if (this.bindings && isPlainObject(this.bindings)) {
      this._cached = replaceKeyBindings(this);
    } else {
      this._cached = {
        method: 'raw',
        sql: this.sql,
        bindings: this.bindings
      };
    }
    if (this._wrappedBefore) {
      this._cached.sql = this._wrappedBefore + this._cached.sql;
    }
    if (this._wrappedAfter) {
      this._cached.sql = this._cached.sql + this._wrappedAfter;
    }
    this._cached.options = reduce(this._options, assign, {});
    return this._cached;
  }

});

function replaceRawArrBindings(raw) {
  var expectedBindings = raw.bindings.length;
  var values = raw.bindings;
  var client = raw.client;
  var index = 0;
  var bindings = [];

  var sql = raw.sql.replace(/\\?\?\??/g, function (match) {
    if (match === '\\?') {
      return match;
    }

    var value = values[index++];

    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL();
      if (bindingSQL.bindings !== undefined) {
        bindings = bindings.concat(bindingSQL.bindings);
      }
      return bindingSQL.sql;
    }

    if (match === '??') {
      return client.formatter().columnize(value);
    }
    bindings.push(value);
    return '?';
  });

  if (expectedBindings !== index) {
    throw new Error('Expected ' + expectedBindings + ' bindings, saw ' + index);
  }

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  };
}

function replaceKeyBindings(raw) {
  var values = raw.bindings;
  var client = raw.client;
  var sql = raw.sql,
      bindings = [];

  var regex = new RegExp('(^|\\s)(\\:\\w+\\:?)', 'g');
  sql = raw.sql.replace(regex, function (full) {
    var key = full.trim();
    var isIdentifier = key[key.length - 1] === ':';
    var value = isIdentifier ? values[key.slice(1, -1)] : values[key.slice(1)];
    if (value === undefined) return '';
    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL();
      if (bindingSQL.bindings !== undefined) {
        bindings = bindings.concat(bindingSQL.bindings);
      }
      return full.replace(key, bindingSQL.sql);
    }
    if (isIdentifier) {
      return full.replace(key, client.formatter().columnize(value));
    }
    bindings.push(value);
    return full.replace(key, '?');
  });

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  };
}

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw);

module.exports = Raw;
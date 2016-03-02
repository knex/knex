
// Raw
// -------
var inherits      = require('inherits')
var EventEmitter  = require('events').EventEmitter

import {assign, reduce, isPlainObject, isObject, isUndefined, isNumber} from 'lodash'

function Raw(client) {
  this.client   = client

  this.sql      = ''
  this.bindings = []
  this._cached  = undefined

  // Todo: Deprecate
  this._wrappedBefore = undefined
  this._wrappedAfter  = undefined
  this._debug         = client && client.config && client.config.debug
}
inherits(Raw, EventEmitter)

assign(Raw.prototype, {

  set: function(sql, bindings) {
    this._cached  = undefined
    this.sql      = sql
    this.bindings = (isObject(bindings) || isUndefined(bindings)) ?  bindings : [bindings]

    return this
  },

  timeout: function(ms) {
    if(isNumber(ms) && ms > 0) {
      this._timeout = ms;
    }
    return this;
  },

  // Wraps the current sql with `before` and `after`.
  wrap: function(before, after) {
    this._cached        = undefined
    this._wrappedBefore = before
    this._wrappedAfter  = after
    return this
  },

  // Calls `toString` on the Knex object.
  toString: function() {
    return this.toQuery()
  },

  // Returns the raw sql for the query.
  toSQL: function() {
    if (this._cached) return this._cached
    if (Array.isArray(this.bindings)) {
      this._cached = replaceRawArrBindings(this)
    } else if (this.bindings && isPlainObject(this.bindings)) {
      this._cached = replaceKeyBindings(this)
    } else {
      this._cached = {
        method: 'raw',
        sql: this.sql,
        bindings: this.bindings
      }
    }
    if (this._wrappedBefore) {
      this._cached.sql = this._wrappedBefore + this._cached.sql
    }
    if (this._wrappedAfter) {
      this._cached.sql = this._cached.sql + this._wrappedAfter
    }
    this._cached.options = reduce(this._options, assign, {})
    if(this._timeout) {
      this._cached.timeout = this._timeout;
    }
    return this._cached
  }

})

function replaceRawArrBindings(raw) {
  var expectedBindings = raw.bindings.length
  var values           = raw.bindings
  var client           = raw.client
  var index            = 0;
  var bindings         = []

  var sql = raw.sql.replace(/\\?\?\??/g, function(match) {
    if (match === '\\?') {
      return match
    }

    var value = values[index++]

    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL()
      if (bindingSQL.bindings !== undefined) {
        bindings = bindings.concat(bindingSQL.bindings)
      }
      return bindingSQL.sql
    }

    if (match === '??') {
      return client.formatter().columnize(value)
    }
    bindings.push(value)
    return '?'
  })

  if (expectedBindings !== index) {
    throw new Error('Expected ' + expectedBindings + ' bindings, saw ' + index)
  }

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  }
}

function replaceKeyBindings(raw) {
  var values   = raw.bindings
  var client   = raw.client
  var sql      = raw.sql, bindings = []

  var regex = new RegExp('(\\:\\w+\\:?)', 'g')
  sql = raw.sql.replace(regex, function(full) {
    var key = full.trim();
    var isIdentifier = key[key.length - 1] === ':'
    var value = isIdentifier ? values[key.slice(1, -1)] : values[key.slice(1)]
    if (value === undefined) {
      return full;
    }
    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL()
      if (bindingSQL.bindings !== undefined) {
        bindings = bindings.concat(bindingSQL.bindings)
      }
      return full.replace(key, bindingSQL.sql)
    }
    if (isIdentifier) {
      return full.replace(key, client.formatter().columnize(value))
    }
    bindings.push(value)
    return full.replace(key, '?')
  })

  return {
    method: 'raw',
    sql: sql,
    bindings: bindings
  }
}

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw)

module.exports = Raw

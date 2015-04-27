'use strict';

// Raw
// -------
var inherits     = require('inherits')
var EventEmitter = require('events').EventEmitter
var assign       = require('lodash/object/assign')

function Raw(client) {
  this.client   = client

  this.sql      = ''
  this.bindings = []
  this._cached  = undefined

  // Todo: Deprecate
  this._wrappedBefore = undefined
  this._wrappedAfter  = undefined
  this._debug         = false

}
inherits(Raw, EventEmitter)

assign(Raw.prototype, {

  set: function(sql, bindings) {    
    this._cached  = undefined
    this.sql      = sql
    this.bindings = bindings
    return this
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
    } else if (this.bindings && typeof this.bindings === 'object') {
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
    return this._cached
  }

})

function replaceRawArrBindings(raw) {
  var expectedBindings = raw.bindings.length
  var values           = raw.bindings
  var client           = raw.client
  var index            = 0;
  var bindings         = []
  
  var sql = raw.sql.replace(/\?\??/g, function(match) {
    var value = values[index++]
    
    if (value && typeof value.toSQL === 'function') {
      var bindingSQL = value.toSQL()
      bindings = bindings.concat(bindingSQL.bindings)
      return bindingSQL.sql
    }

    if (match === '??') {
      return client.wrapIdentifier(value)
    }
    bindings.push(value)
    return '?'
  })

  if (expectedBindings.length !== index) {
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
  var keys     = Object.keys(values)
  var client   = raw.client
  var sql      = raw.sql, bindings = []

  if (keys.length > 0) {
    var regex = new RegExp('\\:(' + keys.join('|') + ')\\:?', 'g')
    sql = raw.sql.replace(regex, function(match) {
      if (match[match.length - 1] === ':') {
        return client.wrapIdentifier(values[match.slice(1, -1)])
      }
      var value = values[match.slice(1)]
      if (value && typeof value.toSQL === 'function') {
        var bindingSQL = value.toSQL()
        bindings = bindings.concat(bindingSQL.bindings)
        return bindingSQL.sql
      }
      bindings.push(value)
      return '?'
    })
  }

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

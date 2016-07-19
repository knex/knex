
// Raw
// -------
import inherits from 'inherits';
import * as helpers from './helpers';
import { EventEmitter } from 'events';

import { assign, reduce, isPlainObject, isObject, isUndefined, isNumber } from 'lodash'

import uuid from 'node-uuid';

function Raw(client) {
  this.client = client

  this.sql = ''
  this.bindings = []
  this._cached = undefined

  // Todo: Deprecate
  this._wrappedBefore = undefined
  this._wrappedAfter = undefined
  this._debug = client && client.config && client.config.debug
}
inherits(Raw, EventEmitter)

assign(Raw.prototype, {

  set(sql, bindings) {
    this._cached = undefined
    this.sql = sql
    this.bindings = (
      (isObject(bindings) && !bindings.toSQL) ||
      isUndefined(bindings)
    ) ? bindings : [bindings]

    return this
  },

  timeout(ms, {cancel} = {}) {
    if(isNumber(ms) && ms > 0) {
      this._timeout = ms;
      if (cancel) {
        this.client.assertCanCancelQuery();
        this._cancelOnTimeout = true;
      }
    }
    return this;
  },

  // Wraps the current sql with `before` and `after`.
  wrap(before, after) {
    this._cached = undefined
    this._wrappedBefore = before
    this._wrappedAfter = after
    return this
  },

  // Calls `toString` on the Knex object.
  toString() {
    return this.toQuery()
  },

  // Returns the raw sql for the query.
  toSQL(method, tz) {
    if (this._cached) return this._cached
    if (Array.isArray(this.bindings)) {
      this._cached = replaceRawArrBindings(this)
    } else if (this.bindings && isPlainObject(this.bindings)) {
      this._cached = replaceKeyBindings(this)
    } else {
      this._cached = {
        method: 'raw',
        sql: this.sql,
        bindings: isUndefined(this.bindings) ? void 0 : [this.bindings]
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
      if (this._cancelOnTimeout) {
        this._cached.cancelOnTimeout = this._cancelOnTimeout;
      }
    }
    if(this.client && this.client.prepBindings) {
      this._cached.bindings = this._cached.bindings || [];
      if(helpers.containsUndefined(this._cached.bindings)) {
        throw new Error(
          `Undefined binding(s) detected when compiling RAW query: ` +
          this._cached.sql
        );
      }
      this._cached.bindings = this.client.prepBindings(this._cached.bindings, tz);
    }
    this._cached.__knexQueryUid = uuid.v4();
    return this._cached
  }

})

function replaceRawArrBindings(raw) {
  const expectedBindings = raw.bindings.length
  const values = raw.bindings
  const { client } = raw
  let index = 0;
  let bindings = []

  const sql = raw.sql.replace(/\\?\?\??/g, function(match) {
    if (match === '\\?') {
      return match
    }

    const value = values[index++]

    if (value && typeof value.toSQL === 'function') {
      const bindingSQL = value.toSQL()
      bindings = bindings.concat(bindingSQL.bindings)
      return bindingSQL.sql
    }

    if (match === '??') {
      return client.formatter().columnize(value)
    }
    bindings.push(value)
    return '?'
  })

  if (expectedBindings !== index) {
    throw new Error(`Expected ${expectedBindings} bindings, saw ${index}`)
  }

  return {
    method: 'raw',
    sql,
    bindings
  }
}

function replaceKeyBindings(raw) {
  const values = raw.bindings
  const { client } = raw
  let { sql } = raw, bindings = []

  const regex = /\\?(:\w+:?)/g
  sql = raw.sql.replace(regex, function(full, part) {
    if (full !== part) {
      return part
    }

    const key = full.trim();
    const isIdentifier = key[key.length - 1] === ':'
    const value = isIdentifier ? values[key.slice(1, -1)] : values[key.slice(1)]
    if (value === undefined) {
      bindings.push(value);
      return full;
    }
    if (value && typeof value.toSQL === 'function') {
      const bindingSQL = value.toSQL()
      bindings = bindings.concat(bindingSQL.bindings)
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
    sql,
    bindings
  }
}

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
require('./interface')(Raw)

export default Raw

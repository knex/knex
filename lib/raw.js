// Raw
// -------
const { EventEmitter } = require('events');
const debug = require('debug');
const assign = require('lodash/assign');
const isPlainObject = require('lodash/isPlainObject');
const reduce = require('lodash/reduce');

const {
  replaceRawArrBindings,
  replaceKeyBindings,
} = require('./formatter/rawFormatter');
const helpers = require('./util/helpers');
const saveAsyncStack = require('./util/save-async-stack');
const { nanoid } = require('./util/nanoid');
const { isNumber, isObject } = require('./util/is');
const {
  augmentWithBuilderInterface,
} = require('./builder-interface-augmenter');

const debugBindings = debug('knex:bindings');

class Raw extends EventEmitter {
  constructor(client) {
    super();

    this.client = client;

    this.sql = '';
    this.bindings = [];

    // Todo: Deprecate
    this._wrappedBefore = undefined;
    this._wrappedAfter = undefined;
    if (client && client.config) {
      this._debug = client.config.debug;
      saveAsyncStack(this, 4);
    }
  }
  set(sql, bindings) {
    this.sql = sql;
    this.bindings =
      (isObject(bindings) && !bindings.toSQL) || bindings === undefined
        ? bindings
        : [bindings];

    return this;
  }

  timeout(ms, { cancel } = {}) {
    if (isNumber(ms) && ms > 0) {
      this._timeout = ms;
      if (cancel) {
        this.client.assertCanCancelQuery();
        this._cancelOnTimeout = true;
      }
    }
    return this;
  }

  // Wraps the current sql with `before` and `after`.
  wrap(before, after) {
    this._wrappedBefore = before;
    this._wrappedAfter = after;
    return this;
  }

  // Calls `toString` on the Knex object.
  toString() {
    return this.toQuery();
  }

  // Returns the raw sql for the query.
  toSQL(method, tz) {
    // Validate bindings for MySQL to prevent SQL injection
    // Raw queries need stricter validation - no objects allowed at all
    if (this.client && (this.client.driverName === 'mysql' || this.client.driverName === 'mysql2')) {
      const { isPrimitive } = require('./util/is');
      const assert = require('assert');
      
      const validateRawBinding = (binding) => {
        // For raw queries, only allow true primitives
        // Arrays of primitives are OK though (for WHERE IN clauses)
        if (Array.isArray(binding)) {
          binding.forEach(item => {
            assert(
              isPrimitive(item),
              'Raw query array bindings must contain only primitive values.'
            );
          });
        } else {
          assert(
            isPrimitive(binding),
            'Raw query bindings must be primitive values or arrays of primitives. Objects are not allowed in raw queries.'
          );
        }
      };
      
      if (Array.isArray(this.bindings)) {
        this.bindings.forEach(validateRawBinding);
      } else if (this.bindings !== undefined && !isPlainObject(this.bindings)) {
        validateRawBinding(this.bindings);
      } else if (this.bindings && isPlainObject(this.bindings)) {
        // For named bindings, validate each value
        Object.values(this.bindings).forEach(validateRawBinding);
      }
    }
    
    let obj;
    if (Array.isArray(this.bindings)) {
      obj = replaceRawArrBindings(this, this.client);
    } else if (this.bindings && isPlainObject(this.bindings)) {
      obj = replaceKeyBindings(this, this.client);
    } else {
      obj = {
        method: 'raw',
        sql: this.sql,
        bindings: this.bindings === undefined ? [] : [this.bindings],
      };
    }

    if (this._wrappedBefore) {
      obj.sql = this._wrappedBefore + obj.sql;
    }
    if (this._wrappedAfter) {
      obj.sql = obj.sql + this._wrappedAfter;
    }

    obj.options = reduce(this._options, assign, {});

    if (this._timeout) {
      obj.timeout = this._timeout;
      if (this._cancelOnTimeout) {
        obj.cancelOnTimeout = this._cancelOnTimeout;
      }
    }

    obj.bindings = obj.bindings || [];
    
    // Also validate final bindings after processing
    if (this.client && (this.client.driverName === 'mysql' || this.client.driverName === 'mysql2')) {
      const { isPrimitive } = require('./util/is');
      const assert = require('assert');
      obj.bindings.forEach(binding => {
        if (Array.isArray(binding)) {
          binding.forEach(item => {
            assert(
              isPrimitive(item),
              'Raw query array bindings must contain only primitive values.'
            );
          });
        } else {
          assert(
            isPrimitive(binding),
            'Raw query bindings must be primitive values or arrays of primitives. Objects are not allowed in raw queries.'
          );
        }
      });
    }
    
    if (helpers.containsUndefined(obj.bindings)) {
      const undefinedBindingIndices = helpers.getUndefinedIndices(
        this.bindings
      );
      debugBindings(obj.bindings);
      throw new Error(
        `Undefined binding(s) detected for keys [${undefinedBindingIndices}] when compiling RAW query: ${obj.sql}`
      );
    }

    obj.__knexQueryUid = nanoid();

    Object.defineProperties(obj, {
      toNative: {
        value: () => ({
          sql: this.client.positionBindings(obj.sql),
          bindings: this.client.prepBindings(obj.bindings),
        }),
        enumerable: false,
      },
    });

    return obj;
  }
}

// Workaround to avoid circular dependency between wrappingFormatter.unwrapRaw and rawFormatter
Raw.prototype.isRawInstance = true;

// Allow the `Raw` object to be utilized with full access to the relevant
// promise API.
augmentWithBuilderInterface(Raw);
helpers.addQueryContext(Raw);

module.exports = Raw;

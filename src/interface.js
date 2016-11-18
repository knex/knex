import { isArray, map, clone } from 'lodash'
import Bluebird from 'bluebird'
import asyncInterface from './mixins/asyncInterface'

export default function(TargetClass) {

  TargetClass.prototype.toQuery = function(tz) {
    let data = this.toSQL(this._method, tz);
    if (!isArray(data)) data = [data];
    return map(data, (statement) => {
      return this.client._formatQuery(statement.sql, statement.bindings, tz);
    }).join(';\n');
  }

  // Add additional "options" to the builder. Typically used for client specific
  // items, like the `mysql` and `sqlite3` drivers.
  TargetClass.prototype.options = function(opts) {
    this._options = this._options || [];
    this._options.push(clone(opts) || {});
    return this;
  }

  // Sets an explicit "connnection" we wish to use for this query.
  TargetClass.prototype.connection = function(connection) {
    this.log.warn(
      '.connection is deprecated, please read the documentation about the new knex "contexts"' +
      'feature, and the associated .setConnection API'
    )
    const ctx = this.__context
    if (ctx.isRootContext()) {
      this.__context = ctx.context()
      this.__context.__connection = Bluebird.resolve(connection)
      this.__context.end = () => {
        this.removeAllListeners()
      }
    } else {
      throw new Error('Cannot set .connection on a non-root call')
    }
    return this;
  }

  // Set a debug flag for the current schema query stack.
  TargetClass.prototype.debug = function(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  }

  // Set the transaction object for this query.
  TargetClass.prototype.transacting = function(t) {
    if (t && t.client) {
      if (!t.isTransaction()) {
        this.log.warn(`Invalid transaction value: ${t.client}`)
      } else {
        this.__context = t
      }
    }
    return this;
  }

  // Initializes a stream.
  TargetClass.prototype.stream = function(options) {
    return this.client.runner(this).stream(options);
  }

  // Initialize a stream & pipe automatically.
  TargetClass.prototype.pipe = function(writable, options) {
    return this.client.runner(this).pipe(writable, options);
  }

  // If .then isn't defined, add a standard implementation
  if (!TargetClass.prototype.then) {

    TargetClass.prototype.then = function(/* onFulfilled, onRejected */) {
      if (!this.__promise) {
        const result = this.client.runner(this).run()
        this.__promise = Bluebird.resolve(result.then.apply(result, arguments));
      }
      return this.__promise
    }

  }

  // Proxied Bluebird api methods:

  asyncInterface(TargetClass)

}

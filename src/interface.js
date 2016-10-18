import { isArray, map, clone } from 'lodash'
import Bluebird from 'bluebird'

export default function(Target) {

  Target.prototype.toQuery = function(tz) {
    let data = this.toSQL(this._method, tz);
    if (!isArray(data)) data = [data];
    return map(data, (statement) => {
      return this.client._formatQuery(statement.sql, statement.bindings, tz);
    }).join(';\n');
  }

  // Create a new instance of the `Runner`, passing in the current object.
  Target.prototype.then = function(/* onFulfilled, onRejected */) {
    if (!this._promise) {
      const result = this.client.runner(this).run()
      this._promise = Bluebird.resolve(result.then.apply(result, arguments));
    }
    return this._promise
  }

  // Add additional "options" to the builder. Typically used for client specific
  // items, like the `mysql` and `sqlite3` drivers.
  Target.prototype.options = function(opts) {
    this._options = this._options || [];
    this._options.push(clone(opts) || {});
    return this;
  }

  // Sets an explicit "connnection" we wish to use for this query.
  Target.prototype.connection = function(connection) {
    this._connection = connection;
    return this;
  }

  // Set a debug flag for the current schema query stack.
  Target.prototype.debug = function(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  }

  // Set the transaction object for this query.
  Target.prototype.transacting = function(t) {
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
  Target.prototype.stream = function(options) {
    return this.client.runner(this).stream(options);
  }

  // Initialize a stream & pipe automatically.
  Target.prototype.pipe = function(writable, options) {
    return this.client.runner(this).pipe(writable, options);
  }

  // Proxied Bluebird api methods:

  Target.prototype.bind = function bind() {
    const then = this.then()
    return then.bind.apply(then, arguments)
  }
  Target.prototype.catch = function catch$() {
    const then = this.then()
    return then.catch.apply(then, arguments)
  }
  Target.prototype.finally = function finally$() {
    const then = this.then()
    return then.finally.apply(then, arguments)
  }
  Target.prototype.asCallback = function asCallback() {
    const then = this.then()
    return then.asCallback.apply(then, arguments)
  }
  Target.prototype.spread = function spread() {
    const then = this.then()
    return then.spread.apply(then, arguments)
  }
  Target.prototype.map = function map() {
    const then = this.then()
    return then.map.apply(then, arguments)
  }
  Target.prototype.reduce = function reduce() {
    const then = this.then()
    return then.reduce.apply(then, arguments)
  }
  Target.prototype.tap = function tap() {
    const then = this.then()
    return then.tap.apply(then, arguments)
  }
  Target.prototype.thenReturn = function thenReturn() {
    const then = this.then()
    return then.thenReturn.apply(then, arguments)
  }
  Target.prototype.return = function return$() {
    const then = this.then()
    return then.return.apply(then, arguments)
  }
  Target.prototype.yield = function yield$() {
    const then = this.then()
    return then.yield.apply(then, arguments)
  }
  Target.prototype.ensure = function ensure() {
    const then = this.then()
    return then.ensure.apply(then, arguments)
  }
  Target.prototype.reflect = function reflect() {
    const then = this.then()
    return then.reflect.apply(then, arguments)
  }

}

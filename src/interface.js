
import * as helpers from './helpers';
import { isEmpty, isArray, map, clone, each } from 'lodash'

export default function(Target) {

  Target.prototype.toQuery = function(tz) {
    let data = this.toSQL(this._method, tz);
    if (!isArray(data)) data = [data];
    return map(data, (statement) => {
      return this.client._formatQuery(statement.sql, statement.bindings, tz);
    }).join(';\n');
  };

  // Create a new instance of the `Runner`, passing in the current object.
  Target.prototype.then = function(/* onFulfilled, onRejected */) {
    const result = this.client.runner(this).run()
    return result.then.apply(result, arguments);
  };

  // Add additional "options" to the builder. Typically used for client specific
  // items, like the `mysql` and `sqlite3` drivers.
  Target.prototype.options = function(opts) {
    this._options = this._options || [];
    this._options.push(clone(opts) || {});
    return this;
  };

  // Sets an explicit "connnection" we wish to use for this query.
  Target.prototype.connection = function(connection) {
    this._connection = connection;
    return this;
  };

  // Set a debug flag for the current schema query stack.
  Target.prototype.debug = function(enabled) {
    this._debug = arguments.length ? enabled : true;
    return this;
  };

  // Set the transaction object for this query.
  Target.prototype.transacting = function(t) {
    if (t && t.client) {
      if (!t.client.transacting) {
        helpers.warn(`Invalid transaction value: ${t.client}`)
      } else {
        this.client = t.client
      }
    }
    if (isEmpty(t)) {
      helpers.error('Invalid value on transacting call, potential bug')
      throw Error('Invalid transacting value (null, undefined or empty object)')
    }
    return this;
  };

  // Initializes a stream.
  Target.prototype.stream = function(options) {
    return this.client.runner(this).stream(options);
  };

  // Initialize a stream & pipe automatically.
  Target.prototype.pipe = function(writable, options) {
    return this.client.runner(this).pipe(writable, options);
  };

  // Creates a method which "coerces" to a promise, by calling a
  // "then" method on the current `Target`
  each(['bind', 'catch', 'finally', 'asCallback',
    'spread', 'map', 'reduce', 'tap', 'thenReturn',
    'return', 'yield', 'ensure', 'reflect',
    'get', 'mapSeries', 'delay'], function(method) {
    Target.prototype[method] = function() {
      const promise = this.then();
      return promise[method].apply(promise, arguments);
    };
  });

}

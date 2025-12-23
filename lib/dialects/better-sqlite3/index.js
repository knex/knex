// better-sqlite3 Client
// -------
const Client_SQLite3 = require('../sqlite3');

/** @typedef {{defaultSafeIntegers: boolean}} ConnectionContext */
/** @typedef {import('better-sqlite3').Database} BetterSqlite3Database */
/**
 * @typedef {Object} BetterSqlite3QueryContext
 * @property {number|bigint} lastID
 * @property {number} changes
 * @property {boolean|undefined} safeIntegers
 */
/** @typedef {import('../../execution/runner').QueryResult<BetterSqlite3QueryContext>} QueryResult */

const { Cast, ResultMapper } = require('../../query/cast');

/** @typedef {import('../../query/querycompiler').QueryMethod} QueryMethod */
/** @typedef {import('..').BetterSqlite3QueryContext} BetterSqlite3QueryContext */
/** @typedef {import('../../query/cast').CastCallback<BetterSqlite3QueryContext>} CastCallback */
/** @typedef {import('../../query/cast').ResultMapper<BetterSqlite3QueryContext>} BetterSqlite3Mapper */
/** @typedef {import('../../query/cast').ResultMapper} DefaultMapper */

/** @type {CastCallback} */
const bigintToNumber = (value, cast, ctx) => {
  // in "normal" mode, do the default behavior for everything
  if (ctx.safeIntegers === false) return cast(value);

  // we're in "bigint" mode (safeIntegers: true) - "undo"
  // any values that are not explicitly requested as bigint

  // if we don't have a bigint, do the default behavior
  if (typeof value !== 'bigint') return cast(value);

  // if we're expecting a bigint, leave it that way
  if (cast.type === 'bigint') return value;

  // if we're not expecting a bigint, cast to number
  // this will throw if the value is outside the acceptable range!
  return Cast.number(value);
};

/**
 * @param {undefined|{safeIntegers?: unknown}} options
 * @returns
 */
const optSafeIntegers = (options) => {
  if (
    options != null &&
    typeof options === 'object' &&
    typeof options.safeIntegers === 'boolean'
  ) {
    return options.safeIntegers;
  }
  return undefined;
};

class Client_BetterSQLite3 extends Client_SQLite3 {
  /** @type {WeakMap<import('better-sqlite3').Database, ConnectionContext>} */
  connections;

  /** @param {import('../../../types/index').Knex.Config} config */
  constructor(config) {
    super(config);
    this.connections = new WeakMap();
  }

  _driver() {
    return require('better-sqlite3');
  }

  /**
   * Hook `makeTrxClient`'s clone behavior to pass over the connections WeakMap
   * to transaction clients
   */
  _onTrxClient(target) {
    target.connections = this.connections;
  }

  // Get a raw connection from the database, returning a promise with the connection object.
  async acquireRawConnection() {
    const options = this.connectionSettings.options || {};
    const db = this.driver(this.connectionSettings.filename, {
      nativeBinding: options.nativeBinding,
      readonly: !!options.readonly,
    });

    // keep track of whether the user requested a setting at the connection level
    this.connections.set(db, { defaultSafeIntegers: optSafeIntegers(options) });

    // set default into a known state. we're going to update it on every query
    // _if_ the user has told us to; otherwise we operate in "safe but remap"
    // mode, where we map bigints back to numbers but with a safety check
    db.defaultSafeIntegers(true);

    return db;
  }

  /**
   * Used to explicitly close a connection, called internally by the pool when
   * a connection times out or the pool is shutdown.
   *
   * @param {BetterSqlite3Database} connection
   * @returns {Promise<BetterSqlite3Database>}
   */
  async destroyRawConnection(connection) {
    return connection.close();
  }

  /**
   * Determine whether to use safeIntegers mode for a specific query / connection
   *
   * @param {BetterSqlite3Database} connection
   * @param {any} opts
   * @returns {boolean|undefined}
   */
  shouldUseSafeIntegers(connection, opts) {
    const safeIntegers = optSafeIntegers(opts);
    if (safeIntegers !== undefined) {
      // explicitly specified for this query
      return safeIntegers;
    }

    const ctx = this.connections.get(connection);
    if (ctx === undefined) {
      // I'd rather throw here, but with all the abstraction around connections and connection
      // pooling, I don't _know_ that it's safe
      this.logger.warn(
        `Client_BetterSQLite3: Connection context missing from WeakMap, this is probably a bug`
      );
    }

    return ctx?.defaultSafeIntegers;
  }

  /**
   * Runs the query on the specified connection, providing the bindings and any
   * other necessary prep work.
   *
   * @param {BetterSqlite3Database} connection
   * @param {QueryResult} obj
   * @returns {Promise<QueryResult>}
   */
  async _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    if (!connection) {
      throw new Error('No connection provided');
    }

    const statement = connection.prepare(obj.sql);
    const safeIntegers = this.shouldUseSafeIntegers(connection, obj.options);
    if (safeIntegers !== undefined) {
      // if the user has explicitly specified a safeIntegers mode, either for
      // this query or at the connection level, use it
      statement.safeIntegers(safeIntegers);
    }
    const bindings = this._formatBindings(obj.bindings);

    if (statement.reader) {
      const response = await statement.all(bindings);
      obj.response = response;
      // let the client know what the user's setting was when we ran the query
      obj.context = { safeIntegers };

      return obj;
    } else {
      const response = await statement.run(bindings);
      obj.response = response;
      obj.context = {
        lastID: response.lastInsertRowid,
        changes: response.changes,
        // let the client know what the user's setting was when we ran the query
        safeIntegers,
      };

      return obj;
    }
  }

  /**
   * @param {BetterSqlite3QueryContext} ctx
   * @returns {BetterSqlite3Mapper|undefined}
   */
  resultMapper(ctx) {
    if (ctx.safeIntegers === undefined) {
      // user did not specify a safeIntegers mode; we're running the query
      // with safeIntegers: true but mapping the results as though it was
      // run with safeIntegers: false

      return new ResultMapper(this.cast ?? {}, bigintToNumber);
    }

    // otherwise, just do whatever they said as far as casting goes
    return this.cast ? new ResultMapper(this.cast) : undefined;
  }

  /**
   * @param {any[]} [bindings]
   * @returns {any[]}
   */
  _formatBindings(bindings) {
    if (!bindings) {
      return [];
    }
    return bindings.map((binding) => {
      if (binding instanceof Date) {
        return binding.valueOf();
      }

      if (typeof binding === 'boolean') {
        return Number(binding);
      }

      return binding;
    });
  }
}

Object.assign(Client_BetterSQLite3.prototype, {
  // The "dialect", for reference .
  driverName: 'better-sqlite3',
});

module.exports = Client_BetterSQLite3;

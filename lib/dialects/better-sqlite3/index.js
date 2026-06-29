// better-sqlite3 Client
// -------
const Client_SQLite3 = require('../sqlite3');

class Client_BetterSQLite3 extends Client_SQLite3 {
  _driver() {
    return require('better-sqlite3');
  }

  // Get a raw connection from the database, returning a promise with the connection object.
  async acquireRawConnection() {
    const options = this.connectionSettings.options || {};

    const db = new this.driver(this.connectionSettings.filename, {
      nativeBinding: options.nativeBinding,
      readonly: !!options.readonly,
    });

    const safeIntegers = this._optSafeIntegers(options);
    if (safeIntegers !== undefined) {
      db.defaultSafeIntegers(safeIntegers);
    }

    return db;
  }

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  async destroyRawConnection(connection) {
    return connection.close();
  }

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  async _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    if (!connection) {
      throw new Error('No connection provided');
    }

    const statement = connection.prepare(obj.sql);

    const safeIntegers = this._optSafeIntegers(obj.options);
    if (safeIntegers !== undefined) {
      statement.safeIntegers(safeIntegers);
    }

    const bindings = this._formatBindings(obj.bindings);

    if (statement.reader) {
      const response = await statement.all(bindings);
      obj.response = response;
      return obj;
    }

    const response = await statement.run(bindings);
    obj.response = response;
    obj.context = {
      lastID: response.lastInsertRowid,
      changes: response.changes,
    };

    return obj;
  }

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

  _optSafeIntegers(options) {
    if (
      options &&
      typeof options === 'object' &&
      typeof options.safeIntegers === 'boolean'
    ) {
      return options.safeIntegers;
    }
    return undefined;
  }
}

Object.assign(Client_BetterSQLite3.prototype, {
  // The "dialect", for reference .
  driverName: 'better-sqlite3',
});

module.exports = Client_BetterSQLite3;

// better-sqlite3 Client
// -------
const Client_SQLite3 = require('../sqlite3');

class Client_BetterSQLite3 extends Client_SQLite3 {
  constructor(connection, options) {
    super(connection, options);
  }

  _driver() {
    return require('better-sqlite3');
  }

  // Get a raw connection from the database, returning a promise with the connection object.
  async acquireRawConnection() {
    console.log('running raw');
    return new this.driver(this.connectionSettings.filename);
  }

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  async _query(connection, obj) {
    console.log(obj.sql);
    if (!obj.sql) throw new Error('The query is empty');

    if (!connection) {
      throw new Error('No connection provided');
    }

    const statement = connection.prepare(obj.sql);
    if (statement.reader) {
      const response = await statement.all(obj.bindings ?? []);
      obj.response = response;
      return obj;
    }

    const response = await statement.run(obj.bindings ?? []);
    obj.response = response;
    obj.context = {
      lastID: response.lastInsertRowid,
      changes: response.changes,
    };
    return obj;
  }
}

Object.assign(Client_BetterSQLite3.prototype, {
  // The "dialect", for reference .
  driverName: 'better-sqlite3',
});

module.exports = Client_BetterSQLite3;

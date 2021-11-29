// better-sqlite3 Client
// -------
const Client_SQLite3 = require('../sqlite3');

class Client_BetterSQLite3 extends Client_SQLite3 {
  _driver() {
    return require('better-sqlite3');
  }

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection() {
    return new Promise((resolve, reject) => {
      const db = new this.driver(this.connectionSettings.filename, {
        verbose: this.connectionSettings.debug,
      });

      resolve(db);
    });
  }

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query(connection, obj) {
    if (!obj.sql) throw new Error('The query is empty');

    const { method } = obj;
    let callMethod;
    switch (method) {
      case 'insert':
      case 'update':
      case 'counter':
      case 'del':
        callMethod = 'run';
        break;
      default:
        callMethod = 'run';
    }
    return new Promise(function (resolver, rejecter) {
      if (!connection) {
        return rejecter(
          new Error(`Error calling ${callMethod} on connection.`)
        );
      }

      try {
        const statement = connection.prepare(obj.sql);
        const response = statement.run(...(obj.bindings || []));
        obj.response = response;
        resolver(obj);
      } catch (ex) {
        rejecter(ex);
      }
    });
  }
}

Object.assign(Client_BetterSQLite3.prototype, {
  // The "dialect", for reference .
  driverName: 'better-sqlite3',
});

module.exports = Client_BetterSQLite3;

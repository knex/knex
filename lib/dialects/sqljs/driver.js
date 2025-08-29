const { EventEmitter } = require('events');
const initSqlJs = require('sql.js');

/**
 * @param {SqljsConnectionConfig} config
 * @param {?Function} mode
 * @param {?Function} callback
 */
class Database extends EventEmitter {
  constructor(config, mode, callback) {
    super();
    const cb = typeof mode === 'function' ? mode : callback;

    const onError = (error) => {
      if (cb) {
        cb(error);
      } else {
        this.emit('error', error);
      }
    };

    const onSuccess = () => {
      this.emit('open');
      if (cb) {
        cb(null);
      }
    };

    initSqlJs(config.sqljs).then((SQL) => {
      this.database = new SQL.Database(config.bytes || Uint8Array.from([]));
      onSuccess();
    }, onError);
  }

  close(callback) {
    this.database.close();
    this.emit('close');
    if (callback) {
      callback(null);
    }
  }

  // "Set a configuration option for the database. Valid options are:
  //  * Tracing & profiling
  //    * trace: provide a function callback as a value. Invoked when an SQL statement executes, with a rendering of the statement text.
  //    * profile: provide a function callback. Invoked every time an SQL statement executes.
  //  * busyTimeout: provide an integer as a value. Sets the busy timeout".
  configure() {}

  // "Loads a compiled SQLite extension into the database connection object".
  loadExtension() {
    throw new Error('`loadExtension()` is not supported');
  }

  // "Allows the user to interrupt long-running queries.
  //  Wrapper around `sqlite3_interrupt` and causes other data-fetching functions
  //  to be passed an `error` with `code = sqlite3.INTERRUPT`".
  interrupt() {
    // This method is not implemented because `sql.js` methods are "synchronous" ("blocking").
    // this.database.exec('select interrupt();')
  }

  // There're no docs on this method.
  // I guess it calls the `callback` after all queries have finished.
  wait(callback) {
    // `sql.js` methods are "synchronous" ("blocking")
    // so the `wait()` method doesn't really make sense here.
    // It just calls the `callback`.
    if (callback) {
      callback(null);
    }
  }

  // https://stackoverflow.com/questions/41949724/how-does-db-serialize-work-in-node-sqlite3
  // "Each command inside the `serialize()`'s `func` function is guaranteed to finish executing
  //  before the next one starts".
  serialize(func) {
    func();
  }

  // https://www.sqlitetutorial.net/sqlite-nodejs/statements-control-flow/
  // "The `serialize()` method allows you to execute statements in serialized mode,
  //  while the `parallelize()` method executes the statements in parallel".
  parallelize(func) {
    func();
  }

  // "Runs the SQL query with the specified parameters and calls the `callback` afterwards.
  //  It does not retrieve any result data".
  run(...args) {
    const { query, callback: unboundCallback, parameters } = getArgs(args);

    // "If execution was successful, the this object will contain two properties named
    //  `lastID` and `changes` which contain the value of the last inserted row ID
    //  and the number of rows affected by this query respectively".
    const statement = {};

    let callback = unboundCallback;
    if (callback) {
      callback = callback.bind(statement);
    }

    try {
      const db = this.database;
      // Run the query.
      db.run(query, parameters);

      // Just a simple "lame" SQL operation type detection.
      const isInsert = /^\s*insert\s+/i.test(query);
      const isUpdate = /^\s*update\s+/i.test(query);
      const isDelete = /^\s*delete\s+/i.test(query);

      // Gets a value from the database.
      const getValue = (query) => {
        const results = db.exec(`${query};`);
        return results[0].values[0][0];
      };

      if (isInsert) {
        // The row ID of the most recent successful INSERT.
        statement.lastID = getValue('select last_insert_rowid()');
      }

      if (isInsert || isUpdate || isDelete) {
        // The number of rows modified, inserted or deleted by the most recently completed
        // INSERT, UPDATE or DELETE statement.
        statement.changes = getValue('select changes()');
      }

      if (callback) {
        callbackAsync(callback, null);
      }
    } catch (error) {
      if (callback) {
        callbackAsync(callback, error);
      } else {
        this.emit('error', error);
      }
    }

    return this;
  }

  // "Runs the SQL query with the specified parameters and calls the `callback`
  //  with all result rows afterwards".
  all(...args) {
    const { query, callback, parameters } = getArgs(args);

    try {
      const db = this.database;
      const results = [];

      db.each(
        query,
        parameters,
        (result) => {
          results.push(result);
        },
        () => {
          if (callback) {
            callbackAsync(callback, null, results);
          }
        }
      );
    } catch (error) {
      if (callback) {
        callbackAsync(callback, error);
      } else {
        throw error;
      }
    }

    return this;
  }

  // "Runs the SQL query with the specified parameters and calls the `callback`
  //  once for each result row".
  each(...args) {
    const { query, callback, parameters } = getArgs(args);

    try {
      const db = this.database;
      db.each(
        query,
        parameters,
        // When a query has produced a result (only for `SELECT` queries).
        (result) => {
          if (callback) {
            callbackAsync(callback, null, result);
          }
        }
      );
    } catch (error) {
      if (callback) {
        callbackAsync(callback, error);
      } else {
        throw error;
      }
    }

    return this;
  }

  get(...args) {
    const { query, callback, parameters } = getArgs(args);

    try {
      const db = this.database;
      const results = db.exec(query, parameters);

      // "If the result set is empty, the second parameter is `undefined`,
      //  otherwise it is an object containing the values for the first row.
      //  The property `names` correspond to the column names of the result set".
      //
      // I dunno if the `result` object is correct or not.
      // It's more of a "placeholder" implementation.
      //
      const result = results[0];

      if (callback) {
        callbackAsync(callback, null, result);
      }
    } catch (error) {
      if (callback) {
        callbackAsync(callback, error);
      } else {
        throw error;
      }
    }

    return this;
  }

  // "Runs all SQL queries in the supplied string. No result rows are retrieved".
  exec(query, callback) {
    try {
      const db = this.database;
      db.exec(query);

      if (callback) {
        callbackAsync(callback, null);
      }
    } catch (error) {
      if (callback) {
        callbackAsync(callback, error);
      } else {
        this.emit('error', error);
      }
    }

    return this;
  }

  // "Prepares the SQL statement and optionally binds the specified parameters
  //  and calls the callback when done. The function returns a Statement object."
  prepare(...args) {
    const { query, callback, parameters } = getArgs(args);
    let statement = {};

    try {
      const db = this.database;
      statement = db.prepare(query, parameters);

      if (callback) {
        callbackAsync(callback, null);
      }
    } catch (error) {
      if (callback) {
        callbackAsync(callback, error);
      } else {
        throw error;
      }
    }

    return statement;
  }
}

function callbackAsync(callback, error, result) {
  process.nextTick(() => callback(error, result));
}

function getArgs(args) {
  const query = args.shift();
  let parameters;
  let callback;

  if (args.length === 0) {
    parameters = [];
  } else {
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop();
    }
    parameters = args;
  }

  // If parameters were passed as an object then convert them to an object.
  if (parameters.length === 1) {
    if (parameters[0] !== null && typeof parameters[0] === 'object') {
      parameters = parameters[0];
    }
  }

  return {
    query,
    parameters,
    callback,
  };
}

exports.Database = Database;

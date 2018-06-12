'use strict';

exports.__esModule = true;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// So altering the schema in SQLite3 is a major pain.
// We have our own object to deal with the renaming and altering the types
// for sqlite3 things.

// SQLite3_DDL
//
// All of the SQLite3 specific DDL helpers for renaming/dropping
// columns and changing datatypes.
// -------

function SQLite3_DDL(client, tableCompiler, pragma, connection) {
  this.client = client;
  this.tableCompiler = tableCompiler;
  this.pragma = pragma;
  this.tableName = this.tableCompiler.tableNameRaw;
  this.alteredName = (0, _lodash.uniqueId)('_knex_temp_alter');
  this.connection = connection;
}

(0, _lodash.assign)(SQLite3_DDL.prototype, {

  getColumn: _bluebird2.default.method(function (column) {
    var currentCol = (0, _lodash.find)(this.pragma, { name: column });
    if (!currentCol) throw new Error('The column ' + column + ' is not in the ' + this.tableName + ' table');
    return currentCol;
  }),

  getTableSql: function getTableSql() {
    return this.trx.raw('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName + '"');
  },


  renameTable: _bluebird2.default.method(function () {
    return this.trx.raw('ALTER TABLE "' + this.tableName + '" RENAME TO "' + this.alteredName + '"');
  }),

  dropOriginal: function dropOriginal() {
    return this.trx.raw('DROP TABLE "' + this.tableName + '"');
  },
  dropTempTable: function dropTempTable() {
    return this.trx.raw('DROP TABLE "' + this.alteredName + '"');
  },
  copyData: function copyData() {
    return this.trx.raw('SELECT * FROM "' + this.tableName + '"').bind(this).then(this.insertChunked(20, this.alteredName));
  },
  reinsertData: function reinsertData(iterator) {
    return function () {
      return this.trx.raw('SELECT * FROM "' + this.alteredName + '"').bind(this).then(this.insertChunked(20, this.tableName, iterator));
    };
  },
  insertChunked: function insertChunked(amount, target, iterator) {
    iterator = iterator || _lodash.identity;
    return function (result) {
      var batch = [];
      var ddl = this;
      return _bluebird2.default.reduce(result, function (memo, row) {
        memo++;
        batch.push(row);
        if (memo % 20 === 0 || memo === result.length) {
          return ddl.trx.queryBuilder().table(target).insert((0, _lodash.map)(batch, iterator)).then(function () {
            batch = [];
          }).thenReturn(memo);
        }
        return memo;
      }, 0);
    };
  },
  createTempTable: function createTempTable(createTable) {
    return function () {
      return this.trx.raw(createTable.sql.replace(this.tableName, this.alteredName));
    };
  },
  _doReplace: function _doReplace(sql, from, to) {
    var matched = sql.match(/^CREATE TABLE (\S+) \((.*)\)/);

    var tableName = matched[1];
    var defs = matched[2];

    if (!defs) {
      throw new Error('No column definitions in this statement!');
    }

    var parens = 0,
        args = [],
        ptr = 0;
    var i = 0;
    var x = defs.length;
    for (i = 0; i < x; i++) {
      switch (defs[i]) {
        case '(':
          parens++;
          break;
        case ')':
          parens--;
          break;
        case ',':
          if (parens === 0) {
            args.push(defs.slice(ptr, i));
            ptr = i + 1;
          }
          break;
        case ' ':
          if (ptr === i) {
            ptr = i + 1;
          }
          break;
      }
    }
    args.push(defs.slice(ptr, i));

    args = args.map(function (item) {
      var split = item.split(' ');

      if (split[0] === from) {
        // column definition
        if (to) {
          split[0] = to;
          return split.join(' ');
        }
        return ''; // for deletions
      }

      // skip constraint name
      var idx = /constraint/i.test(split[0]) ? 2 : 0;

      // primary key and unique constraints have one or more
      // columns from this table listed between (); replace
      // one if it matches
      if (/primary|unique/i.test(split[idx])) {
        return item.replace(/\(.*\)/, function (columns) {
          return columns.replace(from, to);
        });
      }

      // foreign keys have one or more columns from this table
      // listed between (); replace one if it matches
      // foreign keys also have a 'references' clause
      // which may reference THIS table; if it does, replace
      // column references in that too!
      if (/foreign/.test(split[idx])) {
        split = item.split(/ references /i);
        // the quoted column names save us from having to do anything
        // other than a straight replace here
        split[0] = split[0].replace(from, to);

        if (split[1].slice(0, tableName.length) === tableName) {
          split[1] = split[1].replace(/\(.*\)/, function (columns) {
            return columns.replace(from, to);
          });
        }
        return split.join(' references ');
      }

      return item;
    });
    return sql.replace(/\(.*\)/, function () {
      return '(' + args.join(', ') + ')';
    }).replace(/,\s*([,)])/, '$1');
  },


  // Boy, this is quite a method.
  renameColumn: _bluebird2.default.method(function (from, to) {
    var _this = this;

    return this.client.transaction(function (trx) {
      _this.trx = trx;
      return _this.getColumn(from).bind(_this).then(_this.getTableSql).then(function (sql) {
        var a = this.client.wrapIdentifier(from);
        var b = this.client.wrapIdentifier(to);
        var createTable = sql[0];
        var newSql = this._doReplace(createTable.sql, a, b);
        if (sql === newSql) {
          throw new Error('Unable to find the column to change');
        }
        return _bluebird2.default.bind(this).then(this.createTempTable(createTable)).then(this.copyData).then(this.dropOriginal).then(function () {
          return this.trx.raw(newSql);
        }).then(this.reinsertData(function (row) {
          row[to] = row[from];
          return (0, _lodash.omit)(row, from);
        })).then(this.dropTempTable);
      });
    }, { connection: this.connection });
  }),

  dropColumn: _bluebird2.default.method(function (columns) {
    var _this2 = this;

    return this.client.transaction(function (trx) {
      _this2.trx = trx;
      return _bluebird2.default.all(columns.map(function (column) {
        return _this2.getColumn(column);
      })).bind(_this2).then(_this2.getTableSql).then(function (sql) {
        var _this3 = this;

        var createTable = sql[0];
        var newSql = createTable.sql;
        columns.forEach(function (column) {
          var a = _this3.client.wrapIdentifier(column);
          newSql = _this3._doReplace(newSql, a, '');
        });
        if (sql === newSql) {
          throw new Error('Unable to find the column to change');
        }
        return _bluebird2.default.bind(this).then(this.createTempTable(createTable)).then(this.copyData).then(this.dropOriginal).then(function () {
          return this.trx.raw(newSql);
        }).then(this.reinsertData(function (row) {
          return _lodash.omit.apply(undefined, [row].concat(columns));
        })).then(this.dropTempTable);
      });
    }, { connection: this.connection });
  })

});

exports.default = SQLite3_DDL;
module.exports = exports['default'];
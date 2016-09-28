'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablecompiler = require('../../../schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Table Compiler
// ------

/* eslint max-len:0 no-console:0*/

// MySQL Table Builder & Compiler
// -------
function TableCompiler_MySQL() {
  _tablecompiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(TableCompiler_MySQL, _tablecompiler2.default);

(0, _assign3.default)(TableCompiler_MySQL.prototype, {
  createQuery: function createQuery(columns, ifNot) {
    var createStatement = ifNot ? 'create table if not exists ' : 'create table ';
    var client = this.client;

    var conn = {};
    var sql = createStatement + this.tableName() + ' (' + columns.sql.join(', ') + ')';

    // Check if the connection settings are set.
    if (client.connectionSettings) {
      conn = client.connectionSettings;
    }

    var charset = this.single.charset || conn.charset || '';
    var collation = this.single.collate || conn.collate || '';
    var engine = this.single.engine || '';

    // var conn = builder.client.connectionSettings;
    if (charset) sql += ' default character set ' + charset;
    if (collation) sql += ' collate ' + collation;
    if (engine) sql += ' engine = ' + engine;

    if (this.single.comment) {
      var comment = this.single.comment || '';
      if (comment.length > 60) helpers.warn('The max length for a table comment is 60 characters');
      sql += ' comment = \'' + comment + '\'';
    }

    this.pushQuery(sql);
  },


  addColumnsPrefix: 'add ',

  dropColumnPrefix: 'drop ',

  // Compiles the comment on the table.
  comment: function comment(_comment) {
    this.pushQuery('alter table ' + this.tableName() + ' comment = \'' + _comment + '\'');
  },
  changeType: function changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },


  // Renames a column on the table.
  renameColumn: function renameColumn(from, to) {
    var compiler = this;
    var table = this.tableName();
    var wrapped = this.formatter.wrap(from) + ' ' + this.formatter.wrap(to);

    this.pushQuery({
      sql: 'show fields from ' + table + ' where field = ' + this.formatter.parameter(from),
      output: function output(resp) {
        var column = resp[0];
        var runner = this;
        return compiler.getFKRefs(runner).get(0).then(function (refs) {
          return _bluebird2.default.try(function () {
            if (!refs.length) {
              return;
            }
            return compiler.dropFKRefs(runner, refs);
          }).then(function () {
            var sql = 'alter table ' + table + ' change ' + wrapped + ' ' + column.Type;

            if (String(column.Null).toUpperCase() !== 'YES') {
              sql += ' NOT NULL';
            }
            if (column.Default !== void 0 && column.Default !== null) {
              sql += ' DEFAULT \'' + column.Default + '\'';
            }

            return runner.query({
              sql: sql
            });
          }).then(function () {
            if (!refs.length) {
              return;
            }
            return compiler.createFKRefs(runner, refs.map(function (ref) {
              if (ref.REFERENCED_COLUMN_NAME === from) {
                ref.REFERENCED_COLUMN_NAME = to;
              }
              if (ref.COLUMN_NAME === from) {
                ref.COLUMN_NAME = to;
              }
              return ref;
            }));
          });
        });
      }
    });
  },
  getFKRefs: function getFKRefs(runner) {
    var formatter = this.client.formatter();
    var sql = 'SELECT KCU.CONSTRAINT_NAME, KCU.TABLE_NAME, KCU.COLUMN_NAME, ' + '       KCU.REFERENCED_TABLE_NAME, KCU.REFERENCED_COLUMN_NAME, ' + '       RC.UPDATE_RULE, RC.DELETE_RULE ' + 'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU ' + 'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC ' + '       USING(CONSTRAINT_NAME)' + 'WHERE KCU.REFERENCED_TABLE_NAME = ' + formatter.parameter(this.tableNameRaw) + ' ' + '  AND KCU.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database()) + ' ' + '  AND RC.CONSTRAINT_SCHEMA = ' + formatter.parameter(this.client.database());

    return runner.query({
      sql: sql,
      bindings: formatter.bindings
    });
  },
  dropFKRefs: function dropFKRefs(runner, refs) {
    var formatter = this.client.formatter();

    return _bluebird2.default.all(refs.map(function (ref) {
      var constraintName = formatter.wrap(ref.CONSTRAINT_NAME);
      var tableName = formatter.wrap(ref.TABLE_NAME);
      return runner.query({
        sql: 'alter table ' + tableName + ' drop foreign key ' + constraintName
      });
    }));
  },
  createFKRefs: function createFKRefs(runner, refs) {
    var formatter = this.client.formatter();

    return _bluebird2.default.all(refs.map(function (ref) {
      var tableName = formatter.wrap(ref.TABLE_NAME);
      var keyName = formatter.wrap(ref.CONSTRAINT_NAME);
      var column = formatter.columnize(ref.COLUMN_NAME);
      var references = formatter.columnize(ref.REFERENCED_COLUMN_NAME);
      var inTable = formatter.wrap(ref.REFERENCED_TABLE_NAME);
      var onUpdate = ' ON UPDATE ' + ref.UPDATE_RULE;
      var onDelete = ' ON DELETE ' + ref.DELETE_RULE;

      return runner.query({
        sql: 'alter table ' + tableName + ' add constraint ' + keyName + ' ' + 'foreign key (' + column + ') references ' + inTable + ' (' + references + ')' + onUpdate + onDelete
      });
    }));
  },
  index: function index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' add index ' + indexName + '(' + this.formatter.columnize(columns) + ')');
  },
  primary: function primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('alter table ' + this.tableName() + ' add primary key ' + constraintName + '(' + this.formatter.columnize(columns) + ')');
  },
  unique: function unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' add unique ' + indexName + '(' + this.formatter.columnize(columns) + ')');
  },


  // Compile a drop index command.
  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
  },


  // Compile a drop foreign key command.
  dropForeign: function dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop foreign key ' + indexName);
  },


  // Compile a drop primary key command.
  dropPrimary: function dropPrimary() {
    this.pushQuery('alter table ' + this.tableName() + ' drop primary key');
  },


  // Compile a drop unique key command.
  dropUnique: function dropUnique(column, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, column);
    this.pushQuery('alter table ' + this.tableName() + ' drop index ' + indexName);
  }
});

exports.default = TableCompiler_MySQL;
module.exports = exports['default'];
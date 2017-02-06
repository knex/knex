'use strict';

exports.__esModule = true;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _toArray2 = require('lodash/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _extend2 = require('lodash/extend');

var _extend3 = _interopRequireDefault(_extend2);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function TableBuilder(client, method, tableName, fn) {
  this.client = client;
  this._fn = fn;
  this._method = method;
  this._schemaName = undefined;
  this._tableName = tableName;
  this._statements = [];
  this._single = {};

  if (!(0, _isFunction3.default)(this._fn)) {
    throw new TypeError('A callback function must be supplied to calls against `.createTable` ' + 'and `.table`');
  }
}
// TableBuilder

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableBuilder" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// ------


TableBuilder.prototype.setSchema = function (schemaName) {
  this._schemaName = schemaName;
};

// Convert the current tableBuilder object "toSQL"
// giving us additional methods if we're altering
// rather than creating the table.
TableBuilder.prototype.toSQL = function () {
  if (this._method === 'alter') {
    (0, _extend3.default)(this, AlterMethods);
  }
  this._fn.call(this, this);
  return this.client.tableCompiler(this).toSQL();
};

(0, _each3.default)([

// Each of the index methods can be called individually, with the
// column name to be used, e.g. table.unique('column').
'index', 'primary', 'unique',

// Key specific
'dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign'], function (method) {
  TableBuilder.prototype[method] = function () {
    this._statements.push({
      grouping: 'alterTable',
      method: method,
      args: (0, _toArray3.default)(arguments)
    });
    return this;
  };
});

// Warn for dialect-specific table methods, since that's the
// only time these are supported.
var specialMethods = {
  mysql: ['engine', 'charset', 'collate'],
  postgresql: ['inherits']
};
(0, _each3.default)(specialMethods, function (methods, dialect) {
  (0, _each3.default)(methods, function (method) {
    TableBuilder.prototype[method] = function (value) {
      if (this.client.dialect !== dialect) {
        helpers.warn('Knex only supports ' + method + ' statement with ' + dialect + '.');
      }
      if (this._method === 'alter') {
        helpers.warn('Knex does not support altering the ' + method + ' outside of create ' + 'table, please use knex.raw statement.');
      }
      this._single[method] = value;
    };
  });
});

// Each of the column types that we can add, we create a new ColumnBuilder
// instance and push it onto the statements array.
var columnTypes = [

// Numeric
'tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'decimal', 'float', 'double', 'real', 'bit', 'boolean', 'serial',

// Date / Time
'date', 'datetime', 'timestamp', 'time', 'year',

// String
'char', 'varchar', 'tinytext', 'tinyText', 'text', 'mediumtext', 'mediumText', 'longtext', 'longText', 'binary', 'varbinary', 'tinyblob', 'tinyBlob', 'mediumblob', 'mediumBlob', 'blob', 'longblob', 'longBlob', 'enum', 'set',

// Increments, Aliases, and Additional
'bool', 'dateTime', 'increments', 'bigincrements', 'bigIncrements', 'integer', 'biginteger', 'bigInteger', 'string', 'json', 'jsonb', 'uuid', 'enu', 'specificType'];

// For each of the column methods, create a new "ColumnBuilder" interface,
// push it onto the "allStatements" stack, and then return the interface,
// with which we can add indexes, etc.
(0, _each3.default)(columnTypes, function (type) {
  TableBuilder.prototype[type] = function () {
    var args = (0, _toArray3.default)(arguments);
    var builder = this.client.columnBuilder(this, type, args);
    this._statements.push({
      grouping: 'columns',
      builder: builder
    });
    return builder;
  };
});

// The "timestamps" call is really just sets the `created_at` and `updated_at` columns.
TableBuilder.prototype.timestamps = function timestamps() {
  var method = arguments[0] === true ? 'timestamp' : 'datetime';
  var createdAt = this[method]('created_at');
  var updatedAt = this[method]('updated_at');
  if (arguments[1] === true) {
    var now = this.client.raw('CURRENT_TIMESTAMP');
    createdAt.notNullable().defaultTo(now);
    updatedAt.notNullable().defaultTo(now);
  }
  return;
};

// Set the comment value for a table, they're only allowed to be called
// once per table.
TableBuilder.prototype.comment = function (value) {
  this._single.comment = value;
};

// Set a foreign key on the table, calling
// `table.foreign('column_name').references('column').on('table').onDelete()...
// Also called from the ColumnBuilder context when chaining.
TableBuilder.prototype.foreign = function (column) {
  var foreignData = { column: column };
  this._statements.push({
    grouping: 'alterTable',
    method: 'foreign',
    args: [foreignData]
  });
  var returnObj = {
    references: function references(tableColumn) {
      var pieces = void 0;
      if ((0, _isString3.default)(tableColumn)) {
        pieces = tableColumn.split('.');
      }
      if (!pieces || pieces.length === 1) {
        foreignData.references = pieces ? pieces[0] : tableColumn;
        return {
          on: function on(tableName) {
            if (typeof tableName !== 'string') {
              throw new TypeError('Expected tableName to be a string, got: ' + (typeof tableName === 'undefined' ? 'undefined' : (0, _typeof3.default)(tableName)));
            }
            foreignData.inTable = tableName;
            return returnObj;
          },
          inTable: function inTable() {
            return this.on.apply(this, arguments);
          }
        };
      }
      foreignData.inTable = pieces[0];
      foreignData.references = pieces[1];
      return returnObj;
    },
    onUpdate: function onUpdate(statement) {
      foreignData.onUpdate = statement;
      return returnObj;
    },
    onDelete: function onDelete(statement) {
      foreignData.onDelete = statement;
      return returnObj;
    },
    _columnBuilder: function _columnBuilder(builder) {
      (0, _extend3.default)(builder, returnObj);
      returnObj = builder;
      return builder;
    }
  };
  return returnObj;
};

var AlterMethods = {

  // Renames the current column `from` the current
  // TODO: this.column(from).rename(to)
  renameColumn: function renameColumn(from, to) {
    this._statements.push({
      grouping: 'alterTable',
      method: 'renameColumn',
      args: [from, to]
    });
    return this;
  },
  dropTimestamps: function dropTimestamps() {
    return this.dropColumns(['created_at', 'updated_at']);
  }

  // TODO: changeType

};

// Drop a column from the current table.
// TODO: Enable this.column(columnName).drop();
AlterMethods.dropColumn = AlterMethods.dropColumns = function () {
  this._statements.push({
    grouping: 'alterTable',
    method: 'dropColumn',
    args: (0, _toArray3.default)(arguments)
  });
  return this;
};

exports.default = TableBuilder;
module.exports = exports['default'];
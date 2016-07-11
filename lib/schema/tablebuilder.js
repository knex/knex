
// TableBuilder

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableBuilder" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// ------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _lodash = require('lodash');

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

function TableBuilder(client, method, tableName, fn) {
  this.client = client;
  this._fn = fn;
  this._method = method;
  this._schemaName = undefined;
  this._tableName = tableName;
  this._statements = [];
  this._single = {};

  if (!_lodash.isFunction(this._fn)) {
    throw new TypeError('A callback function must be supplied to calls against `.createTable` ' + 'and `.table`');
  }
}

TableBuilder.prototype.setSchema = function (schemaName) {
  this._schemaName = schemaName;
};

// Convert the current tableBuilder object "toSQL"
// giving us additional methods if we're altering
// rather than creating the table.
TableBuilder.prototype.toSQL = function () {
  if (this._method === 'alter') {
    _lodash.extend(this, AlterMethods);
  }
  this._fn.call(this, this);
  return this.client.tableCompiler(this).toSQL();
};

_lodash.each([

// Each of the index methods can be called individually, with the
// column name to be used, e.g. table.unique('column').
'index', 'primary', 'unique',

// Key specific
'dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign'], function (method) {
  TableBuilder.prototype[method] = function () {
    this._statements.push({
      grouping: 'alterTable',
      method: method,
      args: _lodash.toArray(arguments)
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
_lodash.each(specialMethods, function (methods, dialect) {
  _lodash.each(methods, function (method) {
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
'bool', 'dateTime', 'increments', 'bigincrements', 'bigIncrements', 'integer', 'biginteger', 'bigInteger', 'string', 'timestamps', 'json', 'jsonb', 'uuid', 'enu', 'specificType'];

// For each of the column methods, create a new "ColumnBuilder" interface,
// push it onto the "allStatements" stack, and then return the interface,
// with which we can add indexes, etc.
_lodash.each(columnTypes, function (type) {
  TableBuilder.prototype[type] = function () {
    var args = _lodash.toArray(arguments);

    // The "timestamps" call is really a compound call to set the
    // `created_at` and `updated_at` columns.
    if (type === 'timestamps') {
      var col = args[0] === true ? 'timestamp' : 'datetime';
      var createdAt = this[col]('created_at');
      var updatedAt = this[col]('updated_at');
      if (args[1] === true) {
        var now = this.client.raw('CURRENT_TIMESTAMP');
        createdAt.notNullable().defaultTo(now);
        updatedAt.notNullable().defaultTo(now);
      }
      return;
    }
    var builder = this.client.columnBuilder(this, type, args);

    this._statements.push({
      grouping: 'columns',
      builder: builder
    });
    return builder;
  };
});

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
      var pieces = undefined;
      if (_lodash.isString(tableColumn)) {
        pieces = tableColumn.split('.');
      }
      if (!pieces || pieces.length === 1) {
        foreignData.references = pieces ? pieces[0] : tableColumn;
        return {
          on: function on(tableName) {
            if (typeof tableName !== 'string') {
              throw new TypeError('Expected tableName to be a string, got: ' + typeof tableName);
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
      _lodash.extend(builder, returnObj);
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
    args: _lodash.toArray(arguments)
  });
  return this;
};

exports['default'] = TableBuilder;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWEvdGFibGVidWlsZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztzQkFTNEQsUUFBUTs7dUJBQzNDLFlBQVk7O0lBQXpCLE9BQU87O0FBRW5CLFNBQVMsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRTtBQUNuRCxNQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtBQUNwQixNQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNkLE1BQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO0FBQzdCLE1BQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO0FBQzVCLE1BQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUVsQixNQUFHLENBQUMsbUJBQVcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3hCLFVBQU0sSUFBSSxTQUFTLENBQ2pCLHVFQUF1RSxHQUN2RSxjQUFjLENBQ2YsQ0FBQztHQUNIO0NBQ0Y7O0FBRUQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBUyxVQUFVLEVBQUU7QUFDdEQsTUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7Q0FDL0IsQ0FBQzs7Ozs7QUFLRixZQUFZLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxZQUFXO0FBQ3hDLE1BQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxPQUFPLEVBQUU7QUFDNUIsbUJBQU8sSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0dBQzVCO0FBQ0QsTUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzFCLFNBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENB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QUFFO0FBQ3RCLHFCQUFPLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzQixlQUFTLEdBQUcsT0FBTyxDQUFDO0FBQ3BCLGFBQU8sT0FBTyxDQUFDO0tBQ2hCO0dBQ0YsQ0FBQztBQUNGLFNBQU8sU0FBUyxDQUFDO0NBQ2xCLENBQUE7O0FBRUQsSUFBTSxZQUFZLEdBQUc7Ozs7QUFJbkIsY0FBWSxFQUFBLHNCQUFDLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDckIsUUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDcEIsY0FBUSxFQUFFLFlBQVk7QUFDdEIsWUFBTSxFQUFFLGNBQWM7QUFDdEIsVUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztLQUNqQixDQUFDLENBQUM7QUFDSCxXQUFPLElBQUksQ0FBQztHQUNiOztBQUVELGdCQUFjLEVBQUEsMEJBQUc7QUFDZixXQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztHQUN2RDs7O0NBR0YsQ0FBQzs7OztBQUlGLFlBQVksQ0FBQyxVQUFVLEdBQ3ZCLFlBQVksQ0FBQyxXQUFXLEdBQUcsWUFBVztBQUNwQyxNQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztBQUNwQixZQUFRLEVBQUUsWUFBWTtBQUN0QixVQUFNLEVBQUUsWUFBWTtBQUNwQixRQUFJLEVBQUUsZ0JBQVEsU0FBUyxDQUFDO0dBQ3pCLENBQUMsQ0FBQztBQUNILFNBQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7cUJBR2EsWUFBWSIsImZpbGUiOiJ0YWJsZWJ1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIFRhYmxlQnVpbGRlclxuXG4vLyBUYWtlcyB0aGUgZnVuY3Rpb24gcGFzc2VkIHRvIHRoZSBcImNyZWF0ZVRhYmxlXCIgb3IgXCJ0YWJsZS9lZGl0VGFibGVcIlxuLy8gZnVuY3Rpb25zIGFuZCBjYWxscyBpdCB3aXRoIHRoZSBcIlRhYmxlQnVpbGRlclwiIGFzIGJvdGggdGhlIGNvbnRleHQgYW5kXG4vLyB0aGUgZmlyc3QgYXJndW1lbnQuIEluc2lkZSB0aGlzIGZ1bmN0aW9uIHdlIGNhbiBzcGVjaWZ5IHdoYXQgaGFwcGVucyB0byB0aGVcbi8vIG1ldGhvZCwgcHVzaGluZyBldmVyeXRoaW5nIHdlIHdhbnQgdG8gZG8gb250byB0aGUgXCJhbGxTdGF0ZW1lbnRzXCIgYXJyYXksXG4vLyB3aGljaCBpcyB0aGVuIGNvbXBpbGVkIGludG8gc3FsLlxuLy8gLS0tLS0tXG5pbXBvcnQgeyBleHRlbmQsIGVhY2gsIHRvQXJyYXksIGlzU3RyaW5nLCBpc0Z1bmN0aW9uIH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi9oZWxwZXJzJztcblxuZnVuY3Rpb24gVGFibGVCdWlsZGVyKGNsaWVudCwgbWV0aG9kLCB0YWJsZU5hbWUsIGZuKSB7XG4gIHRoaXMuY2xpZW50ID0gY2xpZW50XG4gIHRoaXMuX2ZuID0gZm47XG4gIHRoaXMuX21ldGhvZCA9IG1ldGhvZDtcbiAgdGhpcy5fc2NoZW1hTmFtZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fdGFibGVOYW1lID0gdGFibGVOYW1lO1xuICB0aGlzLl9zdGF0ZW1lbnRzID0gW107XG4gIHRoaXMuX3NpbmdsZSA9IHt9O1xuXG4gIGlmKCFpc0Z1bmN0aW9uKHRoaXMuX2ZuKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnQSBjYWxsYmFjayBmdW5jdGlvbiBtdXN0IGJlIHN1cHBsaWVkIHRvIGNhbGxzIGFnYWluc3QgYC5jcmVhdGVUYWJsZWAgJyArXG4gICAgICAnYW5kIGAudGFibGVgJ1xuICAgICk7XG4gIH1cbn1cblxuVGFibGVCdWlsZGVyLnByb3RvdHlwZS5zZXRTY2hlbWEgPSBmdW5jdGlvbihzY2hlbWFOYW1lKSB7XG4gIHRoaXMuX3NjaGVtYU5hbWUgPSBzY2hlbWFOYW1lO1xufTtcblxuLy8gQ29udmVydCB0aGUgY3VycmVudCB0YWJsZUJ1aWxkZXIgb2JqZWN0IFwidG9TUUxcIlxuLy8gZ2l2aW5nIHVzIGFkZGl0aW9uYWwgbWV0aG9kcyBpZiB3ZSdyZSBhbHRlcmluZ1xuLy8gcmF0aGVyIHRoYW4gY3JlYXRpbmcgdGhlIHRhYmxlLlxuVGFibGVCdWlsZGVyLnByb3RvdHlwZS50b1NRTCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5fbWV0aG9kID09PSAnYWx0ZXInKSB7XG4gICAgZXh0ZW5kKHRoaXMsIEFsdGVyTWV0aG9kcyk7XG4gIH1cbiAgdGhpcy5fZm4uY2FsbCh0aGlzLCB0aGlzKTtcbiAgcmV0dXJuIHRoaXMuY2xpZW50LnRhYmxlQ29tcGlsZXIodGhpcykudG9TUUwoKTtcbn07XG5cbmVhY2goW1xuXG4gIC8vIEVhY2ggb2YgdGhlIGluZGV4IG1ldGhvZHMgY2FuIGJlIGNhbGxlZCBpbmRpdmlkdWFsbHksIHdpdGggdGhlXG4gIC8vIGNvbHVtbiBuYW1lIHRvIGJlIHVzZWQsIGUuZy4gdGFibGUudW5pcXVlKCdjb2x1bW4nKS5cbiAgJ2luZGV4JywgJ3ByaW1hcnknLCAndW5pcXVlJyxcblxuICAvLyBLZXkgc3BlY2lmaWNcbiAgJ2Ryb3BQcmltYXJ5JywgJ2Ryb3BVbmlxdWUnLCAnZHJvcEluZGV4JywgJ2Ryb3BGb3JlaWduJ1xuXG5dLCBmdW5jdGlvbihtZXRob2QpIHtcbiAgVGFibGVCdWlsZGVyLnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnYWx0ZXJUYWJsZScsXG4gICAgICBtZXRob2QsXG4gICAgICBhcmdzOiB0b0FycmF5KGFyZ3VtZW50cylcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbn0pO1xuXG4vLyBXYXJuIGZvciBkaWFsZWN0LXNwZWNpZmljIHRhYmxlIG1ldGhvZHMsIHNpbmNlIHRoYXQncyB0aGVcbi8vIG9ubHkgdGltZSB0aGVzZSBhcmUgc3VwcG9ydGVkLlxuY29uc3Qgc3BlY2lhbE1ldGhvZHMgPSB7XG4gIG15c3FsOiBbJ2VuZ2luZScsICdjaGFyc2V0JywgJ2NvbGxhdGUnXSxcbiAgcG9zdGdyZXNxbDogWydpbmhlcml0cyddXG59O1xuZWFjaChzcGVjaWFsTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kcywgZGlhbGVjdCkge1xuICBlYWNoKG1ldGhvZHMsIGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgIFRhYmxlQnVpbGRlci5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5jbGllbnQuZGlhbGVjdCAhPT0gZGlhbGVjdCkge1xuICAgICAgICBoZWxwZXJzLndhcm4oYEtuZXggb25seSBzdXBwb3J0cyAke21ldGhvZH0gc3RhdGVtZW50IHdpdGggJHtkaWFsZWN0fS5gKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9tZXRob2QgPT09ICdhbHRlcicpIHtcbiAgICAgICAgaGVscGVycy53YXJuKFxuICAgICAgICAgIGBLbmV4IGRvZXMgbm90IHN1cHBvcnQgYWx0ZXJpbmcgdGhlICR7bWV0aG9kfSBvdXRzaWRlIG9mIGNyZWF0ZSBgICtcbiAgICAgICAgICBgdGFibGUsIHBsZWFzZSB1c2Uga25leC5yYXcgc3RhdGVtZW50LmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NpbmdsZVttZXRob2RdID0gdmFsdWU7XG4gICAgfTtcbiAgfSk7XG59KTtcblxuLy8gRWFjaCBvZiB0aGUgY29sdW1uIHR5cGVzIHRoYXQgd2UgY2FuIGFkZCwgd2UgY3JlYXRlIGEgbmV3IENvbHVtbkJ1aWxkZXJcbi8vIGluc3RhbmNlIGFuZCBwdXNoIGl0IG9udG8gdGhlIHN0YXRlbWVudHMgYXJyYXkuXG5jb25zdCBjb2x1bW5UeXBlcyA9IFtcblxuICAvLyBOdW1lcmljXG4gICd0aW55aW50JyxcbiAgJ3NtYWxsaW50JyxcbiAgJ21lZGl1bWludCcsXG4gICdpbnQnLFxuICAnYmlnaW50JyxcbiAgJ2RlY2ltYWwnLFxuICAnZmxvYXQnLFxuICAnZG91YmxlJyxcbiAgJ3JlYWwnLFxuICAnYml0JyxcbiAgJ2Jvb2xlYW4nLFxuICAnc2VyaWFsJyxcblxuICAvLyBEYXRlIC8gVGltZVxuICAnZGF0ZScsXG4gICdkYXRldGltZScsXG4gICd0aW1lc3RhbXAnLFxuICAndGltZScsXG4gICd5ZWFyJyxcblxuICAvLyBTdHJpbmdcbiAgJ2NoYXInLFxuICAndmFyY2hhcicsXG4gICd0aW55dGV4dCcsXG4gICd0aW55VGV4dCcsXG4gICd0ZXh0JyxcbiAgJ21lZGl1bXRleHQnLFxuICAnbWVkaXVtVGV4dCcsXG4gICdsb25ndGV4dCcsXG4gICdsb25nVGV4dCcsXG4gICdiaW5hcnknLFxuICAndmFyYmluYXJ5JyxcbiAgJ3RpbnlibG9iJyxcbiAgJ3RpbnlCbG9iJyxcbiAgJ21lZGl1bWJsb2InLFxuICAnbWVkaXVtQmxvYicsXG4gICdibG9iJyxcbiAgJ2xvbmdibG9iJyxcbiAgJ2xvbmdCbG9iJyxcbiAgJ2VudW0nLFxuICAnc2V0JyxcblxuICAvLyBJbmNyZW1lbnRzLCBBbGlhc2VzLCBhbmQgQWRkaXRpb25hbFxuICAnYm9vbCcsXG4gICdkYXRlVGltZScsXG4gICdpbmNyZW1lbnRzJyxcbiAgJ2JpZ2luY3JlbWVudHMnLFxuICAnYmlnSW5jcmVtZW50cycsXG4gICdpbnRlZ2VyJyxcbiAgJ2JpZ2ludGVnZXInLFxuICAnYmlnSW50ZWdlcicsXG4gICdzdHJpbmcnLFxuICAndGltZXN0YW1wcycsXG4gICdqc29uJyxcbiAgJ2pzb25iJyxcbiAgJ3V1aWQnLFxuICAnZW51JyxcbiAgJ3NwZWNpZmljVHlwZSdcbl07XG5cbi8vIEZvciBlYWNoIG9mIHRoZSBjb2x1bW4gbWV0aG9kcywgY3JlYXRlIGEgbmV3IFwiQ29sdW1uQnVpbGRlclwiIGludGVyZmFjZSxcbi8vIHB1c2ggaXQgb250byB0aGUgXCJhbGxTdGF0ZW1lbnRzXCIgc3RhY2ssIGFuZCB0aGVuIHJldHVybiB0aGUgaW50ZXJmYWNlLFxuLy8gd2l0aCB3aGljaCB3ZSBjYW4gYWRkIGluZGV4ZXMsIGV0Yy5cbmVhY2goY29sdW1uVHlwZXMsIGZ1bmN0aW9uKHR5cGUpIHtcbiAgVGFibGVCdWlsZGVyLnByb3RvdHlwZVt0eXBlXSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XG5cbiAgICAvLyBUaGUgXCJ0aW1lc3RhbXBzXCIgY2FsbCBpcyByZWFsbHkgYSBjb21wb3VuZCBjYWxsIHRvIHNldCB0aGVcbiAgICAvLyBgY3JlYXRlZF9hdGAgYW5kIGB1cGRhdGVkX2F0YCBjb2x1bW5zLlxuICAgIGlmICh0eXBlID09PSAndGltZXN0YW1wcycpIHtcbiAgICAgIGNvbnN0IGNvbCA9IChhcmdzWzBdID09PSB0cnVlKSA/ICd0aW1lc3RhbXAnIDogJ2RhdGV0aW1lJztcbiAgICAgIGNvbnN0IGNyZWF0ZWRBdCA9IHRoaXNbY29sXSgnY3JlYXRlZF9hdCcpO1xuICAgICAgY29uc3QgdXBkYXRlZEF0ID0gdGhpc1tjb2xdKCd1cGRhdGVkX2F0Jyk7XG4gICAgICBpZiAoYXJnc1sxXSA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBub3cgPSB0aGlzLmNsaWVudC5yYXcoJ0NVUlJFTlRfVElNRVNUQU1QJyk7XG4gICAgICAgIGNyZWF0ZWRBdC5ub3ROdWxsYWJsZSgpLmRlZmF1bHRUbyhub3cpO1xuICAgICAgICB1cGRhdGVkQXQubm90TnVsbGFibGUoKS5kZWZhdWx0VG8obm93KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYnVpbGRlciA9IHRoaXMuY2xpZW50LmNvbHVtbkJ1aWxkZXIodGhpcywgdHlwZSwgYXJncyk7XG5cbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdjb2x1bW5zJyxcbiAgICAgIGJ1aWxkZXJcbiAgICB9KTtcbiAgICByZXR1cm4gYnVpbGRlcjtcbiAgfTtcblxufSk7XG5cbi8vIFNldCB0aGUgY29tbWVudCB2YWx1ZSBmb3IgYSB0YWJsZSwgdGhleSdyZSBvbmx5IGFsbG93ZWQgdG8gYmUgY2FsbGVkXG4vLyBvbmNlIHBlciB0YWJsZS5cblRhYmxlQnVpbGRlci5wcm90b3R5cGUuY29tbWVudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHRoaXMuX3NpbmdsZS5jb21tZW50ID0gdmFsdWU7XG59O1xuXG4vLyBTZXQgYSBmb3JlaWduIGtleSBvbiB0aGUgdGFibGUsIGNhbGxpbmdcbi8vIGB0YWJsZS5mb3JlaWduKCdjb2x1bW5fbmFtZScpLnJlZmVyZW5jZXMoJ2NvbHVtbicpLm9uKCd0YWJsZScpLm9uRGVsZXRlKCkuLi5cbi8vIEFsc28gY2FsbGVkIGZyb20gdGhlIENvbHVtbkJ1aWxkZXIgY29udGV4dCB3aGVuIGNoYWluaW5nLlxuVGFibGVCdWlsZGVyLnByb3RvdHlwZS5mb3JlaWduID0gZnVuY3Rpb24oY29sdW1uKSB7XG4gIGNvbnN0IGZvcmVpZ25EYXRhID0ge2NvbHVtbn07XG4gIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgZ3JvdXBpbmc6ICdhbHRlclRhYmxlJyxcbiAgICBtZXRob2Q6ICdmb3JlaWduJyxcbiAgICBhcmdzOiBbZm9yZWlnbkRhdGFdXG4gIH0pO1xuICBsZXQgcmV0dXJuT2JqID0ge1xuICAgIHJlZmVyZW5jZXModGFibGVDb2x1bW4pIHtcbiAgICAgIGxldCBwaWVjZXM7XG4gICAgICBpZiAoaXNTdHJpbmcodGFibGVDb2x1bW4pKSB7XG4gICAgICAgIHBpZWNlcyA9IHRhYmxlQ29sdW1uLnNwbGl0KCcuJyk7XG4gICAgICB9XG4gICAgICBpZiAoIXBpZWNlcyB8fCBwaWVjZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGZvcmVpZ25EYXRhLnJlZmVyZW5jZXMgPSBwaWVjZXMgPyBwaWVjZXNbMF0gOiB0YWJsZUNvbHVtbjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvbih0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGFibGVOYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBFeHBlY3RlZCB0YWJsZU5hbWUgdG8gYmUgYSBzdHJpbmcsIGdvdDogJHt0eXBlb2YgdGFibGVOYW1lfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yZWlnbkRhdGEuaW5UYWJsZSA9IHRhYmxlTmFtZTtcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5PYmo7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpblRhYmxlKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBmb3JlaWduRGF0YS5pblRhYmxlID0gcGllY2VzWzBdO1xuICAgICAgZm9yZWlnbkRhdGEucmVmZXJlbmNlcyA9IHBpZWNlc1sxXTtcbiAgICAgIHJldHVybiByZXR1cm5PYmo7XG4gICAgfSxcbiAgICBvblVwZGF0ZShzdGF0ZW1lbnQpIHtcbiAgICAgIGZvcmVpZ25EYXRhLm9uVXBkYXRlID0gc3RhdGVtZW50O1xuICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICB9LFxuICAgIG9uRGVsZXRlKHN0YXRlbWVudCkge1xuICAgICAgZm9yZWlnbkRhdGEub25EZWxldGUgPSBzdGF0ZW1lbnQ7XG4gICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgIH0sXG4gICAgX2NvbHVtbkJ1aWxkZXIoYnVpbGRlcikge1xuICAgICAgZXh0ZW5kKGJ1aWxkZXIsIHJldHVybk9iaik7XG4gICAgICByZXR1cm5PYmogPSBidWlsZGVyO1xuICAgICAgcmV0dXJuIGJ1aWxkZXI7XG4gICAgfVxuICB9O1xuICByZXR1cm4gcmV0dXJuT2JqO1xufVxuXG5jb25zdCBBbHRlck1ldGhvZHMgPSB7XG5cbiAgLy8gUmVuYW1lcyB0aGUgY3VycmVudCBjb2x1bW4gYGZyb21gIHRoZSBjdXJyZW50XG4gIC8vIFRPRE86IHRoaXMuY29sdW1uKGZyb20pLnJlbmFtZSh0bylcbiAgcmVuYW1lQ29sdW1uKGZyb20sIHRvKSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnYWx0ZXJUYWJsZScsXG4gICAgICBtZXRob2Q6ICdyZW5hbWVDb2x1bW4nLFxuICAgICAgYXJnczogW2Zyb20sIHRvXVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRyb3BUaW1lc3RhbXBzKCkge1xuICAgIHJldHVybiB0aGlzLmRyb3BDb2x1bW5zKFsnY3JlYXRlZF9hdCcsICd1cGRhdGVkX2F0J10pO1xuICB9XG5cbiAgLy8gVE9ETzogY2hhbmdlVHlwZVxufTtcblxuLy8gRHJvcCBhIGNvbHVtbiBmcm9tIHRoZSBjdXJyZW50IHRhYmxlLlxuLy8gVE9ETzogRW5hYmxlIHRoaXMuY29sdW1uKGNvbHVtbk5hbWUpLmRyb3AoKTtcbkFsdGVyTWV0aG9kcy5kcm9wQ29sdW1uID1cbkFsdGVyTWV0aG9kcy5kcm9wQ29sdW1ucyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgIGdyb3VwaW5nOiAnYWx0ZXJUYWJsZScsXG4gICAgbWV0aG9kOiAnZHJvcENvbHVtbicsXG4gICAgYXJnczogdG9BcnJheShhcmd1bWVudHMpXG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn07XG5cblxuZXhwb3J0IGRlZmF1bHQgVGFibGVCdWlsZGVyO1xuIl19
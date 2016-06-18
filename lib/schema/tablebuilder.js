
// TableBuilder

// Takes the function passed to the "createTable" or "table/editTable"
// functions and calls it with the "TableBuilder" as both the context and
// the first argument. Inside this function we can specify what happens to the
// method, pushing everything we want to do onto the "allStatements" array,
// which is then compiled into sql.
// ------
'use strict';

var _ = require('lodash');
var helpers = require('../helpers');

function TableBuilder(client, method, tableName, fn) {
  this.client = client;
  this._fn = fn;
  this._method = method;
  this._schemaName = undefined;
  this._tableName = tableName;
  this._statements = [];
  this._single = {};
}

TableBuilder.prototype.setSchema = function (schemaName) {
  this._schemaName = schemaName;
};

// Convert the current tableBuilder object "toSQL"
// giving us additional methods if we're altering
// rather than creating the table.
TableBuilder.prototype.toSQL = function () {
  if (this._method === 'alter') {
    _.extend(this, AlterMethods);
  }
  this._fn.call(this, this);
  return this.client.tableCompiler(this).toSQL();
};

_.each([

// Each of the index methods can be called individually, with the
// column name to be used, e.g. table.unique('column').
'index', 'primary', 'unique',

// Key specific
'dropPrimary', 'dropUnique', 'dropIndex', 'dropForeign'], function (method) {
  TableBuilder.prototype[method] = function () {
    this._statements.push({
      grouping: 'alterTable',
      method: method,
      args: _.toArray(arguments)
    });
    return this;
  };
});

// Warn if we're not in MySQL, since that's the only time these
// three are supported.
var specialMethods = ['engine', 'charset', 'collate'];
_.each(specialMethods, function (method) {
  TableBuilder.prototype[method] = function (value) {
    if (false) {
      helpers.warn('Knex only supports ' + method + ' statement with mysql.');
    }if (this._method === 'alter') {
      helpers.warn('Knex does not support altering the ' + method + ' outside of the create table, please use knex.raw statement.');
    }
    this._single[method] = value;
  };
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
_.each(columnTypes, function (type) {
  TableBuilder.prototype[type] = function () {
    var args = _.toArray(arguments);

    // The "timestamps" call is really a compound call to set the
    // `created_at` and `updated_at` columns.
    if (type === 'timestamps') {
      if (args[0] === true) {
        this.timestamp('created_at');
        this.timestamp('updated_at');
      } else {
        this.datetime('created_at');
        this.datetime('updated_at');
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
      var pieces;
      if (_.isString(tableColumn)) {
        pieces = tableColumn.split('.');
      }
      if (!pieces || pieces.length === 1) {
        foreignData.references = pieces ? pieces[0] : tableColumn;
        return {
          on: function on(tableName) {
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
      _.extend(builder, returnObj);
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
    args: _.toArray(arguments)
  });
  return this;
};

module.exports = TableBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWEvdGFibGVidWlsZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBU0EsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQzs7QUFFcEMsU0FBUyxZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFO0FBQ25ELE1BQUksQ0FBQyxNQUFNLEdBQVEsTUFBTSxDQUFBO0FBQ3pCLE1BQUksQ0FBQyxHQUFHLEdBQVcsRUFBRSxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxPQUFPLEdBQU8sTUFBTSxDQUFDO0FBQzFCLE1BQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO0FBQzdCLE1BQUksQ0FBQyxVQUFVLEdBQUksU0FBUyxDQUFDO0FBQzdCLE1BQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxPQUFPLEdBQU8sRUFBRSxDQUFDO0NBQ3ZCOztBQUVELFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFVBQVMsVUFBVSxFQUFFO0FBQ3RELE1BQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0NBQy9CLENBQUM7Ozs7O0FBS0YsWUFBWSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsWUFBVztBQUN4QyxNQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO0FBQzVCLEtBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO0dBQzlCO0FBQ0QsTUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzFCLFNBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Q0FDaEQsQ0FBQzs7QUFFRixDQUFDLENB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QUFjLEVBQUUsMEJBQVc7QUFDekIsV0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7R0FDdkQ7OztDQUdGLENBQUM7Ozs7QUFJRixZQUFZLENBQUMsVUFBVSxHQUN2QixZQUFZLENBQUMsV0FBVyxHQUFHLFlBQVc7QUFDcEMsTUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDcEIsWUFBUSxFQUFFLFlBQVk7QUFDdEIsVUFBTSxFQUFFLFlBQVk7QUFDcEIsUUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0dBQzNCLENBQUMsQ0FBQztBQUNILFNBQU8sSUFBSSxDQUFDO0NBQ2IsQ0FBQzs7QUFHRixNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyIsImZpbGUiOiJ0YWJsZWJ1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIFRhYmxlQnVpbGRlclxuXG4vLyBUYWtlcyB0aGUgZnVuY3Rpb24gcGFzc2VkIHRvIHRoZSBcImNyZWF0ZVRhYmxlXCIgb3IgXCJ0YWJsZS9lZGl0VGFibGVcIlxuLy8gZnVuY3Rpb25zIGFuZCBjYWxscyBpdCB3aXRoIHRoZSBcIlRhYmxlQnVpbGRlclwiIGFzIGJvdGggdGhlIGNvbnRleHQgYW5kXG4vLyB0aGUgZmlyc3QgYXJndW1lbnQuIEluc2lkZSB0aGlzIGZ1bmN0aW9uIHdlIGNhbiBzcGVjaWZ5IHdoYXQgaGFwcGVucyB0byB0aGVcbi8vIG1ldGhvZCwgcHVzaGluZyBldmVyeXRoaW5nIHdlIHdhbnQgdG8gZG8gb250byB0aGUgXCJhbGxTdGF0ZW1lbnRzXCIgYXJyYXksXG4vLyB3aGljaCBpcyB0aGVuIGNvbXBpbGVkIGludG8gc3FsLlxuLy8gLS0tLS0tXG52YXIgXyA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xudmFyIGhlbHBlcnMgPSByZXF1aXJlKCcuLi9oZWxwZXJzJyk7XG5cbmZ1bmN0aW9uIFRhYmxlQnVpbGRlcihjbGllbnQsIG1ldGhvZCwgdGFibGVOYW1lLCBmbikge1xuICB0aGlzLmNsaWVudCAgICAgID0gY2xpZW50XG4gIHRoaXMuX2ZuICAgICAgICAgPSBmbjtcbiAgdGhpcy5fbWV0aG9kICAgICA9IG1ldGhvZDtcbiAgdGhpcy5fc2NoZW1hTmFtZSA9IHVuZGVmaW5lZDtcbiAgdGhpcy5fdGFibGVOYW1lICA9IHRhYmxlTmFtZTtcbiAgdGhpcy5fc3RhdGVtZW50cyA9IFtdO1xuICB0aGlzLl9zaW5nbGUgICAgID0ge307XG59XG5cblRhYmxlQnVpbGRlci5wcm90b3R5cGUuc2V0U2NoZW1hID0gZnVuY3Rpb24oc2NoZW1hTmFtZSkge1xuICB0aGlzLl9zY2hlbWFOYW1lID0gc2NoZW1hTmFtZTtcbn07XG5cbi8vIENvbnZlcnQgdGhlIGN1cnJlbnQgdGFibGVCdWlsZGVyIG9iamVjdCBcInRvU1FMXCJcbi8vIGdpdmluZyB1cyBhZGRpdGlvbmFsIG1ldGhvZHMgaWYgd2UncmUgYWx0ZXJpbmdcbi8vIHJhdGhlciB0aGFuIGNyZWF0aW5nIHRoZSB0YWJsZS5cblRhYmxlQnVpbGRlci5wcm90b3R5cGUudG9TUUwgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuX21ldGhvZCA9PT0gJ2FsdGVyJykge1xuICAgIF8uZXh0ZW5kKHRoaXMsIEFsdGVyTWV0aG9kcyk7XG4gIH1cbiAgdGhpcy5fZm4uY2FsbCh0aGlzLCB0aGlzKTtcbiAgcmV0dXJuIHRoaXMuY2xpZW50LnRhYmxlQ29tcGlsZXIodGhpcykudG9TUUwoKTtcbn07XG5cbl8uZWFjaChbXG5cbiAgLy8gRWFjaCBvZiB0aGUgaW5kZXggbWV0aG9kcyBjYW4gYmUgY2FsbGVkIGluZGl2aWR1YWxseSwgd2l0aCB0aGVcbiAgLy8gY29sdW1uIG5hbWUgdG8gYmUgdXNlZCwgZS5nLiB0YWJsZS51bmlxdWUoJ2NvbHVtbicpLlxuICAnaW5kZXgnLCAncHJpbWFyeScsICd1bmlxdWUnLFxuXG4gIC8vIEtleSBzcGVjaWZpY1xuICAnZHJvcFByaW1hcnknLCAnZHJvcFVuaXF1ZScsICdkcm9wSW5kZXgnLCAnZHJvcEZvcmVpZ24nXG5cbl0sIGZ1bmN0aW9uKG1ldGhvZCkge1xuICBUYWJsZUJ1aWxkZXIucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9zdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgZ3JvdXBpbmc6ICdhbHRlclRhYmxlJyxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgYXJnczogXy50b0FycmF5KGFyZ3VtZW50cylcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbn0pO1xuXG4vLyBXYXJuIGlmIHdlJ3JlIG5vdCBpbiBNeVNRTCwgc2luY2UgdGhhdCdzIHRoZSBvbmx5IHRpbWUgdGhlc2Vcbi8vIHRocmVlIGFyZSBzdXBwb3J0ZWQuXG52YXIgc3BlY2lhbE1ldGhvZHMgPSBbJ2VuZ2luZScsICdjaGFyc2V0JywgJ2NvbGxhdGUnXTtcbl8uZWFjaChzcGVjaWFsTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kKSB7XG4gIFRhYmxlQnVpbGRlci5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgaWYgKGZhbHNlKSB7XG4gICAgICBoZWxwZXJzLndhcm4oJ0tuZXggb25seSBzdXBwb3J0cyAnICsgbWV0aG9kICsgJyBzdGF0ZW1lbnQgd2l0aCBteXNxbC4nKTtcbiAgICB9IGlmICh0aGlzLl9tZXRob2QgPT09ICdhbHRlcicpIHtcbiAgICAgIGhlbHBlcnMud2FybignS25leCBkb2VzIG5vdCBzdXBwb3J0IGFsdGVyaW5nIHRoZSAnICsgbWV0aG9kICsgJyBvdXRzaWRlIG9mIHRoZSBjcmVhdGUgdGFibGUsIHBsZWFzZSB1c2Uga25leC5yYXcgc3RhdGVtZW50LicpO1xuICAgIH1cbiAgICB0aGlzLl9zaW5nbGVbbWV0aG9kXSA9IHZhbHVlO1xuICB9O1xufSk7XG5cbi8vIEVhY2ggb2YgdGhlIGNvbHVtbiB0eXBlcyB0aGF0IHdlIGNhbiBhZGQsIHdlIGNyZWF0ZSBhIG5ldyBDb2x1bW5CdWlsZGVyXG4vLyBpbnN0YW5jZSBhbmQgcHVzaCBpdCBvbnRvIHRoZSBzdGF0ZW1lbnRzIGFycmF5LlxudmFyIGNvbHVtblR5cGVzID0gW1xuXG4gIC8vIE51bWVyaWNcbiAgJ3RpbnlpbnQnLFxuICAnc21hbGxpbnQnLFxuICAnbWVkaXVtaW50JyxcbiAgJ2ludCcsXG4gICdiaWdpbnQnLFxuICAnZGVjaW1hbCcsXG4gICdmbG9hdCcsXG4gICdkb3VibGUnLFxuICAncmVhbCcsXG4gICdiaXQnLFxuICAnYm9vbGVhbicsXG4gICdzZXJpYWwnLFxuXG4gIC8vIERhdGUgLyBUaW1lXG4gICdkYXRlJyxcbiAgJ2RhdGV0aW1lJyxcbiAgJ3RpbWVzdGFtcCcsXG4gICd0aW1lJyxcbiAgJ3llYXInLFxuXG4gIC8vIFN0cmluZ1xuICAnY2hhcicsXG4gICd2YXJjaGFyJyxcbiAgJ3Rpbnl0ZXh0JyxcbiAgJ3RpbnlUZXh0JyxcbiAgJ3RleHQnLFxuICAnbWVkaXVtdGV4dCcsXG4gICdtZWRpdW1UZXh0JyxcbiAgJ2xvbmd0ZXh0JyxcbiAgJ2xvbmdUZXh0JyxcbiAgJ2JpbmFyeScsXG4gICd2YXJiaW5hcnknLFxuICAndGlueWJsb2InLFxuICAndGlueUJsb2InLFxuICAnbWVkaXVtYmxvYicsXG4gICdtZWRpdW1CbG9iJyxcbiAgJ2Jsb2InLFxuICAnbG9uZ2Jsb2InLFxuICAnbG9uZ0Jsb2InLFxuICAnZW51bScsXG4gICdzZXQnLFxuXG4gIC8vIEluY3JlbWVudHMsIEFsaWFzZXMsIGFuZCBBZGRpdGlvbmFsXG4gICdib29sJyxcbiAgJ2RhdGVUaW1lJyxcbiAgJ2luY3JlbWVudHMnLFxuICAnYmlnaW5jcmVtZW50cycsXG4gICdiaWdJbmNyZW1lbnRzJyxcbiAgJ2ludGVnZXInLFxuICAnYmlnaW50ZWdlcicsXG4gICdiaWdJbnRlZ2VyJyxcbiAgJ3N0cmluZycsXG4gICd0aW1lc3RhbXBzJyxcbiAgJ2pzb24nLFxuICAnanNvbmInLFxuICAndXVpZCcsXG4gICdlbnUnLFxuICAnc3BlY2lmaWNUeXBlJ1xuXTtcblxuLy8gRm9yIGVhY2ggb2YgdGhlIGNvbHVtbiBtZXRob2RzLCBjcmVhdGUgYSBuZXcgXCJDb2x1bW5CdWlsZGVyXCIgaW50ZXJmYWNlLFxuLy8gcHVzaCBpdCBvbnRvIHRoZSBcImFsbFN0YXRlbWVudHNcIiBzdGFjaywgYW5kIHRoZW4gcmV0dXJuIHRoZSBpbnRlcmZhY2UsXG4vLyB3aXRoIHdoaWNoIHdlIGNhbiBhZGQgaW5kZXhlcywgZXRjLlxuXy5lYWNoKGNvbHVtblR5cGVzLCBmdW5jdGlvbih0eXBlKSB7XG4gIFRhYmxlQnVpbGRlci5wcm90b3R5cGVbdHlwZV0gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgYXJncyA9IF8udG9BcnJheShhcmd1bWVudHMpO1xuXG4gICAgLy8gVGhlIFwidGltZXN0YW1wc1wiIGNhbGwgaXMgcmVhbGx5IGEgY29tcG91bmQgY2FsbCB0byBzZXQgdGhlXG4gICAgLy8gYGNyZWF0ZWRfYXRgIGFuZCBgdXBkYXRlZF9hdGAgY29sdW1ucy5cbiAgICBpZiAodHlwZSA9PT0gJ3RpbWVzdGFtcHMnKSB7XG4gICAgICBpZiAoYXJnc1swXSA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnRpbWVzdGFtcCgnY3JlYXRlZF9hdCcpO1xuICAgICAgICB0aGlzLnRpbWVzdGFtcCgndXBkYXRlZF9hdCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kYXRldGltZSgnY3JlYXRlZF9hdCcpO1xuICAgICAgICB0aGlzLmRhdGV0aW1lKCd1cGRhdGVkX2F0Jyk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBidWlsZGVyICAgICAgID0gdGhpcy5jbGllbnQuY29sdW1uQnVpbGRlcih0aGlzLCB0eXBlLCBhcmdzKTtcblxuICAgIHRoaXMuX3N0YXRlbWVudHMucHVzaCh7XG4gICAgICBncm91cGluZzogJ2NvbHVtbnMnLFxuICAgICAgYnVpbGRlcjogYnVpbGRlclxuICAgIH0pO1xuICAgIHJldHVybiBidWlsZGVyO1xuICB9O1xuXG59KTtcblxuLy8gU2V0IHRoZSBjb21tZW50IHZhbHVlIGZvciBhIHRhYmxlLCB0aGV5J3JlIG9ubHkgYWxsb3dlZCB0byBiZSBjYWxsZWRcbi8vIG9uY2UgcGVyIHRhYmxlLlxuVGFibGVCdWlsZGVyLnByb3RvdHlwZS5jb21tZW50ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdGhpcy5fc2luZ2xlLmNvbW1lbnQgPSB2YWx1ZTtcbn07XG5cbi8vIFNldCBhIGZvcmVpZ24ga2V5IG9uIHRoZSB0YWJsZSwgY2FsbGluZ1xuLy8gYHRhYmxlLmZvcmVpZ24oJ2NvbHVtbl9uYW1lJykucmVmZXJlbmNlcygnY29sdW1uJykub24oJ3RhYmxlJykub25EZWxldGUoKS4uLlxuLy8gQWxzbyBjYWxsZWQgZnJvbSB0aGUgQ29sdW1uQnVpbGRlciBjb250ZXh0IHdoZW4gY2hhaW5pbmcuXG5UYWJsZUJ1aWxkZXIucHJvdG90eXBlLmZvcmVpZ24gPSBmdW5jdGlvbihjb2x1bW4pIHtcbiAgdmFyIGZvcmVpZ25EYXRhID0ge2NvbHVtbjogY29sdW1ufTtcbiAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICBncm91cGluZzogJ2FsdGVyVGFibGUnLFxuICAgIG1ldGhvZDogJ2ZvcmVpZ24nLFxuICAgIGFyZ3M6IFtmb3JlaWduRGF0YV1cbiAgfSk7XG4gIHZhciByZXR1cm5PYmogPSB7XG4gICAgcmVmZXJlbmNlczogZnVuY3Rpb24odGFibGVDb2x1bW4pIHtcbiAgICAgIHZhciBwaWVjZXM7XG4gICAgICBpZiAoXy5pc1N0cmluZyh0YWJsZUNvbHVtbikpIHtcbiAgICAgICAgcGllY2VzID0gdGFibGVDb2x1bW4uc3BsaXQoJy4nKTtcbiAgICAgIH1cbiAgICAgIGlmICghcGllY2VzIHx8IHBpZWNlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgZm9yZWlnbkRhdGEucmVmZXJlbmNlcyA9IHBpZWNlcyA/IHBpZWNlc1swXSA6IHRhYmxlQ29sdW1uO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG9uOiBmdW5jdGlvbih0YWJsZU5hbWUpIHtcbiAgICAgICAgICAgIGZvcmVpZ25EYXRhLmluVGFibGUgPSB0YWJsZU5hbWU7XG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5UYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGZvcmVpZ25EYXRhLmluVGFibGUgPSBwaWVjZXNbMF07XG4gICAgICBmb3JlaWduRGF0YS5yZWZlcmVuY2VzID0gcGllY2VzWzFdO1xuICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICB9LFxuICAgIG9uVXBkYXRlOiBmdW5jdGlvbihzdGF0ZW1lbnQpIHtcbiAgICAgIGZvcmVpZ25EYXRhLm9uVXBkYXRlID0gc3RhdGVtZW50O1xuICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICB9LFxuICAgIG9uRGVsZXRlOiBmdW5jdGlvbihzdGF0ZW1lbnQpIHtcbiAgICAgIGZvcmVpZ25EYXRhLm9uRGVsZXRlID0gc3RhdGVtZW50O1xuICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICB9LFxuICAgIF9jb2x1bW5CdWlsZGVyOiBmdW5jdGlvbihidWlsZGVyKSB7XG4gICAgICBfLmV4dGVuZChidWlsZGVyLCByZXR1cm5PYmopO1xuICAgICAgcmV0dXJuT2JqID0gYnVpbGRlcjtcbiAgICAgIHJldHVybiBidWlsZGVyO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHJldHVybk9iajtcbn1cblxudmFyIEFsdGVyTWV0aG9kcyA9IHtcblxuICAvLyBSZW5hbWVzIHRoZSBjdXJyZW50IGNvbHVtbiBgZnJvbWAgdGhlIGN1cnJlbnRcbiAgLy8gVE9ETzogdGhpcy5jb2x1bW4oZnJvbSkucmVuYW1lKHRvKVxuICByZW5hbWVDb2x1bW46IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgIGdyb3VwaW5nOiAnYWx0ZXJUYWJsZScsXG4gICAgICBtZXRob2Q6ICdyZW5hbWVDb2x1bW4nLFxuICAgICAgYXJnczogW2Zyb20sIHRvXVxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRyb3BUaW1lc3RhbXBzOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5kcm9wQ29sdW1ucyhbJ2NyZWF0ZWRfYXQnLCAndXBkYXRlZF9hdCddKTtcbiAgfVxuXG4gIC8vIFRPRE86IGNoYW5nZVR5cGVcbn07XG5cbi8vIERyb3AgYSBjb2x1bW4gZnJvbSB0aGUgY3VycmVudCB0YWJsZS5cbi8vIFRPRE86IEVuYWJsZSB0aGlzLmNvbHVtbihjb2x1bW5OYW1lKS5kcm9wKCk7XG5BbHRlck1ldGhvZHMuZHJvcENvbHVtbiA9XG5BbHRlck1ldGhvZHMuZHJvcENvbHVtbnMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fc3RhdGVtZW50cy5wdXNoKHtcbiAgICBncm91cGluZzogJ2FsdGVyVGFibGUnLFxuICAgIG1ldGhvZDogJ2Ryb3BDb2x1bW4nLFxuICAgIGFyZ3M6IF8udG9BcnJheShhcmd1bWVudHMpXG4gIH0pO1xuICByZXR1cm4gdGhpcztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBUYWJsZUJ1aWxkZXI7XG4iXX0=
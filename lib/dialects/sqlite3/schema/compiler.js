
// SQLite3: Column Builder & Compiler
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _schemaCompiler = require('../../../schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _lodash = require('lodash');

// Schema Compiler
// -------

function SchemaCompiler_SQLite3() {
  _schemaCompiler2['default'].apply(this, arguments);
}
_inherits2['default'](SchemaCompiler_SQLite3, _schemaCompiler2['default']);

// Compile the query to determine if a table exists.
SchemaCompiler_SQLite3.prototype.hasTable = function (tableName) {
  var sql = 'select * from sqlite_master ' + ('where type = \'table\' and name = ' + this.formatter.parameter(tableName));
  this.pushQuery({ sql: sql, output: function output(resp) {
      return resp.length > 0;
    } });
};

// Compile the query to determine if a column exists.
SchemaCompiler_SQLite3.prototype.hasColumn = function (tableName, column) {
  this.pushQuery({
    sql: 'PRAGMA table_info(' + this.formatter.wrap(tableName) + ')',
    output: function output(resp) {
      return _lodash.some(resp, { name: column });
    }
  });
};

// Compile a rename table command.
SchemaCompiler_SQLite3.prototype.renameTable = function (from, to) {
  this.pushQuery('alter table ' + this.formatter.wrap(from) + ' rename to ' + this.formatter.wrap(to));
};

exports['default'] = SchemaCompiler_SQLite3;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9zcWxpdGUzL3NjaGVtYS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7OEJBQ0osMEJBQTBCOzs7O3NCQUVoQyxRQUFROzs7OztBQUs3QixTQUFTLHNCQUFzQixHQUFHO0FBQ2hDLDhCQUFlLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDdkM7QUFDRCxzQkFBUyxzQkFBc0IsOEJBQWlCLENBQUM7OztBQUdqRCxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsUUFBUSxHQUFHLFVBQVMsU0FBUyxFQUFFO0FBQzlELE1BQU0sR0FBRyxHQUNQLHlFQUNtQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBRSxDQUFDO0FBQzNFLE1BQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUgsR0FBRyxFQUFFLE1BQU0sRUFBRSxnQkFBQSxJQUFJO2FBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDO0tBQUEsRUFBRSxDQUFDLENBQUM7Q0FDMUQsQ0FBQzs7O0FBR0Ysc0JBQXNCLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFTLFNBQVMsRUFBRSxNQUFNLEVBQUU7QUFDdkUsTUFBSSxDQUFDLFNBQVMsQ0FBQztBQUNiLE9BQUcseUJBQXVCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFHO0FBQzNELFVBQU0sRUFBQSxnQkFBQyxJQUFJLEVBQUU7QUFDWCxhQUFPLGFBQUssSUFBSSxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUM7S0FDbkM7R0FDRixDQUFDLENBQUM7Q0FDSixDQUFDOzs7QUFHRixzQkFBc0IsQ0FBQyxTQUFTLENBQUMsV0FBVyxHQUFHLFVBQVMsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNoRSxNQUFJLENBQUMsU0FBUyxrQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFHLENBQUM7Q0FDakcsQ0FBQzs7cUJBRWEsc0JBQXNCIiwiZmlsZSI6ImNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBTUUxpdGUzOiBDb2x1bW4gQnVpbGRlciAmIENvbXBpbGVyXG4vLyAtLS0tLS0tXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IFNjaGVtYUNvbXBpbGVyIGZyb20gJy4uLy4uLy4uL3NjaGVtYS9jb21waWxlcic7XG5cbmltcG9ydCB7IHNvbWUgfSBmcm9tICdsb2Rhc2gnXG5cbi8vIFNjaGVtYSBDb21waWxlclxuLy8gLS0tLS0tLVxuXG5mdW5jdGlvbiBTY2hlbWFDb21waWxlcl9TUUxpdGUzKCkge1xuICBTY2hlbWFDb21waWxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuaW5oZXJpdHMoU2NoZW1hQ29tcGlsZXJfU1FMaXRlMywgU2NoZW1hQ29tcGlsZXIpO1xuXG4vLyBDb21waWxlIHRoZSBxdWVyeSB0byBkZXRlcm1pbmUgaWYgYSB0YWJsZSBleGlzdHMuXG5TY2hlbWFDb21waWxlcl9TUUxpdGUzLnByb3RvdHlwZS5oYXNUYWJsZSA9IGZ1bmN0aW9uKHRhYmxlTmFtZSkge1xuICBjb25zdCBzcWwgPVxuICAgIGBzZWxlY3QgKiBmcm9tIHNxbGl0ZV9tYXN0ZXIgYCArXG4gICAgYHdoZXJlIHR5cGUgPSAndGFibGUnIGFuZCBuYW1lID0gJHt0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIodGFibGVOYW1lKX1gO1xuICB0aGlzLnB1c2hRdWVyeSh7IHNxbCwgb3V0cHV0OiByZXNwID0+IHJlc3AubGVuZ3RoID4gMCB9KTtcbn07XG5cbi8vIENvbXBpbGUgdGhlIHF1ZXJ5IHRvIGRldGVybWluZSBpZiBhIGNvbHVtbiBleGlzdHMuXG5TY2hlbWFDb21waWxlcl9TUUxpdGUzLnByb3RvdHlwZS5oYXNDb2x1bW4gPSBmdW5jdGlvbih0YWJsZU5hbWUsIGNvbHVtbikge1xuICB0aGlzLnB1c2hRdWVyeSh7XG4gICAgc3FsOiBgUFJBR01BIHRhYmxlX2luZm8oJHt0aGlzLmZvcm1hdHRlci53cmFwKHRhYmxlTmFtZSl9KWAsXG4gICAgb3V0cHV0KHJlc3ApIHtcbiAgICAgIHJldHVybiBzb21lKHJlc3AsIHtuYW1lOiBjb2x1bW59KTtcbiAgICB9XG4gIH0pO1xufTtcblxuLy8gQ29tcGlsZSBhIHJlbmFtZSB0YWJsZSBjb21tYW5kLlxuU2NoZW1hQ29tcGlsZXJfU1FMaXRlMy5wcm90b3R5cGUucmVuYW1lVGFibGUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICB0aGlzLnB1c2hRdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLmZvcm1hdHRlci53cmFwKGZyb20pfSByZW5hbWUgdG8gJHt0aGlzLmZvcm1hdHRlci53cmFwKHRvKX1gKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFNjaGVtYUNvbXBpbGVyX1NRTGl0ZTM7XG4iXX0=
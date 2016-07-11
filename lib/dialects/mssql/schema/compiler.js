
// MySQL Schema Compiler
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _schemaCompiler = require('../../../schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _lodash = require('lodash');

function SchemaCompiler_MSSQL(client, builder) {
  _schemaCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](SchemaCompiler_MSSQL, _schemaCompiler2['default']);

_lodash.assign(SchemaCompiler_MSSQL.prototype, {

  dropTablePrefix: 'DROP TABLE ',
  dropTableIfExists: function dropTableIfExists(tableName) {
    var name = this.formatter.wrap(prefixedTableName(this.schema, tableName));
    this.pushQuery('if object_id(\'' + name + '\', \'U\') is not null DROP TABLE ' + name);
  },

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('exec sp_rename ' + this.formatter.parameter(tableName) + ', ' + this.formatter.parameter(to));
  },

  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    var formattedTable = this.formatter.parameter(this.formatter.wrap(tableName));
    var sql = 'select object_id from sys.tables ' + ('where object_id = object_id(' + formattedTable + ')');
    this.pushQuery({ sql: sql, output: function output(resp) {
        return resp.length > 0;
      } });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    var formattedColumn = this.formatter.parameter(column);
    var formattedTable = this.formatter.parameter(this.formatter.wrap(tableName));
    var sql = 'select object_id from sys.columns ' + ('where name = ' + formattedColumn + ' ') + ('and object_id = object_id(' + formattedTable + ')');
    this.pushQuery({ sql: sql, output: function output(resp) {
        return resp.length > 0;
      } });
  }

});

function prefixedTableName(prefix, table) {
  return prefix ? prefix + '.' + table : table;
}

exports['default'] = SchemaCompiler_MSSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9tc3NxbC9zY2hlbWEvY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3dCQUdxQixVQUFVOzs7OzhCQUNKLDBCQUEwQjs7OztzQkFFOUIsUUFBUTs7QUFFL0IsU0FBUyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQzdDLDhCQUFlLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0NBQzNDO0FBQ0Qsc0JBQVMsb0JBQW9CLDhCQUFpQixDQUFBOztBQUU5QyxlQUFPLG9CQUFvQixDQUFDLFNBQVMsRUFBRTs7QUFFckMsaUJBQWUsRUFBRSxhQUFhO0FBQzlCLG1CQUFpQixFQUFBLDJCQUFDLFNBQVMsRUFBRTtBQUMzQixRQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDNUUsUUFBSSxDQUFDLFNBQVMscUJBQWtCLElBQUksMENBQWtDLElBQUksQ0FBRyxDQUFDO0dBQy9FOzs7QUFHRCxhQUFXLEVBQUEscUJBQUMsU0FBUyxFQUFFLEVBQUUsRUFBRTtBQUN6QixRQUFJLENBQUMsU0FBUyxxQkFDTSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBSyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FDdkYsQ0FBQztHQUNIOzs7QUFHRCxVQUFRLEVBQUEsa0JBQUMsU0FBUyxFQUFFO0FBQ2xCLFFBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDaEYsUUFBTSxHQUFHLEdBQ1Asd0VBQytCLGNBQWMsT0FBRyxDQUFDO0FBQ25ELFFBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUgsR0FBRyxFQUFFLE1BQU0sRUFBRSxnQkFBQSxJQUFJO2VBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDO09BQUEsRUFBRSxDQUFDLENBQUM7R0FDMUQ7OztBQUdELFdBQVMsRUFBQSxtQkFBQyxTQUFTLEVBQUUsTUFBTSxFQUFFO0FBQzNCLFFBQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3pELFFBQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDaEYsUUFBTSxHQUFHLEdBQ1AsMERBQ2dCLGVBQWUsT0FBRyxtQ0FDTCxjQUFjLE9BQUcsQ0FBQztBQUNqRCxRQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFILEdBQUcsRUFBRSxNQUFNLEVBQUUsZ0JBQUEsSUFBSTtlQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztPQUFBLEVBQUUsQ0FBQyxDQUFDO0dBQzFEOztDQUVGLENBQUMsQ0FBQTs7QUFFRixTQUFTLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUU7QUFDeEMsU0FBTyxNQUFNLEdBQU0sTUFBTSxTQUFJLEtBQUssR0FBSyxLQUFLLENBQUM7Q0FDOUM7O3FCQUVjLG9CQUFvQiIsImZpbGUiOiJjb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gTXlTUUwgU2NoZW1hIENvbXBpbGVyXG4vLyAtLS0tLS0tXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IFNjaGVtYUNvbXBpbGVyIGZyb20gJy4uLy4uLy4uL3NjaGVtYS9jb21waWxlcic7XG5cbmltcG9ydCB7IGFzc2lnbiB9IGZyb20gJ2xvZGFzaCdcblxuZnVuY3Rpb24gU2NoZW1hQ29tcGlsZXJfTVNTUUwoY2xpZW50LCBidWlsZGVyKSB7XG4gIFNjaGVtYUNvbXBpbGVyLmNhbGwodGhpcywgY2xpZW50LCBidWlsZGVyKVxufVxuaW5oZXJpdHMoU2NoZW1hQ29tcGlsZXJfTVNTUUwsIFNjaGVtYUNvbXBpbGVyKVxuXG5hc3NpZ24oU2NoZW1hQ29tcGlsZXJfTVNTUUwucHJvdG90eXBlLCB7XG5cbiAgZHJvcFRhYmxlUHJlZml4OiAnRFJPUCBUQUJMRSAnLFxuICBkcm9wVGFibGVJZkV4aXN0cyh0YWJsZU5hbWUpIHtcbiAgICBjb25zdCBuYW1lID0gdGhpcy5mb3JtYXR0ZXIud3JhcChwcmVmaXhlZFRhYmxlTmFtZSh0aGlzLnNjaGVtYSwgdGFibGVOYW1lKSk7XG4gICAgdGhpcy5wdXNoUXVlcnkoYGlmIG9iamVjdF9pZCgnJHtuYW1lfScsICdVJykgaXMgbm90IG51bGwgRFJPUCBUQUJMRSAke25hbWV9YCk7XG4gIH0sXG5cbiAgLy8gUmVuYW1lIGEgdGFibGUgb24gdGhlIHNjaGVtYS5cbiAgcmVuYW1lVGFibGUodGFibGVOYW1lLCB0bykge1xuICAgIHRoaXMucHVzaFF1ZXJ5KFxuICAgICAgYGV4ZWMgc3BfcmVuYW1lICR7dGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKHRhYmxlTmFtZSl9LCAke3RoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0byl9YFxuICAgICk7XG4gIH0sXG5cbiAgLy8gQ2hlY2sgd2hldGhlciBhIHRhYmxlIGV4aXN0cyBvbiB0aGUgcXVlcnkuXG4gIGhhc1RhYmxlKHRhYmxlTmFtZSkge1xuICAgIGNvbnN0IGZvcm1hdHRlZFRhYmxlID0gdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKHRoaXMuZm9ybWF0dGVyLndyYXAodGFibGVOYW1lKSk7XG4gICAgY29uc3Qgc3FsID1cbiAgICAgIGBzZWxlY3Qgb2JqZWN0X2lkIGZyb20gc3lzLnRhYmxlcyBgICtcbiAgICAgIGB3aGVyZSBvYmplY3RfaWQgPSBvYmplY3RfaWQoJHtmb3JtYXR0ZWRUYWJsZX0pYDtcbiAgICB0aGlzLnB1c2hRdWVyeSh7IHNxbCwgb3V0cHV0OiByZXNwID0+IHJlc3AubGVuZ3RoID4gMCB9KTtcbiAgfSxcblxuICAvLyBDaGVjayB3aGV0aGVyIGEgY29sdW1uIGV4aXN0cyBvbiB0aGUgc2NoZW1hLlxuICBoYXNDb2x1bW4odGFibGVOYW1lLCBjb2x1bW4pIHtcbiAgICBjb25zdCBmb3JtYXR0ZWRDb2x1bW4gPSB0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIoY29sdW1uKTtcbiAgICBjb25zdCBmb3JtYXR0ZWRUYWJsZSA9IHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0aGlzLmZvcm1hdHRlci53cmFwKHRhYmxlTmFtZSkpO1xuICAgIGNvbnN0IHNxbCA9XG4gICAgICBgc2VsZWN0IG9iamVjdF9pZCBmcm9tIHN5cy5jb2x1bW5zIGAgK1xuICAgICAgYHdoZXJlIG5hbWUgPSAke2Zvcm1hdHRlZENvbHVtbn0gYCArXG4gICAgICBgYW5kIG9iamVjdF9pZCA9IG9iamVjdF9pZCgke2Zvcm1hdHRlZFRhYmxlfSlgO1xuICAgIHRoaXMucHVzaFF1ZXJ5KHsgc3FsLCBvdXRwdXQ6IHJlc3AgPT4gcmVzcC5sZW5ndGggPiAwIH0pO1xuICB9XG5cbn0pXG5cbmZ1bmN0aW9uIHByZWZpeGVkVGFibGVOYW1lKHByZWZpeCwgdGFibGUpIHtcbiAgcmV0dXJuIHByZWZpeCA/IGAke3ByZWZpeH0uJHt0YWJsZX1gIDogdGFibGU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNjaGVtYUNvbXBpbGVyX01TU1FMO1xuIl19
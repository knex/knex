
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

function SchemaCompiler_MySQL(client, builder) {
  _schemaCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](SchemaCompiler_MySQL, _schemaCompiler2['default']);

_lodash.assign(SchemaCompiler_MySQL.prototype, {

  // Rename a table on the schema.
  renameTable: function renameTable(tableName, to) {
    this.pushQuery('rename table ' + this.formatter.wrap(tableName) + ' to ' + this.formatter.wrap(to));
  },

  // Check whether a table exists on the query.
  hasTable: function hasTable(tableName) {
    this.pushQuery({
      sql: 'show tables like ' + this.formatter.parameter(tableName),
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  },

  // Check whether a column exists on the schema.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: 'show columns from ' + this.formatter.wrap(tableName) + ' like ' + this.formatter.parameter(column),
      output: function output(resp) {
        return resp.length > 0;
      }
    });
  }

});

exports['default'] = SchemaCompiler_MySQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbC9zY2hlbWEvY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3dCQUdxQixVQUFVOzs7OzhCQUNKLDBCQUEwQjs7OztzQkFFOUIsUUFBUTs7QUFFL0IsU0FBUyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQzdDLDhCQUFlLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0NBQzNDO0FBQ0Qsc0JBQVMsb0JBQW9CLDhCQUFpQixDQUFBOztBQUU5QyxlQUFPLG9CQUFvQixDQUFDLFNBQVMsRUFBRTs7O0FBR3JDLGFBQVcsRUFBQSxxQkFBQyxTQUFTLEVBQUUsRUFBRSxFQUFFO0FBQ3pCLFFBQUksQ0FBQyxTQUFTLG1CQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBRyxDQUFDO0dBQ2hHOzs7QUFHRCxVQUFRLEVBQUEsa0JBQUMsU0FBUyxFQUFFO0FBQ2xCLFFBQUksQ0FBQyxTQUFTLENBQUM7QUFDYixTQUFHLHdCQUFzQixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQUFBRTtBQUM5RCxZQUFNLEVBQUEsZ0JBQUMsSUFBSSxFQUFFO0FBQ1gsZUFBTyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztPQUN4QjtLQUNGLENBQUMsQ0FBQztHQUNKOzs7QUFHRCxXQUFTLEVBQUEsbUJBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRTtBQUMzQixRQUFJLENBQUMsU0FBUyxDQUFDO0FBQ2IsU0FBRyxFQUFFLHVCQUFxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FDdEQsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUM3QyxZQUFNLEVBQUEsZ0JBQUMsSUFBSSxFQUFFO0FBQ1gsZUFBTyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztPQUN4QjtLQUNGLENBQUMsQ0FBQztHQUNKOztDQUVGLENBQUMsQ0FBQTs7cUJBRWEsb0JBQW9CIiwiZmlsZSI6ImNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBNeVNRTCBTY2hlbWEgQ29tcGlsZXJcbi8vIC0tLS0tLS1cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgU2NoZW1hQ29tcGlsZXIgZnJvbSAnLi4vLi4vLi4vc2NoZW1hL2NvbXBpbGVyJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBTY2hlbWFDb21waWxlcl9NeVNRTChjbGllbnQsIGJ1aWxkZXIpIHtcbiAgU2NoZW1hQ29tcGlsZXIuY2FsbCh0aGlzLCBjbGllbnQsIGJ1aWxkZXIpXG59XG5pbmhlcml0cyhTY2hlbWFDb21waWxlcl9NeVNRTCwgU2NoZW1hQ29tcGlsZXIpXG5cbmFzc2lnbihTY2hlbWFDb21waWxlcl9NeVNRTC5wcm90b3R5cGUsIHtcblxuICAvLyBSZW5hbWUgYSB0YWJsZSBvbiB0aGUgc2NoZW1hLlxuICByZW5hbWVUYWJsZSh0YWJsZU5hbWUsIHRvKSB7XG4gICAgdGhpcy5wdXNoUXVlcnkoYHJlbmFtZSB0YWJsZSAke3RoaXMuZm9ybWF0dGVyLndyYXAodGFibGVOYW1lKX0gdG8gJHt0aGlzLmZvcm1hdHRlci53cmFwKHRvKX1gKTtcbiAgfSxcblxuICAvLyBDaGVjayB3aGV0aGVyIGEgdGFibGUgZXhpc3RzIG9uIHRoZSBxdWVyeS5cbiAgaGFzVGFibGUodGFibGVOYW1lKSB7XG4gICAgdGhpcy5wdXNoUXVlcnkoe1xuICAgICAgc3FsOiBgc2hvdyB0YWJsZXMgbGlrZSAke3RoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0YWJsZU5hbWUpfWAsXG4gICAgICBvdXRwdXQocmVzcCkge1xuICAgICAgICByZXR1cm4gcmVzcC5sZW5ndGggPiAwO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIC8vIENoZWNrIHdoZXRoZXIgYSBjb2x1bW4gZXhpc3RzIG9uIHRoZSBzY2hlbWEuXG4gIGhhc0NvbHVtbih0YWJsZU5hbWUsIGNvbHVtbikge1xuICAgIHRoaXMucHVzaFF1ZXJ5KHtcbiAgICAgIHNxbDogYHNob3cgY29sdW1ucyBmcm9tICR7dGhpcy5mb3JtYXR0ZXIud3JhcCh0YWJsZU5hbWUpfWAgK1xuICAgICAgICAnIGxpa2UgJyArIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcihjb2x1bW4pLFxuICAgICAgb3V0cHV0KHJlc3ApIHtcbiAgICAgICAgcmV0dXJuIHJlc3AubGVuZ3RoID4gMDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBTY2hlbWFDb21waWxlcl9NeVNRTDtcbiJdfQ==
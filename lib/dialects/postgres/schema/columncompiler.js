
// PostgreSQL Column Compiler
// -------

'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _schemaColumncompiler = require('../../../schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

function ColumnCompiler_PG() {
  _schemaColumncompiler2['default'].apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
}
_inherits2['default'](ColumnCompiler_PG, _schemaColumncompiler2['default']);

_lodash.assign(ColumnCompiler_PG.prototype, {

  // Types
  // ------
  bigincrements: 'bigserial primary key',
  bigint: 'bigint',
  binary: 'bytea',

  bit: function bit(column) {
    return column.length !== false ? 'bit(' + column.length + ')' : 'bit';
  },

  bool: 'boolean',

  // Create the column definition for an enum type.
  // Using method "2" here: http://stackoverflow.com/a/10984951/525714
  enu: function enu(allowed) {
    return 'text check (' + this.formatter.wrap(this.args[0]) + ' in (\'' + allowed.join("', '") + '\'))';
  },

  double: 'double precision',
  floating: 'real',
  increments: 'serial primary key',
  json: function json(jsonb) {
    if (jsonb) helpers.deprecate('json(true)', 'jsonb()');
    return jsonColumn(this.client, jsonb);
  },
  jsonb: function jsonb() {
    return jsonColumn(this.client, true);
  },
  smallint: 'smallint',
  tinyint: 'smallint',
  datetime: function datetime(without) {
    return without ? 'timestamp' : 'timestamptz';
  },
  timestamp: function timestamp(without) {
    return without ? 'timestamp' : 'timestamptz';
  },
  uuid: 'uuid',

  // Modifiers:
  // ------
  comment: function comment(_comment) {
    this.pushAdditional(function () {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is " + (_comment ? '\'' + _comment + '\'' : 'NULL'));
    }, _comment);
  }

});

function jsonColumn(client, jsonb) {
  if (!client.version || parseFloat(client.version) >= 9.2) return jsonb ? 'jsonb' : 'json';
  return 'text';
}

exports['default'] = ColumnCompiler_PG;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9wb3N0Z3Jlcy9zY2hlbWEvY29sdW1uY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O3dCQUlxQixVQUFVOzs7O29DQUNKLGdDQUFnQzs7Ozt1QkFDbEMsa0JBQWtCOztJQUEvQixPQUFPOztzQkFFSSxRQUFROztBQUUvQixTQUFTLGlCQUFpQixHQUFHO0FBQzNCLG9DQUFlLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdEMsTUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUE7Q0FDdEQ7QUFDRCxzQkFBUyxpQkFBaUIsb0NBQWlCLENBQUM7O0FBRTVDLGVBQU8saUJBQWlCLENBQUMsU0FBUyxFQUFFOzs7O0FBSWxDLGVBQWEsRUFBRSx1QkFBdUI7QUFDdEMsUUFBTSxFQUFFLFFBQVE7QUFDaEIsUUFBTSxFQUFFLE9BQU87O0FBRWYsS0FBRyxFQUFBLGFBQUMsTUFBTSxFQUFFO0FBQ1YsV0FBTyxNQUFNLENBQUMsTUFBTSxLQUFLLEtBQUssWUFBVSxNQUFNLENBQUMsTUFBTSxTQUFNLEtBQUssQ0FBQztHQUNsRTs7QUFFRCxNQUFJLEVBQUUsU0FBUzs7OztBQUlmLEtBQUcsRUFBQSxhQUFDLE9BQU8sRUFBRTtBQUNYLDRCQUFzQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQVMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBTTtHQUMzRjs7QUFFRCxRQUFNLEVBQUUsa0JBQWtCO0FBQzFCLFVBQVEsRUFBRSxNQUFNO0FBQ2hCLFlBQVUsRUFBRSxvQkFBb0I7QUFDaEMsTUFBSSxFQUFBLGNBQUMsS0FBSyxFQUFFO0FBQ1YsUUFBSSxLQUFLLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUE7QUFDckQsV0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztHQUN2QztBQUNELE9BQUssRUFBQSxpQkFBRztBQUNOLFdBQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDdEM7QUFDRCxVQUFRLEVBQUUsVUFBVTtBQUNwQixTQUFPLEVBQUcsVUFBVTtBQUNwQixVQUFRLEVBQUEsa0JBQUMsT0FBTyxFQUFFO0FBQ2hCLFdBQU8sT0FBTyxHQUFHLFdBQVcsR0FBRyxhQUFhLENBQUM7R0FDOUM7QUFDRCxXQUFTLEVBQUEsbUJBQUMsT0FBTyxFQUFFO0FBQ2pCLFdBQU8sT0FBTyxHQUFHLFdBQVcsR0FBRyxhQUFhLENBQUM7R0FDOUM7QUFDRCxNQUFJLEVBQUUsTUFBTTs7OztBQUlaLFNBQU8sRUFBQSxpQkFBQyxRQUFPLEVBQUU7QUFDZixRQUFJLENBQUMsY0FBYyxDQUFDLFlBQVc7QUFDN0IsVUFBSSxDQUFDLFNBQVMsQ0FBQyx1QkFBcUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsU0FDaEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxRQUFPLFVBQU8sUUFBTyxVQUFNLE1BQU0sQ0FBQSxBQUFDLENBQUMsQ0FBQztLQUNyRixFQUFFLFFBQU8sQ0FBQyxDQUFDO0dBQ2I7O0NBRUYsQ0FBQyxDQUFBOztBQUVGLFNBQVMsVUFBVSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUU7QUFDakMsTUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLEVBQUUsT0FBTyxLQUFLLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUMxRixTQUFPLE1BQU0sQ0FBQztDQUNmOztxQkFFYyxpQkFBaUIiLCJmaWxlIjoiY29sdW1uY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIFBvc3RncmVTUUwgQ29sdW1uIENvbXBpbGVyXG4vLyAtLS0tLS0tXG5cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi4vLi4vLi4vc2NoZW1hL2NvbHVtbmNvbXBpbGVyJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vLi4vLi4vaGVscGVycyc7XG5cbmltcG9ydCB7IGFzc2lnbiB9IGZyb20gJ2xvZGFzaCdcblxuZnVuY3Rpb24gQ29sdW1uQ29tcGlsZXJfUEcoKSB7XG4gIENvbHVtbkNvbXBpbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIHRoaXMubW9kaWZpZXJzID0gWydudWxsYWJsZScsICdkZWZhdWx0VG8nLCAnY29tbWVudCddXG59XG5pbmhlcml0cyhDb2x1bW5Db21waWxlcl9QRywgQ29sdW1uQ29tcGlsZXIpO1xuXG5hc3NpZ24oQ29sdW1uQ29tcGlsZXJfUEcucHJvdG90eXBlLCB7XG5cbiAgLy8gVHlwZXNcbiAgLy8gLS0tLS0tXG4gIGJpZ2luY3JlbWVudHM6ICdiaWdzZXJpYWwgcHJpbWFyeSBrZXknLFxuICBiaWdpbnQ6ICdiaWdpbnQnLFxuICBiaW5hcnk6ICdieXRlYScsXG5cbiAgYml0KGNvbHVtbikge1xuICAgIHJldHVybiBjb2x1bW4ubGVuZ3RoICE9PSBmYWxzZSA/IGBiaXQoJHtjb2x1bW4ubGVuZ3RofSlgIDogJ2JpdCc7XG4gIH0sXG5cbiAgYm9vbDogJ2Jvb2xlYW4nLFxuXG4gIC8vIENyZWF0ZSB0aGUgY29sdW1uIGRlZmluaXRpb24gZm9yIGFuIGVudW0gdHlwZS5cbiAgLy8gVXNpbmcgbWV0aG9kIFwiMlwiIGhlcmU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwOTg0OTUxLzUyNTcxNFxuICBlbnUoYWxsb3dlZCkge1xuICAgIHJldHVybiBgdGV4dCBjaGVjayAoJHt0aGlzLmZvcm1hdHRlci53cmFwKHRoaXMuYXJnc1swXSl9IGluICgnJHthbGxvd2VkLmpvaW4oXCInLCAnXCIpfScpKWA7XG4gIH0sXG5cbiAgZG91YmxlOiAnZG91YmxlIHByZWNpc2lvbicsXG4gIGZsb2F0aW5nOiAncmVhbCcsXG4gIGluY3JlbWVudHM6ICdzZXJpYWwgcHJpbWFyeSBrZXknLFxuICBqc29uKGpzb25iKSB7XG4gICAgaWYgKGpzb25iKSBoZWxwZXJzLmRlcHJlY2F0ZSgnanNvbih0cnVlKScsICdqc29uYigpJylcbiAgICByZXR1cm4ganNvbkNvbHVtbih0aGlzLmNsaWVudCwganNvbmIpO1xuICB9LFxuICBqc29uYigpIHtcbiAgICByZXR1cm4ganNvbkNvbHVtbih0aGlzLmNsaWVudCwgdHJ1ZSk7XG4gIH0sXG4gIHNtYWxsaW50OiAnc21hbGxpbnQnLFxuICB0aW55aW50OiAgJ3NtYWxsaW50JyxcbiAgZGF0ZXRpbWUod2l0aG91dCkge1xuICAgIHJldHVybiB3aXRob3V0ID8gJ3RpbWVzdGFtcCcgOiAndGltZXN0YW1wdHonO1xuICB9LFxuICB0aW1lc3RhbXAod2l0aG91dCkge1xuICAgIHJldHVybiB3aXRob3V0ID8gJ3RpbWVzdGFtcCcgOiAndGltZXN0YW1wdHonO1xuICB9LFxuICB1dWlkOiAndXVpZCcsXG5cbiAgLy8gTW9kaWZpZXJzOlxuICAvLyAtLS0tLS1cbiAgY29tbWVudChjb21tZW50KSB7XG4gICAgdGhpcy5wdXNoQWRkaXRpb25hbChmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucHVzaFF1ZXJ5KGBjb21tZW50IG9uIGNvbHVtbiAke3RoaXMudGFibGVDb21waWxlci50YWJsZU5hbWUoKX0uYCArXG4gICAgICAgIHRoaXMuZm9ybWF0dGVyLndyYXAodGhpcy5hcmdzWzBdKSArIFwiIGlzIFwiICsgKGNvbW1lbnQgPyBgJyR7Y29tbWVudH0nYCA6ICdOVUxMJykpO1xuICAgIH0sIGNvbW1lbnQpO1xuICB9XG5cbn0pXG5cbmZ1bmN0aW9uIGpzb25Db2x1bW4oY2xpZW50LCBqc29uYikge1xuICBpZiAoIWNsaWVudC52ZXJzaW9uIHx8IHBhcnNlRmxvYXQoY2xpZW50LnZlcnNpb24pID49IDkuMikgcmV0dXJuIGpzb25iID8gJ2pzb25iJyA6ICdqc29uJztcbiAgcmV0dXJuICd0ZXh0Jztcbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29sdW1uQ29tcGlsZXJfUEc7XG4iXX0=

// Redshift Column Compiler
// -------

'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _postgresSchemaColumncompiler = require('../../postgres/schema/columncompiler');

var _postgresSchemaColumncompiler2 = _interopRequireDefault(_postgresSchemaColumncompiler);

var _lodash = require('lodash');

function ColumnCompiler_Redshift() {
  _postgresSchemaColumncompiler2['default'].apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'comment'];
}
_inherits2['default'](ColumnCompiler_Redshift, _postgresSchemaColumncompiler2['default']);

_lodash.assign(ColumnCompiler_Redshift.prototype, {
  bigincrements: 'bigint identity(1,1) primary key not null',
  binary: 'varchar(max)',
  bit: function bit(column) {
    return column.length !== false ? 'char(' + column.length + ')' : 'char(1)';
  },
  blob: 'varchar(max)',
  datetime: 'timestamp',
  enu: 'text',
  'enum': 'text',
  increments: 'integer identity(1,1) primary key not null',
  json: 'varchar(max)',
  jsonb: 'varchar(max)',
  longblob: 'varchar(max)',
  mediumblob: 'varchar(max)',
  set: 'text',
  text: 'varchar(max)',
  timestamp: 'timestamp',
  tinyblob: 'text',
  uuid: 'char(32)',
  varbinary: 'varchar(max)'
});

exports['default'] = ColumnCompiler_Redshift;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9yZWRzaGlmdC9zY2hlbWEvY29sdW1uY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt3QkFJcUIsVUFBVTs7Ozs0Q0FDRCxzQ0FBc0M7Ozs7c0JBRTdDLFFBQVE7O0FBRS9CLFNBQVMsdUJBQXVCLEdBQUc7QUFDakMsNENBQWtCLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDekMsTUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUE7Q0FDdEQ7QUFDRCxzQkFBUyx1QkFBdUIsNENBQW9CLENBQUM7O0FBRXJELGVBQU8sdUJBQXVCLENBQUMsU0FBUyxFQUFFO0FBQ3hDLGVBQWEsRUFBRSwyQ0FBMkM7QUFDMUQsUUFBTSxFQUFFLGNBQWM7QUFDdEIsS0FBRyxFQUFBLGFBQUMsTUFBTSxFQUFFO0FBQ1YsV0FBTyxNQUFNLENBQUMsTUFBTSxLQUFLLEtBQUssYUFBVyxNQUFNLENBQUMsTUFBTSxTQUFNLFNBQVMsQ0FBQztHQUN2RTtBQUNELE1BQUksRUFBRSxjQUFjO0FBQ3BCLFVBQVEsRUFBRSxXQUFXO0FBQ3JCLEtBQUcsRUFBRSxNQUFNO0FBQ1gsVUFBTSxNQUFNO0FBQ1osWUFBVSxFQUFFLDRDQUE0QztBQUN4RCxNQUFJLEVBQUUsY0FBYztBQUNwQixPQUFLLEVBQUUsY0FBYztBQUNyQixVQUFRLEVBQUUsY0FBYztBQUN4QixZQUFVLEVBQUUsY0FBYztBQUMxQixLQUFHLEVBQUUsTUFBTTtBQUNYLE1BQUksRUFBRSxjQUFjO0FBQ3BCLFdBQVMsRUFBRSxXQUFXO0FBQ3RCLFVBQVEsRUFBRSxNQUFNO0FBQ2hCLE1BQUksRUFBRSxVQUFVO0FBQ2hCLFdBQVMsRUFBRSxjQUFjO0NBQzFCLENBQUMsQ0FBQTs7cUJBRWEsdUJBQXVCIiwiZmlsZSI6ImNvbHVtbmNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBSZWRzaGlmdCBDb2x1bW4gQ29tcGlsZXJcbi8vIC0tLS0tLS1cblxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBDb2x1bW5Db21waWxlcl9QRyBmcm9tICcuLi8uLi9wb3N0Z3Jlcy9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuXG5pbXBvcnQgeyBhc3NpZ24gfSBmcm9tICdsb2Rhc2gnXG5cbmZ1bmN0aW9uIENvbHVtbkNvbXBpbGVyX1JlZHNoaWZ0KCkge1xuICBDb2x1bW5Db21waWxlcl9QRy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB0aGlzLm1vZGlmaWVycyA9IFsnbnVsbGFibGUnLCAnZGVmYXVsdFRvJywgJ2NvbW1lbnQnXVxufVxuaW5oZXJpdHMoQ29sdW1uQ29tcGlsZXJfUmVkc2hpZnQsIENvbHVtbkNvbXBpbGVyX1BHKTtcblxuYXNzaWduKENvbHVtbkNvbXBpbGVyX1JlZHNoaWZ0LnByb3RvdHlwZSwge1xuICBiaWdpbmNyZW1lbnRzOiAnYmlnaW50IGlkZW50aXR5KDEsMSkgcHJpbWFyeSBrZXkgbm90IG51bGwnLFxuICBiaW5hcnk6ICd2YXJjaGFyKG1heCknLFxuICBiaXQoY29sdW1uKSB7XG4gICAgcmV0dXJuIGNvbHVtbi5sZW5ndGggIT09IGZhbHNlID8gYGNoYXIoJHtjb2x1bW4ubGVuZ3RofSlgIDogJ2NoYXIoMSknO1xuICB9LFxuICBibG9iOiAndmFyY2hhcihtYXgpJyxcbiAgZGF0ZXRpbWU6ICd0aW1lc3RhbXAnLFxuICBlbnU6ICd0ZXh0JyxcbiAgZW51bTogJ3RleHQnLFxuICBpbmNyZW1lbnRzOiAnaW50ZWdlciBpZGVudGl0eSgxLDEpIHByaW1hcnkga2V5IG5vdCBudWxsJyxcbiAganNvbjogJ3ZhcmNoYXIobWF4KScsXG4gIGpzb25iOiAndmFyY2hhcihtYXgpJyxcbiAgbG9uZ2Jsb2I6ICd2YXJjaGFyKG1heCknLFxuICBtZWRpdW1ibG9iOiAndmFyY2hhcihtYXgpJyxcbiAgc2V0OiAndGV4dCcsXG4gIHRleHQ6ICd2YXJjaGFyKG1heCknLFxuICB0aW1lc3RhbXA6ICd0aW1lc3RhbXAnLFxuICB0aW55YmxvYjogJ3RleHQnLFxuICB1dWlkOiAnY2hhcigzMiknLFxuICB2YXJiaW5hcnk6ICd2YXJjaGFyKG1heCknXG59KVxuXG5leHBvcnQgZGVmYXVsdCBDb2x1bW5Db21waWxlcl9SZWRzaGlmdDsiXX0=
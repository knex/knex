
// MySQL Column Compiler
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

function ColumnCompiler_MSSQL() {
  _schemaColumncompiler2['default'].apply(this, arguments);
  this.modifiers = ['nullable', 'defaultTo', 'first', 'after', 'comment'];
}
_inherits2['default'](ColumnCompiler_MSSQL, _schemaColumncompiler2['default']);

// Types
// ------

_lodash.assign(ColumnCompiler_MSSQL.prototype, {

  increments: 'int identity(1,1) not null primary key',

  bigincrements: 'bigint identity(1,1) not null primary key',

  bigint: 'bigint',

  double: function double(precision, scale) {
    if (!precision) return 'double';
    return 'double(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },

  integer: function integer(length) {
    length = length ? '(' + this._num(length, 11) + ')' : '';
    return 'int' + length;
  },

  mediumint: 'mediumint',

  smallint: 'smallint',

  tinyint: function tinyint(length) {
    length = length ? '(' + this._num(length, 1) + ')' : '';
    return 'tinyint' + length;
  },

  varchar: function varchar(length) {
    return 'nvarchar(' + this._num(length, 255) + ')';
  },

  text: 'nvarchar(max)',

  mediumtext: 'nvarchar(max)',

  longtext: 'nvarchar(max)',

  enu: 'nvarchar(100)',

  uuid: 'uniqueidentifier',

  datetime: 'datetime',

  timestamp: 'datetime',

  bit: function bit(length) {
    return length ? 'bit(' + this._num(length) + ')' : 'bit';
  },

  binary: function binary(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'varbinary(max)';
  },

  bool: 'bit',

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    var defaultVal = ColumnCompiler_MSSQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  first: function first() {
    return 'first';
  },

  after: function after(column) {
    return 'after ' + this.formatter.wrap(column);
  },

  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for MSSQL');
    }
    return '';
  }

});

exports['default'] = ColumnCompiler_MSSQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9tc3NxbC9zY2hlbWEvY29sdW1uY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7b0NBQ0osZ0NBQWdDOzs7O3VCQUNsQyxrQkFBa0I7O0lBQS9CLE9BQU87O3NCQUVJLFFBQVE7O0FBRS9CLFNBQVMsb0JBQW9CLEdBQUc7QUFDOUIsb0NBQWUsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN0QyxNQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0NBQ3hFO0FBQ0Qsc0JBQVMsb0JBQW9CLG9DQUFpQixDQUFDOzs7OztBQUsvQyxlQUFPLG9CQUFvQixDQUFDLFNBQVMsRUFBRTs7QUFFckMsWUFBVSxFQUFFLHdDQUF3Qzs7QUFFcEQsZUFBYSxFQUFFLDJDQUEyQzs7QUFFMUQsUUFBTSxFQUFFLFFBQVE7O0FBRWhCLFFBQU0sRUFBQSxnQkFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFO0FBQ3ZCLFFBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxRQUFRLENBQUE7QUFDL0IsdUJBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxVQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxPQUFHO0dBQ3BFOztBQUVELFNBQU8sRUFBQSxpQkFBQyxNQUFNLEVBQUU7QUFDZCxVQUFNLEdBQUcsTUFBTSxTQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxTQUFNLEVBQUUsQ0FBQTtBQUNuRCxtQkFBYSxNQUFNLENBQUU7R0FDdEI7O0FBRUQsV0FBUyxFQUFFLFdBQVc7O0FBRXRCLFVBQVEsRUFBRSxVQUFVOztBQUVwQixTQUFPLEVBQUEsaUJBQUMsTUFBTSxFQUFFO0FBQ2QsVUFBTSxHQUFHLE1BQU0sU0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsU0FBTSxFQUFFLENBQUE7QUFDbEQsdUJBQWlCLE1BQU0sQ0FBRTtHQUMxQjs7QUFFRCxTQUFPLEVBQUEsaUJBQUMsTUFBTSxFQUFFO0FBQ2QseUJBQW1CLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFJO0dBQzlDOztBQUVELE1BQUksRUFBRSxlQUFlOztBQUVyQixZQUFVLEVBQUUsZUFBZTs7QUFFM0IsVUFBUSxFQUFFLGVBQWU7O0FBRXpCLEtBQUcsRUFBRSxlQUFlOztBQUVwQixNQUFJLEVBQUUsa0JBQWtCOztBQUV4QixVQUFRLEVBQUUsVUFBVTs7QUFFcEIsV0FBUyxFQUFFLFVBQVU7O0FBRXJCLEtBQUcsRUFBQSxhQUFDLE1BQU0sRUFBRTtBQUNWLFdBQU8sTUFBTSxZQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQU0sS0FBSyxDQUFBO0dBQ3BEOztBQUVELFFBQU0sRUFBQSxnQkFBQyxNQUFNLEVBQUU7QUFDYixXQUFPLE1BQU0sa0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQU0sZ0JBQWdCLENBQUE7R0FDckU7O0FBRUQsTUFBSSxFQUFFLEtBQUs7Ozs7O0FBS1gsV0FBUyxFQUFBLG1CQUFDLEtBQUssRUFBRTtBQUNmLFFBQU0sVUFBVSxHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDMUYsUUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUM1RCxhQUFPLFVBQVUsQ0FBQTtLQUNsQjtBQUNELFdBQU8sRUFBRSxDQUFBO0dBQ1Y7O0FBRUQsT0FBSyxFQUFBLGlCQUFHO0FBQ04sV0FBTyxPQUFPLENBQUE7R0FDZjs7QUFFRCxPQUFLLEVBQUEsZUFBQyxNQUFNLEVBQUU7QUFDWixzQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUU7R0FDOUM7O0FBRUQsU0FBTyxFQUFBLGlCQUFDLFFBQU8sRUFBRTtBQUNmLFFBQUksUUFBTyxJQUFJLFFBQU8sQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFO0FBQ25DLGFBQU8sQ0FBQyxJQUFJLENBQUMsOERBQThELENBQUMsQ0FBQTtLQUM3RTtBQUNELFdBQU8sRUFBRSxDQUFBO0dBQ1Y7O0NBRUYsQ0FBQyxDQUFBOztxQkFFYSxvQkFBb0IiLCJmaWxlIjoiY29sdW1uY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIE15U1FMIENvbHVtbiBDb21waWxlclxuLy8gLS0tLS0tLVxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBDb2x1bW5Db21waWxlciBmcm9tICcuLi8uLi8uLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi8uLi9oZWxwZXJzJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBDb2x1bW5Db21waWxlcl9NU1NRTCgpIHtcbiAgQ29sdW1uQ29tcGlsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgdGhpcy5tb2RpZmllcnMgPSBbJ251bGxhYmxlJywgJ2RlZmF1bHRUbycsICdmaXJzdCcsICdhZnRlcicsICdjb21tZW50J11cbn1cbmluaGVyaXRzKENvbHVtbkNvbXBpbGVyX01TU1FMLCBDb2x1bW5Db21waWxlcik7XG5cbi8vIFR5cGVzXG4vLyAtLS0tLS1cblxuYXNzaWduKENvbHVtbkNvbXBpbGVyX01TU1FMLnByb3RvdHlwZSwge1xuXG4gIGluY3JlbWVudHM6ICdpbnQgaWRlbnRpdHkoMSwxKSBub3QgbnVsbCBwcmltYXJ5IGtleScsXG5cbiAgYmlnaW5jcmVtZW50czogJ2JpZ2ludCBpZGVudGl0eSgxLDEpIG5vdCBudWxsIHByaW1hcnkga2V5JyxcblxuICBiaWdpbnQ6ICdiaWdpbnQnLFxuXG4gIGRvdWJsZShwcmVjaXNpb24sIHNjYWxlKSB7XG4gICAgaWYgKCFwcmVjaXNpb24pIHJldHVybiAnZG91YmxlJ1xuICAgIHJldHVybiBgZG91YmxlKCR7dGhpcy5fbnVtKHByZWNpc2lvbiwgOCl9LCAke3RoaXMuX251bShzY2FsZSwgMil9KWBcbiAgfSxcblxuICBpbnRlZ2VyKGxlbmd0aCkge1xuICAgIGxlbmd0aCA9IGxlbmd0aCA/IGAoJHt0aGlzLl9udW0obGVuZ3RoLCAxMSl9KWAgOiAnJ1xuICAgIHJldHVybiBgaW50JHtsZW5ndGh9YFxuICB9LFxuXG4gIG1lZGl1bWludDogJ21lZGl1bWludCcsXG5cbiAgc21hbGxpbnQ6ICdzbWFsbGludCcsXG5cbiAgdGlueWludChsZW5ndGgpIHtcbiAgICBsZW5ndGggPSBsZW5ndGggPyBgKCR7dGhpcy5fbnVtKGxlbmd0aCwgMSl9KWAgOiAnJ1xuICAgIHJldHVybiBgdGlueWludCR7bGVuZ3RofWBcbiAgfSxcblxuICB2YXJjaGFyKGxlbmd0aCkge1xuICAgIHJldHVybiBgbnZhcmNoYXIoJHt0aGlzLl9udW0obGVuZ3RoLCAyNTUpfSlgO1xuICB9LFxuXG4gIHRleHQ6ICdudmFyY2hhcihtYXgpJyxcblxuICBtZWRpdW10ZXh0OiAnbnZhcmNoYXIobWF4KScsXG5cbiAgbG9uZ3RleHQ6ICdudmFyY2hhcihtYXgpJyxcblxuICBlbnU6ICdudmFyY2hhcigxMDApJyxcblxuICB1dWlkOiAndW5pcXVlaWRlbnRpZmllcicsXG5cbiAgZGF0ZXRpbWU6ICdkYXRldGltZScsXG5cbiAgdGltZXN0YW1wOiAnZGF0ZXRpbWUnLFxuXG4gIGJpdChsZW5ndGgpIHtcbiAgICByZXR1cm4gbGVuZ3RoID8gYGJpdCgke3RoaXMuX251bShsZW5ndGgpfSlgIDogJ2JpdCdcbiAgfSxcblxuICBiaW5hcnkobGVuZ3RoKSB7XG4gICAgcmV0dXJuIGxlbmd0aCA/IGB2YXJiaW5hcnkoJHt0aGlzLl9udW0obGVuZ3RoKX0pYCA6ICd2YXJiaW5hcnkobWF4KSdcbiAgfSxcblxuICBib29sOiAnYml0JyxcblxuICAvLyBNb2RpZmllcnNcbiAgLy8gLS0tLS0tXG5cbiAgZGVmYXVsdFRvKHZhbHVlKSB7XG4gICAgY29uc3QgZGVmYXVsdFZhbCA9IENvbHVtbkNvbXBpbGVyX01TU1FMLnN1cGVyXy5wcm90b3R5cGUuZGVmYXVsdFRvLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKHRoaXMudHlwZSAhPT0gJ2Jsb2InICYmIHRoaXMudHlwZS5pbmRleE9mKCd0ZXh0JykgPT09IC0xKSB7XG4gICAgICByZXR1cm4gZGVmYXVsdFZhbFxuICAgIH1cbiAgICByZXR1cm4gJydcbiAgfSxcblxuICBmaXJzdCgpIHtcbiAgICByZXR1cm4gJ2ZpcnN0J1xuICB9LFxuXG4gIGFmdGVyKGNvbHVtbikge1xuICAgIHJldHVybiBgYWZ0ZXIgJHt0aGlzLmZvcm1hdHRlci53cmFwKGNvbHVtbil9YFxuICB9LFxuXG4gIGNvbW1lbnQoY29tbWVudCkge1xuICAgIGlmIChjb21tZW50ICYmIGNvbW1lbnQubGVuZ3RoID4gMjU1KSB7XG4gICAgICBoZWxwZXJzLndhcm4oJ1lvdXIgY29tbWVudCBpcyBsb25nZXIgdGhhbiB0aGUgbWF4IGNvbW1lbnQgbGVuZ3RoIGZvciBNU1NRTCcpXG4gICAgfVxuICAgIHJldHVybiAnJ1xuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IENvbHVtbkNvbXBpbGVyX01TU1FMO1xuIl19
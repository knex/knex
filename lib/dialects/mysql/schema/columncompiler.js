
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

function ColumnCompiler_MySQL() {
  _schemaColumncompiler2['default'].apply(this, arguments);
  this.modifiers = ['unsigned', 'nullable', 'defaultTo', 'first', 'after', 'comment', 'collate'];
}
_inherits2['default'](ColumnCompiler_MySQL, _schemaColumncompiler2['default']);

// Types
// ------

_lodash.assign(ColumnCompiler_MySQL.prototype, {

  increments: 'int unsigned not null auto_increment primary key',

  bigincrements: 'bigint unsigned not null auto_increment primary key',

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

  text: function text(column) {
    switch (column) {
      case 'medium':
      case 'mediumtext':
        return 'mediumtext';
      case 'long':
      case 'longtext':
        return 'longtext';
      default:
        return 'text';
    }
  },

  mediumtext: function mediumtext() {
    return this.text('medium');
  },

  longtext: function longtext() {
    return this.text('long');
  },

  enu: function enu(allowed) {
    return 'enum(\'' + allowed.join("', '") + '\')';
  },

  datetime: 'datetime',

  timestamp: 'timestamp',

  bit: function bit(length) {
    return length ? 'bit(' + this._num(length) + ')' : 'bit';
  },

  binary: function binary(length) {
    return length ? 'varbinary(' + this._num(length) + ')' : 'blob';
  },

  // Modifiers
  // ------

  defaultTo: function defaultTo(value) {
    var defaultVal = ColumnCompiler_MySQL.super_.prototype.defaultTo.apply(this, arguments);
    if (this.type !== 'blob' && this.type.indexOf('text') === -1) {
      return defaultVal;
    }
    return '';
  },

  unsigned: function unsigned() {
    return 'unsigned';
  },

  first: function first() {
    return 'first';
  },

  after: function after(column) {
    return 'after ' + this.formatter.wrap(column);
  },

  comment: function comment(_comment) {
    if (_comment && _comment.length > 255) {
      helpers.warn('Your comment is longer than the max comment length for MySQL');
    }
    return _comment && 'comment \'' + _comment + '\'';
  },

  collate: function collate(collation) {
    return collation && 'collate \'' + collation + '\'';
  }

});

exports['default'] = ColumnCompiler_MySQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbC9zY2hlbWEvY29sdW1uY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7b0NBQ0osZ0NBQWdDOzs7O3VCQUNsQyxrQkFBa0I7O0lBQS9CLE9BQU87O3NCQUVJLFFBQVE7O0FBRS9CLFNBQVMsb0JBQW9CLEdBQUc7QUFDOUIsb0NBQWUsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN0QyxNQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUE7Q0FDL0Y7QUFDRCxzQkFBUyxvQkFBb0Isb0NBQWlCLENBQUM7Ozs7O0FBSy9DLGVBQU8sb0JBQW9CLENBQUMsU0FBUyxFQUFFOztBQUVyQyxZQUFVLEVBQUUsa0RBQWtEOztBQUU5RCxlQUFhLEVBQUUscURBQXFEOztBQUVwRSxRQUFNLEVBQUUsUUFBUTs7QUFFaEIsUUFBTSxFQUFBLGdCQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUU7QUFDdkIsUUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLFFBQVEsQ0FBQTtBQUMvQix1QkFBaUIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLFVBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQUc7R0FDcEU7O0FBRUQsU0FBTyxFQUFBLGlCQUFDLE1BQU0sRUFBRTtBQUNkLFVBQU0sR0FBRyxNQUFNLFNBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLFNBQU0sRUFBRSxDQUFBO0FBQ25ELG1CQUFhLE1BQU0sQ0FBRTtHQUN0Qjs7QUFFRCxXQUFTLEVBQUUsV0FBVzs7QUFFdEIsVUFBUSxFQUFFLFVBQVU7O0FBRXBCLFNBQU8sRUFBQSxpQkFBQyxNQUFNLEVBQUU7QUFDZCxVQUFNLEdBQUcsTUFBTSxTQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxTQUFNLEVBQUUsQ0FBQTtBQUNsRCx1QkFBaUIsTUFBTSxDQUFFO0dBQzFCOztBQUVELE1BQUksRUFBQSxjQUFDLE1BQU0sRUFBRTtBQUNYLFlBQVEsTUFBTTtBQUNaLFdBQUssUUFBUSxDQUFDO0FBQ2QsV0FBSyxZQUFZO0FBQ2YsZUFBTyxZQUFZLENBQUM7QUFBQSxBQUN0QixXQUFLLE1BQU0sQ0FBQztBQUNaLFdBQUssVUFBVTtBQUNiLGVBQU8sVUFBVSxDQUFBO0FBQUEsQUFDbkI7QUFDRSxlQUFPLE1BQU0sQ0FBQztBQUFBLEtBQ2pCO0dBQ0Y7O0FBRUQsWUFBVSxFQUFBLHNCQUFHO0FBQ1gsV0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO0dBQzNCOztBQUVELFVBQVEsRUFBQSxvQkFBRztBQUNULFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUN6Qjs7QUFFRCxLQUFHLEVBQUEsYUFBQyxPQUFPLEVBQUU7QUFDWCx1QkFBZ0IsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBSTtHQUN6Qzs7QUFFRCxVQUFRLEVBQUUsVUFBVTs7QUFFcEIsV0FBUyxFQUFFLFdBQVc7O0FBRXRCLEtBQUcsRUFBQSxhQUFDLE1BQU0sRUFBRTtBQUNWLFdBQU8sTUFBTSxZQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQU0sS0FBSyxDQUFBO0dBQ3BEOztBQUVELFFBQU0sRUFBQSxnQkFBQyxNQUFNLEVBQUU7QUFDYixXQUFPLE1BQU0sa0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQU0sTUFBTSxDQUFBO0dBQzNEOzs7OztBQUtELFdBQVMsRUFBQSxtQkFBQyxLQUFLLEVBQUU7QUFDZixRQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzFGLFFBQUksSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDNUQsYUFBTyxVQUFVLENBQUE7S0FDbEI7QUFDRCxXQUFPLEVBQUUsQ0FBQTtHQUNWOztBQUVELFVBQVEsRUFBQSxvQkFBRztBQUNULFdBQU8sVUFBVSxDQUFBO0dBQ2xCOztBQUVELE9BQUssRUFBQSxpQkFBRztBQUNOLFdBQU8sT0FBTyxDQUFBO0dBQ2Y7O0FBRUQsT0FBSyxFQUFBLGVBQUMsTUFBTSxFQUFFO0FBQ1osc0JBQWdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFFO0dBQzlDOztBQUVELFNBQU8sRUFBQSxpQkFBQyxRQUFPLEVBQUU7QUFDZixRQUFJLFFBQU8sSUFBSSxRQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtBQUNuQyxhQUFPLENBQUMsSUFBSSxDQUFDLDhEQUE4RCxDQUFDLENBQUE7S0FDN0U7QUFDRCxXQUFPLFFBQU8sbUJBQWdCLFFBQU8sT0FBRyxDQUFBO0dBQ3pDOztBQUVELFNBQU8sRUFBQSxpQkFBQyxTQUFTLEVBQUU7QUFDakIsV0FBTyxTQUFTLG1CQUFnQixTQUFTLE9BQUcsQ0FBQTtHQUM3Qzs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLG9CQUFvQiIsImZpbGUiOiJjb2x1bW5jb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gTXlTUUwgQ29sdW1uIENvbXBpbGVyXG4vLyAtLS0tLS0tXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IENvbHVtbkNvbXBpbGVyIGZyb20gJy4uLy4uLy4uL3NjaGVtYS9jb2x1bW5jb21waWxlcic7XG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4uLy4uLy4uL2hlbHBlcnMnO1xuXG5pbXBvcnQgeyBhc3NpZ24gfSBmcm9tICdsb2Rhc2gnXG5cbmZ1bmN0aW9uIENvbHVtbkNvbXBpbGVyX015U1FMKCkge1xuICBDb2x1bW5Db21waWxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB0aGlzLm1vZGlmaWVycyA9IFsndW5zaWduZWQnLCAnbnVsbGFibGUnLCAnZGVmYXVsdFRvJywgJ2ZpcnN0JywgJ2FmdGVyJywgJ2NvbW1lbnQnLCAnY29sbGF0ZSddXG59XG5pbmhlcml0cyhDb2x1bW5Db21waWxlcl9NeVNRTCwgQ29sdW1uQ29tcGlsZXIpO1xuXG4vLyBUeXBlc1xuLy8gLS0tLS0tXG5cbmFzc2lnbihDb2x1bW5Db21waWxlcl9NeVNRTC5wcm90b3R5cGUsIHtcblxuICBpbmNyZW1lbnRzOiAnaW50IHVuc2lnbmVkIG5vdCBudWxsIGF1dG9faW5jcmVtZW50IHByaW1hcnkga2V5JyxcblxuICBiaWdpbmNyZW1lbnRzOiAnYmlnaW50IHVuc2lnbmVkIG5vdCBudWxsIGF1dG9faW5jcmVtZW50IHByaW1hcnkga2V5JyxcblxuICBiaWdpbnQ6ICdiaWdpbnQnLFxuXG4gIGRvdWJsZShwcmVjaXNpb24sIHNjYWxlKSB7XG4gICAgaWYgKCFwcmVjaXNpb24pIHJldHVybiAnZG91YmxlJ1xuICAgIHJldHVybiBgZG91YmxlKCR7dGhpcy5fbnVtKHByZWNpc2lvbiwgOCl9LCAke3RoaXMuX251bShzY2FsZSwgMil9KWBcbiAgfSxcblxuICBpbnRlZ2VyKGxlbmd0aCkge1xuICAgIGxlbmd0aCA9IGxlbmd0aCA/IGAoJHt0aGlzLl9udW0obGVuZ3RoLCAxMSl9KWAgOiAnJ1xuICAgIHJldHVybiBgaW50JHtsZW5ndGh9YFxuICB9LFxuXG4gIG1lZGl1bWludDogJ21lZGl1bWludCcsXG5cbiAgc21hbGxpbnQ6ICdzbWFsbGludCcsXG5cbiAgdGlueWludChsZW5ndGgpIHtcbiAgICBsZW5ndGggPSBsZW5ndGggPyBgKCR7dGhpcy5fbnVtKGxlbmd0aCwgMSl9KWAgOiAnJ1xuICAgIHJldHVybiBgdGlueWludCR7bGVuZ3RofWBcbiAgfSxcblxuICB0ZXh0KGNvbHVtbikge1xuICAgIHN3aXRjaCAoY29sdW1uKSB7XG4gICAgICBjYXNlICdtZWRpdW0nOlxuICAgICAgY2FzZSAnbWVkaXVtdGV4dCc6XG4gICAgICAgIHJldHVybiAnbWVkaXVtdGV4dCc7XG4gICAgICBjYXNlICdsb25nJzpcbiAgICAgIGNhc2UgJ2xvbmd0ZXh0JzpcbiAgICAgICAgcmV0dXJuICdsb25ndGV4dCdcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiAndGV4dCc7XG4gICAgfVxuICB9LFxuXG4gIG1lZGl1bXRleHQoKSB7XG4gICAgcmV0dXJuIHRoaXMudGV4dCgnbWVkaXVtJylcbiAgfSxcblxuICBsb25ndGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy50ZXh0KCdsb25nJylcbiAgfSxcblxuICBlbnUoYWxsb3dlZCkge1xuICAgIHJldHVybiBgZW51bSgnJHthbGxvd2VkLmpvaW4oXCInLCAnXCIpfScpYFxuICB9LFxuXG4gIGRhdGV0aW1lOiAnZGF0ZXRpbWUnLFxuXG4gIHRpbWVzdGFtcDogJ3RpbWVzdGFtcCcsXG5cbiAgYml0KGxlbmd0aCkge1xuICAgIHJldHVybiBsZW5ndGggPyBgYml0KCR7dGhpcy5fbnVtKGxlbmd0aCl9KWAgOiAnYml0J1xuICB9LFxuXG4gIGJpbmFyeShsZW5ndGgpIHtcbiAgICByZXR1cm4gbGVuZ3RoID8gYHZhcmJpbmFyeSgke3RoaXMuX251bShsZW5ndGgpfSlgIDogJ2Jsb2InXG4gIH0sXG5cbiAgLy8gTW9kaWZpZXJzXG4gIC8vIC0tLS0tLVxuXG4gIGRlZmF1bHRUbyh2YWx1ZSkge1xuICAgIGNvbnN0IGRlZmF1bHRWYWwgPSBDb2x1bW5Db21waWxlcl9NeVNRTC5zdXBlcl8ucHJvdG90eXBlLmRlZmF1bHRUby5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIGlmICh0aGlzLnR5cGUgIT09ICdibG9iJyAmJiB0aGlzLnR5cGUuaW5kZXhPZigndGV4dCcpID09PSAtMSkge1xuICAgICAgcmV0dXJuIGRlZmF1bHRWYWxcbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH0sXG5cbiAgdW5zaWduZWQoKSB7XG4gICAgcmV0dXJuICd1bnNpZ25lZCdcbiAgfSxcblxuICBmaXJzdCgpIHtcbiAgICByZXR1cm4gJ2ZpcnN0J1xuICB9LFxuXG4gIGFmdGVyKGNvbHVtbikge1xuICAgIHJldHVybiBgYWZ0ZXIgJHt0aGlzLmZvcm1hdHRlci53cmFwKGNvbHVtbil9YFxuICB9LFxuXG4gIGNvbW1lbnQoY29tbWVudCkge1xuICAgIGlmIChjb21tZW50ICYmIGNvbW1lbnQubGVuZ3RoID4gMjU1KSB7XG4gICAgICBoZWxwZXJzLndhcm4oJ1lvdXIgY29tbWVudCBpcyBsb25nZXIgdGhhbiB0aGUgbWF4IGNvbW1lbnQgbGVuZ3RoIGZvciBNeVNRTCcpXG4gICAgfVxuICAgIHJldHVybiBjb21tZW50ICYmIGBjb21tZW50ICcke2NvbW1lbnR9J2BcbiAgfSxcblxuICBjb2xsYXRlKGNvbGxhdGlvbikge1xuICAgIHJldHVybiBjb2xsYXRpb24gJiYgYGNvbGxhdGUgJyR7Y29sbGF0aW9ufSdgXG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgQ29sdW1uQ29tcGlsZXJfTXlTUUw7XG4iXX0=
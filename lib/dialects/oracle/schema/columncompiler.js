'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var _raw = require('../../../raw');

var _raw2 = _interopRequireDefault(_raw);

var _schemaColumncompiler = require('../../../schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

// Column Compiler
// -------

function ColumnCompiler_Oracle() {
  this.modifiers = ['defaultTo', 'checkIn', 'nullable', 'comment'];
  _schemaColumncompiler2['default'].apply(this, arguments);
}
_inherits2['default'](ColumnCompiler_Oracle, _schemaColumncompiler2['default']);

_lodash.assign(ColumnCompiler_Oracle.prototype, {

  // helper function for pushAdditional in increments() and bigincrements()
  _createAutoIncrementTriggerAndSequence: function _createAutoIncrementTriggerAndSequence() {
    // TODO Add warning that sequence etc is created
    this.pushAdditional(function () {
      var sequenceName = this.tableCompiler._indexCommand('seq', this.tableCompiler.tableNameRaw);
      var triggerName = this.tableCompiler._indexCommand('trg', this.tableCompiler.tableNameRaw, this.getColumnName());
      var tableName = this.tableCompiler.tableName();
      var columnName = this.formatter.wrap(this.getColumnName());
      var createTriggerSQL = 'create or replace trigger ' + triggerName + ' before insert on ' + tableName + ' for each row' + (' when (new.' + columnName + ' is null) ') + ' begin' + (' select ' + sequenceName + '.nextval into :new.' + columnName + ' from dual;') + ' end;';
      this.pushQuery(utils.wrapSqlWithCatch('create sequence ' + sequenceName, -955));
      this.pushQuery(createTriggerSQL);
    });
  },

  increments: function increments() {
    this._createAutoIncrementTriggerAndSequence();
    return 'integer not null primary key';
  },

  bigincrements: function bigincrements() {
    this._createAutoIncrementTriggerAndSequence();
    return 'number(20, 0) not null primary key';
  },

  floating: function floating(precision) {
    var parsedPrecision = this._num(precision, 0);
    return 'float' + (parsedPrecision ? '(' + parsedPrecision + ')' : '');
  },

  double: function double(precision, scale) {
    // if (!precision) return 'number'; // TODO: Check If default is ok
    return 'number(' + this._num(precision, 8) + ', ' + this._num(scale, 2) + ')';
  },

  integer: function integer(length) {
    return length ? 'number(' + this._num(length, 11) + ')' : 'integer';
  },

  tinyint: 'smallint',

  smallint: 'smallint',

  mediumint: 'integer',

  biginteger: 'number(20, 0)',

  text: 'clob',

  enu: function enu(allowed) {
    allowed = _lodash.uniq(allowed);
    var maxLength = (allowed || []).reduce(function (maxLength, name) {
      return Math.max(maxLength, String(name).length);
    }, 1);

    // implicitly add the enum values as checked values
    this.columnBuilder._modifiers.checkIn = [allowed];

    return 'varchar2(' + maxLength + ')';
  },

  time: 'timestamp with time zone',

  datetime: function datetime(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  },

  timestamp: function timestamp(without) {
    return without ? 'timestamp' : 'timestamp with time zone';
  },

  bit: 'clob',

  json: 'clob',

  bool: function bool() {
    // implicitly add the check for 0 and 1
    this.columnBuilder._modifiers.checkIn = [[0, 1]];
    return 'number(1, 0)';
  },

  varchar: function varchar(length) {
    return 'varchar2(' + this._num(length, 255) + ')';
  },

  // Modifiers
  // ------

  comment: function comment(_comment) {
    this.pushAdditional(function () {
      this.pushQuery('comment on column ' + this.tableCompiler.tableName() + '.' + this.formatter.wrap(this.args[0]) + " is '" + (_comment || '') + "'");
    }, _comment);
  },

  checkIn: function checkIn(value) {
    // TODO: Maybe accept arguments also as array
    // TODO: value(s) should be escaped properly
    if (value === undefined) {
      return '';
    } else if (value instanceof _raw2['default']) {
      value = value.toQuery();
    } else if (Array.isArray(value)) {
      value = _lodash.map(value, function (v) {
        return '\'' + v + '\'';
      }).join(', ');
    } else {
      value = '\'' + value + '\'';
    }
    return 'check (' + this.formatter.wrap(this.args[0]) + ' in (' + value + '))';
  }

});

exports['default'] = ColumnCompiler_Oracle;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvc2NoZW1hL2NvbHVtbmNvbXBpbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3NCQUNrQyxRQUFROzt3QkFDckIsVUFBVTs7OztxQkFDUixVQUFVOztJQUFyQixLQUFLOzttQkFDRCxjQUFjOzs7O29DQUNILGdDQUFnQzs7Ozs7OztBQUszRCxTQUFTLHFCQUFxQixHQUFHO0FBQy9CLE1BQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNqRSxvQ0FBZSxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0NBQ3ZDO0FBQ0Qsc0JBQVMscUJBQXFCLG9DQUFpQixDQUFDOztBQUVoRCxlQUFPLHFCQUFxQixDQUFDLFNBQVMsRUFBRTs7O0FBR3RDLHdDQUFzQyxFQUFDLGtEQUFHOztBQUV4QyxRQUFJLENBQUMsY0FBYyxDQUFDLFlBQVk7QUFDOUIsVUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQ25ELEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FDdkMsQ0FBQztBQUNGLFVBQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUNsRCxLQUFLLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUM3RCxDQUFDO0FBQ0YsVUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUNqRCxVQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztBQUM3RCxVQUFNLGdCQUFnQixHQUNwQiwrQkFBNkIsV0FBVywwQkFBcUIsU0FBUyxrQkFDdkQsb0JBQ0QsVUFBVSxnQkFB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QUFDLFNBQVMsRUFBRSxTQUNoRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxJQUFJLFFBQU8sSUFBSSxFQUFFLENBQUEsQUFBQyxHQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3ZFLEVBQUUsUUFBTyxDQUFDLENBQUM7R0FDYjs7QUFFRCxTQUFPLEVBQUMsaUJBQUMsS0FBSyxFQUFFOzs7QUFHZCxRQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7QUFDdkIsYUFBTyxFQUFFLENBQUM7S0FDWCxNQUFNLElBQUksS0FBSyw0QkFBZSxFQUFFO0FBQy9CLFdBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDekIsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDL0IsV0FBSyxHQUFHLFlBQUksS0FBSyxFQUFFLFVBQUEsQ0FBQztzQkFBUSxDQUFDO09BQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QyxNQUFNO0FBQ0wsV0FBSyxVQUFPLEtBQUssT0FBRyxDQUFDO0tBQ3RCO0FBQ0QsdUJBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBUSxLQUFLLFFBQUs7R0FDckU7O0NBRUYsQ0FBQyxDQUFDOztxQkFFWSxxQkFBcUIiLCJmaWxlIjoiY29sdW1uY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCB7IGFzc2lnbiwgdW5pcSwgbWFwIH0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBSYXcgZnJvbSAnLi4vLi4vLi4vcmF3JztcbmltcG9ydCBDb2x1bW5Db21waWxlciBmcm9tICcuLi8uLi8uLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuXG4vLyBDb2x1bW4gQ29tcGlsZXJcbi8vIC0tLS0tLS1cblxuZnVuY3Rpb24gQ29sdW1uQ29tcGlsZXJfT3JhY2xlKCkge1xuICB0aGlzLm1vZGlmaWVycyA9IFsnZGVmYXVsdFRvJywgJ2NoZWNrSW4nLCAnbnVsbGFibGUnLCAnY29tbWVudCddO1xuICBDb2x1bW5Db21waWxlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuaW5oZXJpdHMoQ29sdW1uQ29tcGlsZXJfT3JhY2xlLCBDb2x1bW5Db21waWxlcik7XG5cbmFzc2lnbihDb2x1bW5Db21waWxlcl9PcmFjbGUucHJvdG90eXBlLCB7XG5cbiAgLy8gaGVscGVyIGZ1bmN0aW9uIGZvciBwdXNoQWRkaXRpb25hbCBpbiBpbmNyZW1lbnRzKCkgYW5kIGJpZ2luY3JlbWVudHMoKVxuICBfY3JlYXRlQXV0b0luY3JlbWVudFRyaWdnZXJBbmRTZXF1ZW5jZSAoKSB7XG4gICAgLy8gVE9ETyBBZGQgd2FybmluZyB0aGF0IHNlcXVlbmNlIGV0YyBpcyBjcmVhdGVkXG4gICAgdGhpcy5wdXNoQWRkaXRpb25hbChmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zdCBzZXF1ZW5jZU5hbWUgPSB0aGlzLnRhYmxlQ29tcGlsZXIuX2luZGV4Q29tbWFuZChcbiAgICAgICAgJ3NlcScsIHRoaXMudGFibGVDb21waWxlci50YWJsZU5hbWVSYXdcbiAgICAgICk7XG4gICAgICBjb25zdCB0cmlnZ2VyTmFtZSA9IHRoaXMudGFibGVDb21waWxlci5faW5kZXhDb21tYW5kKFxuICAgICAgICAndHJnJywgdGhpcy50YWJsZUNvbXBpbGVyLnRhYmxlTmFtZVJhdywgdGhpcy5nZXRDb2x1bW5OYW1lKClcbiAgICAgICk7XG4gICAgICBjb25zdCB0YWJsZU5hbWUgPSB0aGlzLnRhYmxlQ29tcGlsZXIudGFibGVOYW1lKCk7XG4gICAgICBjb25zdCBjb2x1bW5OYW1lID0gdGhpcy5mb3JtYXR0ZXIud3JhcCh0aGlzLmdldENvbHVtbk5hbWUoKSk7XG4gICAgICBjb25zdCBjcmVhdGVUcmlnZ2VyU1FMID1cbiAgICAgICAgYGNyZWF0ZSBvciByZXBsYWNlIHRyaWdnZXIgJHt0cmlnZ2VyTmFtZX0gYmVmb3JlIGluc2VydCBvbiAke3RhYmxlTmFtZX1gICtcbiAgICAgICAgYCBmb3IgZWFjaCByb3dgICtcbiAgICAgICAgYCB3aGVuIChuZXcuJHtjb2x1bW5OYW1lfSBpcyBudWxsKSBgICtcbiAgICAgICAgYCBiZWdpbmAgK1xuICAgICAgICBgIHNlbGVjdCAke3NlcXVlbmNlTmFtZX0ubmV4dHZhbCBpbnRvIDpuZXcuJHtjb2x1bW5OYW1lfSBmcm9tIGR1YWw7YCArXG4gICAgICAgIGAgZW5kO2A7XG4gICAgICB0aGlzLnB1c2hRdWVyeSh1dGlscy53cmFwU3FsV2l0aENhdGNoKGBjcmVhdGUgc2VxdWVuY2UgJHtzZXF1ZW5jZU5hbWV9YCwgLTk1NSkpO1xuICAgICAgdGhpcy5wdXNoUXVlcnkoY3JlYXRlVHJpZ2dlclNRTCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgaW5jcmVtZW50cyAoKSB7XG4gICAgdGhpcy5fY3JlYXRlQXV0b0luY3JlbWVudFRyaWdnZXJBbmRTZXF1ZW5jZSgpO1xuICAgIHJldHVybiAnaW50ZWdlciBub3QgbnVsbCBwcmltYXJ5IGtleSc7XG4gIH0sXG5cbiAgYmlnaW5jcmVtZW50cyAoKSB7XG4gICAgdGhpcy5fY3JlYXRlQXV0b0luY3JlbWVudFRyaWdnZXJBbmRTZXF1ZW5jZSgpO1xuICAgIHJldHVybiAnbnVtYmVyKDIwLCAwKSBub3QgbnVsbCBwcmltYXJ5IGtleSc7XG4gIH0sXG5cbiAgZmxvYXRpbmcocHJlY2lzaW9uKSB7XG4gICAgY29uc3QgcGFyc2VkUHJlY2lzaW9uID0gdGhpcy5fbnVtKHByZWNpc2lvbiwgMCk7XG4gICAgcmV0dXJuIGBmbG9hdCR7cGFyc2VkUHJlY2lzaW9uID8gYCgke3BhcnNlZFByZWNpc2lvbn0pYCA6ICcnfWA7XG4gIH0sXG5cbiAgZG91YmxlKHByZWNpc2lvbiwgc2NhbGUpIHtcbiAgICAvLyBpZiAoIXByZWNpc2lvbikgcmV0dXJuICdudW1iZXInOyAvLyBUT0RPOiBDaGVjayBJZiBkZWZhdWx0IGlzIG9rXG4gICAgcmV0dXJuIGBudW1iZXIoJHt0aGlzLl9udW0ocHJlY2lzaW9uLCA4KX0sICR7dGhpcy5fbnVtKHNjYWxlLCAyKX0pYDtcbiAgfSxcblxuICBpbnRlZ2VyKGxlbmd0aCkge1xuICAgIHJldHVybiBsZW5ndGggPyBgbnVtYmVyKCR7dGhpcy5fbnVtKGxlbmd0aCwgMTEpfSlgIDogJ2ludGVnZXInO1xuICB9LFxuXG4gIHRpbnlpbnQ6ICdzbWFsbGludCcsXG5cbiAgc21hbGxpbnQ6ICdzbWFsbGludCcsXG5cbiAgbWVkaXVtaW50OiAnaW50ZWdlcicsXG5cbiAgYmlnaW50ZWdlcjogJ251bWJlcigyMCwgMCknLFxuXG4gIHRleHQ6ICdjbG9iJyxcblxuICBlbnUgKGFsbG93ZWQpIHtcbiAgICBhbGxvd2VkID0gdW5pcShhbGxvd2VkKTtcbiAgICBjb25zdCBtYXhMZW5ndGggPSAoYWxsb3dlZCB8fCBbXSkucmVkdWNlKChtYXhMZW5ndGgsIG5hbWUpID0+XG4gICAgICBNYXRoLm1heChtYXhMZW5ndGgsIFN0cmluZyhuYW1lKS5sZW5ndGgpXG4gICAgLCAxKTtcblxuICAgIC8vIGltcGxpY2l0bHkgYWRkIHRoZSBlbnVtIHZhbHVlcyBhcyBjaGVja2VkIHZhbHVlc1xuICAgIHRoaXMuY29sdW1uQnVpbGRlci5fbW9kaWZpZXJzLmNoZWNrSW4gPSBbYWxsb3dlZF07XG5cbiAgICByZXR1cm4gYHZhcmNoYXIyKCR7bWF4TGVuZ3RofSlgO1xuICB9LFxuXG4gIHRpbWU6ICd0aW1lc3RhbXAgd2l0aCB0aW1lIHpvbmUnLFxuXG4gIGRhdGV0aW1lKHdpdGhvdXQpIHtcbiAgICByZXR1cm4gd2l0aG91dCA/ICd0aW1lc3RhbXAnIDogJ3RpbWVzdGFtcCB3aXRoIHRpbWUgem9uZSc7XG4gIH0sXG5cbiAgdGltZXN0YW1wKHdpdGhvdXQpIHtcbiAgICByZXR1cm4gd2l0aG91dCA/ICd0aW1lc3RhbXAnIDogJ3RpbWVzdGFtcCB3aXRoIHRpbWUgem9uZSc7XG4gIH0sXG5cbiAgYml0OiAnY2xvYicsXG5cbiAganNvbjogJ2Nsb2InLFxuXG4gIGJvb2wgKCkge1xuICAgIC8vIGltcGxpY2l0bHkgYWRkIHRoZSBjaGVjayBmb3IgMCBhbmQgMVxuICAgIHRoaXMuY29sdW1uQnVpbGRlci5fbW9kaWZpZXJzLmNoZWNrSW4gPSBbWzAsIDFdXTtcbiAgICByZXR1cm4gJ251bWJlcigxLCAwKSc7XG4gIH0sXG5cbiAgdmFyY2hhcihsZW5ndGgpIHtcbiAgICByZXR1cm4gYHZhcmNoYXIyKCR7dGhpcy5fbnVtKGxlbmd0aCwgMjU1KX0pYDtcbiAgfSxcblxuICAvLyBNb2RpZmllcnNcbiAgLy8gLS0tLS0tXG5cbiAgY29tbWVudChjb21tZW50KSB7XG4gICAgdGhpcy5wdXNoQWRkaXRpb25hbChmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucHVzaFF1ZXJ5KGBjb21tZW50IG9uIGNvbHVtbiAke3RoaXMudGFibGVDb21waWxlci50YWJsZU5hbWUoKX0uYCArXG4gICAgICAgIHRoaXMuZm9ybWF0dGVyLndyYXAodGhpcy5hcmdzWzBdKSArIFwiIGlzICdcIiArIChjb21tZW50IHx8ICcnKSsgXCInXCIpO1xuICAgIH0sIGNvbW1lbnQpO1xuICB9LFxuXG4gIGNoZWNrSW4gKHZhbHVlKSB7XG4gICAgLy8gVE9ETzogTWF5YmUgYWNjZXB0IGFyZ3VtZW50cyBhbHNvIGFzIGFycmF5XG4gICAgLy8gVE9ETzogdmFsdWUocykgc2hvdWxkIGJlIGVzY2FwZWQgcHJvcGVybHlcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBSYXcpIHtcbiAgICAgIHZhbHVlID0gdmFsdWUudG9RdWVyeSgpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHZhbHVlID0gbWFwKHZhbHVlLCB2ID0+IGAnJHt2fSdgKS5qb2luKCcsICcpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGAnJHt2YWx1ZX0nYDtcbiAgICB9XG4gICAgcmV0dXJuIGBjaGVjayAoJHt0aGlzLmZvcm1hdHRlci53cmFwKHRoaXMuYXJnc1swXSl9IGluICgke3ZhbHVlfSkpYDtcbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQ29sdW1uQ29tcGlsZXJfT3JhY2xlO1xuIl19
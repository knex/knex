/* eslint max-len:0 */

'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

var _schemaTablecompiler = require('../../../schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _helpers = require('../../../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

// Table Compiler
// ------

function TableCompiler_Oracle() {
  _schemaTablecompiler2['default'].apply(this, arguments);
}
_inherits2['default'](TableCompiler_Oracle, _schemaTablecompiler2['default']);

_lodash.assign(TableCompiler_Oracle.prototype, {

  // Compile a rename column command.
  renameColumn: function renameColumn(from, to) {
    return this.pushQuery({
      sql: 'alter table ' + this.tableName() + ' rename column ' + this.formatter.wrap(from) + ' to ' + this.formatter.wrap(to)
    });
  },

  compileAdd: function compileAdd(builder) {
    var table = this.formatter.wrap(builder);
    var columns = this.prefixArray('add column', this.getColumns(builder));
    return this.pushQuery({
      sql: 'alter table ' + table + ' ' + columns.join(', ')
    });
  },

  // Adds the "create" query to the query sequence.
  createQuery: function createQuery(columns, ifNot) {
    var sql = 'create table ' + this.tableName() + ' (' + columns.sql.join(', ') + ')';
    this.pushQuery({
      // catch "name is already used by an existing object" for workaround for "if not exists"
      sql: ifNot ? utils.wrapSqlWithCatch(sql, -955) : sql,
      bindings: columns.bindings
    });
    if (this.single.comment) this.comment(this.single.comment);
  },

  // Compiles the comment on the table.
  comment: function comment(_comment) {
    this.pushQuery('comment on table ' + this.tableName() + ' is \'' + (_comment || '') + '\'');
  },

  addColumnsPrefix: 'add ',

  dropColumn: function dropColumn() {
    var columns = helpers.normalizeArr.apply(null, arguments);
    this.pushQuery('alter table ' + this.tableName() + ' drop (' + this.formatter.columnize(columns) + ')');
  },

  changeType: function changeType() {
    // alter table + table + ' modify ' + wrapped + '// type';
  },

  _indexCommand: function _indexCommand(type, tableName, columns) {
    return this.formatter.wrap(utils.generateCombinedName(type, tableName, columns));
  },

  primary: function primary(columns, constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + constraintName + ' primary key (' + this.formatter.columnize(columns) + ')');
  },

  dropPrimary: function dropPrimary(constraintName) {
    constraintName = constraintName ? this.formatter.wrap(constraintName) : this.formatter.wrap(this.tableNameRaw + '_pkey');
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + constraintName);
  },

  index: function index(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('create index ' + indexName + ' on ' + this.tableName() + ' (' + this.formatter.columnize(columns) + ')');
  },

  dropIndex: function dropIndex(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('index', this.tableNameRaw, columns);
    this.pushQuery('drop index ' + indexName);
  },

  unique: function unique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' add constraint ' + indexName + ' unique (' + this.formatter.columnize(columns) + ')');
  },

  dropUnique: function dropUnique(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('unique', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  },

  dropForeign: function dropForeign(columns, indexName) {
    indexName = indexName ? this.formatter.wrap(indexName) : this._indexCommand('foreign', this.tableNameRaw, columns);
    this.pushQuery('alter table ' + this.tableName() + ' drop constraint ' + indexName);
  }

});

exports['default'] = TableCompiler_Oracle;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvc2NoZW1hL3RhYmxlY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozt3QkFFcUIsVUFBVTs7OztxQkFDUixVQUFVOztJQUFyQixLQUFLOzttQ0FDUywrQkFBK0I7Ozs7dUJBQ2hDLGtCQUFrQjs7SUFBL0IsT0FBTzs7c0JBRUksUUFBUTs7Ozs7QUFLL0IsU0FBUyxvQkFBb0IsR0FBRztBQUM5QixtQ0FBYyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0NBQ3RDO0FBQ0Qsc0JBQVMsb0JBQW9CLG1DQUFnQixDQUFDOztBQUU5QyxlQUFPLG9CQUFvQixDQUFDLFNBQVMsRUFBRTs7O0FBR3JDLGNBQVksRUFBQSxzQkFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQ3JCLFdBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUNwQixTQUFHLEVBQUUsaUJBQWUsSUFBSSxDQUFDLFNBQVMsRUFBRSx1QkFDbEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUMvRCxDQUFDLENBQUM7R0FDSjs7QUFFRCxZQUFVLEVBQUEsb0JBQUMsT0FBTyxFQUFFO0FBQ2xCLFFBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzNDLFFBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUN6RSxXQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDcEIsU0FBRyxtQkFBaUIsS0FBSyxTQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEFBQUU7S0FDbEQsQ0FBQyxDQUFDO0dBQ0o7OztB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LENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ25ILFFBQUksQ0FBQyxTQUFTLGtCQUFnQixJQUFJLENBQUMsU0FBUyxFQUFFLHlCQUFvQixTQUFTLENBQUcsQ0FBQztHQUNoRjs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLG9CQUFvQiIsImZpbGUiOiJ0YWJsZWNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG1heC1sZW46MCAqL1xuXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IFRhYmxlQ29tcGlsZXIgZnJvbSAnLi4vLi4vLi4vc2NoZW1hL3RhYmxlY29tcGlsZXInO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuLi8uLi8uLi9oZWxwZXJzJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG4vLyBUYWJsZSBDb21waWxlclxuLy8gLS0tLS0tXG5cbmZ1bmN0aW9uIFRhYmxlQ29tcGlsZXJfT3JhY2xlKCkge1xuICBUYWJsZUNvbXBpbGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5pbmhlcml0cyhUYWJsZUNvbXBpbGVyX09yYWNsZSwgVGFibGVDb21waWxlcik7XG5cbmFzc2lnbihUYWJsZUNvbXBpbGVyX09yYWNsZS5wcm90b3R5cGUsIHtcblxuICAvLyBDb21waWxlIGEgcmVuYW1lIGNvbHVtbiBjb21tYW5kLlxuICByZW5hbWVDb2x1bW4oZnJvbSwgdG8pIHtcbiAgICByZXR1cm4gdGhpcy5wdXNoUXVlcnkoe1xuICAgICAgc3FsOiBgYWx0ZXIgdGFibGUgJHt0aGlzLnRhYmxlTmFtZSgpfSByZW5hbWUgY29sdW1uIGAgK1xuICAgICAgICB0aGlzLmZvcm1hdHRlci53cmFwKGZyb20pICsgJyB0byAnICsgdGhpcy5mb3JtYXR0ZXIud3JhcCh0bylcbiAgICB9KTtcbiAgfSxcblxuICBjb21waWxlQWRkKGJ1aWxkZXIpIHtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuZm9ybWF0dGVyLndyYXAoYnVpbGRlcik7XG4gICAgY29uc3QgY29sdW1ucyA9IHRoaXMucHJlZml4QXJyYXkoJ2FkZCBjb2x1bW4nLCB0aGlzLmdldENvbHVtbnMoYnVpbGRlcikpO1xuICAgIHJldHVybiB0aGlzLnB1c2hRdWVyeSh7XG4gICAgICBzcWw6IGBhbHRlciB0YWJsZSAke3RhYmxlfSAke2NvbHVtbnMuam9pbignLCAnKX1gXG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gQWRkcyB0aGUgXCJjcmVhdGVcIiBxdWVyeSB0byB0aGUgcXVlcnkgc2VxdWVuY2UuXG4gIGNyZWF0ZVF1ZXJ5KGNvbHVtbnMsIGlmTm90KSB7XG4gICAgY29uc3Qgc3FsID0gYGNyZWF0ZSB0YWJsZSAke3RoaXMudGFibGVOYW1lKCl9ICgke2NvbHVtbnMuc3FsLmpvaW4oJywgJyl9KWA7XG4gICAgdGhpcy5wdXNoUXVlcnkoe1xuICAgICAgLy8gY2F0Y2ggXCJuYW1lIGlzIGFscmVhZHkgdXNlZCBieSBhbiBleGlzdGluZyBvYmplY3RcIiBmb3Igd29ya2Fyb3VuZCBmb3IgXCJpZiBub3QgZXhpc3RzXCJcbiAgICAgIHNxbDogaWZOb3QgPyB1dGlscy53cmFwU3FsV2l0aENhdGNoKHNxbCwgLTk1NSkgOiBzcWwsXG4gICAgICBiaW5kaW5nczogY29sdW1ucy5iaW5kaW5nc1xuICAgIH0pO1xuICAgIGlmICh0aGlzLnNpbmdsZS5jb21tZW50KSB0aGlzLmNvbW1lbnQodGhpcy5zaW5nbGUuY29tbWVudCk7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgdGhlIGNvbW1lbnQgb24gdGhlIHRhYmxlLlxuICBjb21tZW50KGNvbW1lbnQpIHtcbiAgICB0aGlzLnB1c2hRdWVyeShgY29tbWVudCBvbiB0YWJsZSAke3RoaXMudGFibGVOYW1lKCl9IGlzICcke2NvbW1lbnQgfHwgJyd9J2ApO1xuICB9LFxuXG4gIGFkZENvbHVtbnNQcmVmaXg6ICdhZGQgJyxcblxuICBkcm9wQ29sdW1uKCkge1xuICAgIGNvbnN0IGNvbHVtbnMgPSBoZWxwZXJzLm5vcm1hbGl6ZUFyci5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIHRoaXMucHVzaFF1ZXJ5KGBhbHRlciB0YWJsZSAke3RoaXMudGFibGVOYW1lKCl9IGRyb3AgKCR7dGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKGNvbHVtbnMpfSlgKTtcbiAgfSxcblxuICBjaGFuZ2VUeXBlKCkge1xuICAgIC8vIGFsdGVyIHRhYmxlICsgdGFibGUgKyAnIG1vZGlmeSAnICsgd3JhcHBlZCArICcvLyB0eXBlJztcbiAgfSxcblxuICBfaW5kZXhDb21tYW5kKHR5cGUsIHRhYmxlTmFtZSwgY29sdW1ucykge1xuICAgIHJldHVybiB0aGlzLmZvcm1hdHRlci53cmFwKHV0aWxzLmdlbmVyYXRlQ29tYmluZWROYW1lKHR5cGUsIHRhYmxlTmFtZSwgY29sdW1ucykpO1xuICB9LFxuXG4gIHByaW1hcnkoY29sdW1ucywgY29uc3RyYWludE5hbWUpIHtcbiAgICBjb25zdHJhaW50TmFtZSA9IGNvbnN0cmFpbnROYW1lID8gdGhpcy5mb3JtYXR0ZXIud3JhcChjb25zdHJhaW50TmFtZSkgOiB0aGlzLmZvcm1hdHRlci53cmFwKGAke3RoaXMudGFibGVOYW1lUmF3fV9wa2V5YCk7XG4gICAgdGhpcy5wdXNoUXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy50YWJsZU5hbWUoKX0gYWRkIGNvbnN0cmFpbnQgJHtjb25zdHJhaW50TmFtZX0gcHJpbWFyeSBrZXkgKCR7dGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKGNvbHVtbnMpfSlgKTtcbiAgfSxcblxuICBkcm9wUHJpbWFyeShjb25zdHJhaW50TmFtZSkge1xuICAgIGNvbnN0cmFpbnROYW1lID0gY29uc3RyYWludE5hbWUgPyB0aGlzLmZvcm1hdHRlci53cmFwKGNvbnN0cmFpbnROYW1lKSA6IHRoaXMuZm9ybWF0dGVyLndyYXAodGhpcy50YWJsZU5hbWVSYXcgKyAnX3BrZXknKTtcbiAgICB0aGlzLnB1c2hRdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLnRhYmxlTmFtZSgpfSBkcm9wIGNvbnN0cmFpbnQgJHtjb25zdHJhaW50TmFtZX1gKTtcbiAgfSxcblxuICBpbmRleChjb2x1bW5zLCBpbmRleE5hbWUpIHtcbiAgICBpbmRleE5hbWUgPSBpbmRleE5hbWUgPyB0aGlzLmZvcm1hdHRlci53cmFwKGluZGV4TmFtZSkgOiB0aGlzLl9pbmRleENvbW1hbmQoJ2luZGV4JywgdGhpcy50YWJsZU5hbWVSYXcsIGNvbHVtbnMpO1xuICAgIHRoaXMucHVzaFF1ZXJ5KGBjcmVhdGUgaW5kZXggJHtpbmRleE5hbWV9IG9uICR7dGhpcy50YWJsZU5hbWUoKX1gICtcbiAgICAgICcgKCcgKyB0aGlzLmZvcm1hdHRlci5jb2x1bW5pemUoY29sdW1ucykgKyAnKScpO1xuICB9LFxuXG4gIGRyb3BJbmRleChjb2x1bW5zLCBpbmRleE5hbWUpIHtcbiAgICBpbmRleE5hbWUgPSBpbmRleE5hbWUgPyB0aGlzLmZvcm1hdHRlci53cmFwKGluZGV4TmFtZSkgOiB0aGlzLl9pbmRleENvbW1hbmQoJ2luZGV4JywgdGhpcy50YWJsZU5hbWVSYXcsIGNvbHVtbnMpO1xuICAgIHRoaXMucHVzaFF1ZXJ5KGBkcm9wIGluZGV4ICR7aW5kZXhOYW1lfWApO1xuICB9LFxuXG4gIHVuaXF1ZShjb2x1bW5zLCBpbmRleE5hbWUpIHtcbiAgICBpbmRleE5hbWUgPSBpbmRleE5hbWUgPyB0aGlzLmZvcm1hdHRlci53cmFwKGluZGV4TmFtZSkgOiB0aGlzLl9pbmRleENvbW1hbmQoJ3VuaXF1ZScsIHRoaXMudGFibGVOYW1lUmF3LCBjb2x1bW5zKTtcbiAgICB0aGlzLnB1c2hRdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLnRhYmxlTmFtZSgpfSBhZGQgY29uc3RyYWludCAke2luZGV4TmFtZX1gICtcbiAgICAgICcgdW5pcXVlICgnICsgdGhpcy5mb3JtYXR0ZXIuY29sdW1uaXplKGNvbHVtbnMpICsgJyknKTtcbiAgfSxcblxuICBkcm9wVW5pcXVlKGNvbHVtbnMsIGluZGV4TmFtZSkge1xuICAgIGluZGV4TmFtZSA9IGluZGV4TmFtZSA/IHRoaXMuZm9ybWF0dGVyLndyYXAoaW5kZXhOYW1lKSA6IHRoaXMuX2luZGV4Q29tbWFuZCgndW5pcXVlJywgdGhpcy50YWJsZU5hbWVSYXcsIGNvbHVtbnMpO1xuICAgIHRoaXMucHVzaFF1ZXJ5KGBhbHRlciB0YWJsZSAke3RoaXMudGFibGVOYW1lKCl9IGRyb3AgY29uc3RyYWludCAke2luZGV4TmFtZX1gKTtcbiAgfSxcblxuICBkcm9wRm9yZWlnbihjb2x1bW5zLCBpbmRleE5hbWUpIHtcbiAgICBpbmRleE5hbWUgPSBpbmRleE5hbWUgPyB0aGlzLmZvcm1hdHRlci53cmFwKGluZGV4TmFtZSkgOiB0aGlzLl9pbmRleENvbW1hbmQoJ2ZvcmVpZ24nLCB0aGlzLnRhYmxlTmFtZVJhdywgY29sdW1ucyk7XG4gICAgdGhpcy5wdXNoUXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy50YWJsZU5hbWUoKX0gZHJvcCBjb25zdHJhaW50ICR7aW5kZXhOYW1lfWApO1xuICB9XG5cbn0pXG5cbmV4cG9ydCBkZWZhdWx0IFRhYmxlQ29tcGlsZXJfT3JhY2xlO1xuIl19
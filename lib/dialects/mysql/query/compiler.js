
// MySQL Query Compiler
// ------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _queryCompiler = require('../../../query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _lodash = require('lodash');

function QueryCompiler_MySQL(client, builder) {
  _queryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_MySQL, _queryCompiler2['default']);

_lodash.assign(QueryCompiler_MySQL.prototype, {

  _emptyInsertValue: '() values ()',

  // Update method, including joins, wheres, order & limits.
  update: function update() {
    var join = this.join();
    var updates = this._prepUpdate(this.single.update);
    var where = this.where();
    var order = this.order();
    var limit = this.limit();
    return 'update ' + this.tableName + (join ? ' ' + join : '') + ' set ' + updates.join(', ') + (where ? ' ' + where : '') + (order ? ' ' + order : '') + (limit ? ' ' + limit : '');
  },

  forUpdate: function forUpdate() {
    return 'for update';
  },

  forShare: function forShare() {
    return 'lock in share mode';
  },

  // Compiles a `columnInfo` query.
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;
    return {
      sql: 'select * from information_schema.columns where table_name = ? and table_schema = ?',
      bindings: [this.single.table, this.client.database()],
      output: function output(resp) {
        var out = resp.reduce(function (columns, val) {
          columns[val.COLUMN_NAME] = {
            defaultValue: val.COLUMN_DEFAULT,
            type: val.DATA_TYPE,
            maxLength: val.CHARACTER_MAXIMUM_LENGTH,
            nullable: val.IS_NULLABLE === 'YES'
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  },

  limit: function limit() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit && !this.single.offset) return '';

    // Workaround for offset only.
    // see: http://stackoverflow.com/questions/255517/mysql-offset-infinite-rows
    var limit = this.single.offset && noLimit ? '18446744073709551615' : this.formatter.parameter(this.single.limit);
    return 'limit ' + limit;
  }

});

// Set the QueryBuilder & QueryCompiler on the client object,
// in case anyone wants to modify things to suit their own purposes.
exports['default'] = QueryCompiler_MySQL;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9teXNxbC9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7NkJBQ0wseUJBQXlCOzs7O3NCQUU1QixRQUFROztBQUUvQixTQUFTLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDNUMsNkJBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUE7Q0FDMUM7QUFDRCxzQkFBUyxtQkFBbUIsNkJBQWdCLENBQUE7O0FBRTVDLGVBQU8sbUJBQW1CLENBQUMsU0FBUyxFQUFFOztBQUVwQyxtQkFBaUIsRUFBRSxjQUFjOzs7QUFHakMsUUFBTSxFQUFBLGtCQUFHO0FBQ1AsUUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3pCLFFBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyRCxRQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDM0IsUUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzNCLFFBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQixXQUFPLFlBQVUsSUFBSSxDQUFDLFNBQVMsSUFDNUIsSUFBSSxTQUFPLElBQUksR0FBSyxFQUFFLENBQUEsQUFBQyxHQUN4QixPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFDM0IsS0FBSyxTQUFPLEtBQUssR0FBSyxFQUFFLENBQUEsQUFBQyxJQUN6QixLQUFLLFNBQU8sS0FBSyxHQUFLLEVBQUUsQ0FBQSxBQUFDLElBQ3pCLEtBQUssU0FBTyxLQUFLLEdBQUssRUFBRSxDQUFBLEFBQUMsQ0FBQztHQUM5Qjs7QUFFRCxXQUFTLEVBQUEscUJBQUc7QUFDVixXQUFPLFlBQVksQ0FBQztHQUNyQjs7QUFFRCxVQUFRLEVBQUEsb0JBQUc7QUFDVCxXQUFPLG9CQUFvQixDQUFDO0dBQzdCOzs7QUFHRCxZQUFVLEVBQUEsc0JBQUc7QUFDWCxRQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxXQUFPO0FBQ0wsU0FBRyxFQUFFLG9GQUFvRjtBQUN6RixjQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3JELFlBQU0sRUFBQSxnQkFBQyxJQUFJLEVBQUU7QUFDWCxZQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVMsT0FBTyxFQUFFLEdBQUcsRUFBRTtBQUM3QyxpQkFBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRztBQUN6Qix3QkFBWSxFQUFFLEdBQUcsQ0FBQyxjQUFjO0FBQ2hDLGdCQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVM7QUFDbkIscUJBQVMsRUFBRSxHQUFHLENBQUMsd0JBQXdCO0FBQ3ZDLG9CQUFRLEVBQUcsR0FBRyxDQUFDLFdBQVcsS0FBSyxLQUFLLEFBQUM7V0FDdEMsQ0FBQztBQUNGLGlCQUFPLE9BQU8sQ0FBQTtTQUNmLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDTixlQUFPLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDO09BQ3JDO0tBQ0YsQ0FBQztHQUNIOztBQUVELE9BQUssRUFBQSxpQkFBRztBQUNOLFFBQU0sT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO0FBQzlELFFBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7Ozs7QUFJOUMsUUFBTSxLQUFLLEdBQUcsQUFBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxPQUFPLEdBQ3hDLHNCQUFzQixHQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQy9DLHNCQUFnQixLQUFLLENBQUc7R0FDekI7O0NBRUYsQ0FBQyxDQUFBOzs7O3FCQUlhLG1CQUFtQiIsImZpbGUiOiJjb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gTXlTUUwgUXVlcnkgQ29tcGlsZXJcbi8vIC0tLS0tLVxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBRdWVyeUNvbXBpbGVyIGZyb20gJy4uLy4uLy4uL3F1ZXJ5L2NvbXBpbGVyJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBRdWVyeUNvbXBpbGVyX015U1FMKGNsaWVudCwgYnVpbGRlcikge1xuICBRdWVyeUNvbXBpbGVyLmNhbGwodGhpcywgY2xpZW50LCBidWlsZGVyKVxufVxuaW5oZXJpdHMoUXVlcnlDb21waWxlcl9NeVNRTCwgUXVlcnlDb21waWxlcilcblxuYXNzaWduKFF1ZXJ5Q29tcGlsZXJfTXlTUUwucHJvdG90eXBlLCB7XG5cbiAgX2VtcHR5SW5zZXJ0VmFsdWU6ICcoKSB2YWx1ZXMgKCknLFxuXG4gIC8vIFVwZGF0ZSBtZXRob2QsIGluY2x1ZGluZyBqb2lucywgd2hlcmVzLCBvcmRlciAmIGxpbWl0cy5cbiAgdXBkYXRlKCkge1xuICAgIGNvbnN0IGpvaW4gPSB0aGlzLmpvaW4oKTtcbiAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5fcHJlcFVwZGF0ZSh0aGlzLnNpbmdsZS51cGRhdGUpO1xuICAgIGNvbnN0IHdoZXJlID0gdGhpcy53aGVyZSgpO1xuICAgIGNvbnN0IG9yZGVyID0gdGhpcy5vcmRlcigpO1xuICAgIGNvbnN0IGxpbWl0ID0gdGhpcy5saW1pdCgpO1xuICAgIHJldHVybiBgdXBkYXRlICR7dGhpcy50YWJsZU5hbWV9YCArXG4gICAgICAoam9pbiA/IGAgJHtqb2lufWAgOiAnJykgK1xuICAgICAgJyBzZXQgJyArIHVwZGF0ZXMuam9pbignLCAnKSArXG4gICAgICAod2hlcmUgPyBgICR7d2hlcmV9YCA6ICcnKSArXG4gICAgICAob3JkZXIgPyBgICR7b3JkZXJ9YCA6ICcnKSArXG4gICAgICAobGltaXQgPyBgICR7bGltaXR9YCA6ICcnKTtcbiAgfSxcblxuICBmb3JVcGRhdGUoKSB7XG4gICAgcmV0dXJuICdmb3IgdXBkYXRlJztcbiAgfSxcblxuICBmb3JTaGFyZSgpIHtcbiAgICByZXR1cm4gJ2xvY2sgaW4gc2hhcmUgbW9kZSc7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBgY29sdW1uSW5mb2AgcXVlcnkuXG4gIGNvbHVtbkluZm8oKSB7XG4gICAgY29uc3QgY29sdW1uID0gdGhpcy5zaW5nbGUuY29sdW1uSW5mbztcbiAgICByZXR1cm4ge1xuICAgICAgc3FsOiAnc2VsZWN0ICogZnJvbSBpbmZvcm1hdGlvbl9zY2hlbWEuY29sdW1ucyB3aGVyZSB0YWJsZV9uYW1lID0gPyBhbmQgdGFibGVfc2NoZW1hID0gPycsXG4gICAgICBiaW5kaW5nczogW3RoaXMuc2luZ2xlLnRhYmxlLCB0aGlzLmNsaWVudC5kYXRhYmFzZSgpXSxcbiAgICAgIG91dHB1dChyZXNwKSB7XG4gICAgICAgIGNvbnN0IG91dCA9IHJlc3AucmVkdWNlKGZ1bmN0aW9uKGNvbHVtbnMsIHZhbCkge1xuICAgICAgICAgIGNvbHVtbnNbdmFsLkNPTFVNTl9OQU1FXSA9IHtcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogdmFsLkNPTFVNTl9ERUZBVUxULFxuICAgICAgICAgICAgdHlwZTogdmFsLkRBVEFfVFlQRSxcbiAgICAgICAgICAgIG1heExlbmd0aDogdmFsLkNIQVJBQ1RFUl9NQVhJTVVNX0xFTkdUSCxcbiAgICAgICAgICAgIG51bGxhYmxlOiAodmFsLklTX05VTExBQkxFID09PSAnWUVTJylcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiBjb2x1bW5zXG4gICAgICAgIH0sIHt9KVxuICAgICAgICByZXR1cm4gY29sdW1uICYmIG91dFtjb2x1bW5dIHx8IG91dDtcbiAgICAgIH1cbiAgICB9O1xuICB9LFxuXG4gIGxpbWl0KCkge1xuICAgIGNvbnN0IG5vTGltaXQgPSAhdGhpcy5zaW5nbGUubGltaXQgJiYgdGhpcy5zaW5nbGUubGltaXQgIT09IDA7XG4gICAgaWYgKG5vTGltaXQgJiYgIXRoaXMuc2luZ2xlLm9mZnNldCkgcmV0dXJuICcnO1xuXG4gICAgLy8gV29ya2Fyb3VuZCBmb3Igb2Zmc2V0IG9ubHkuXG4gICAgLy8gc2VlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI1NTUxNy9teXNxbC1vZmZzZXQtaW5maW5pdGUtcm93c1xuICAgIGNvbnN0IGxpbWl0ID0gKHRoaXMuc2luZ2xlLm9mZnNldCAmJiBub0xpbWl0KVxuICAgICAgPyAnMTg0NDY3NDQwNzM3MDk1NTE2MTUnXG4gICAgICA6IHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcih0aGlzLnNpbmdsZS5saW1pdClcbiAgICByZXR1cm4gYGxpbWl0ICR7bGltaXR9YDtcbiAgfVxuXG59KVxuXG4vLyBTZXQgdGhlIFF1ZXJ5QnVpbGRlciAmIFF1ZXJ5Q29tcGlsZXIgb24gdGhlIGNsaWVudCBvYmplY3QsXG4vLyBpbiBjYXNlIGFueW9uZSB3YW50cyB0byBtb2RpZnkgdGhpbmdzIHRvIHN1aXQgdGhlaXIgb3duIHB1cnBvc2VzLlxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9NeVNRTDtcbiJdfQ==
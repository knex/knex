
// PostgreSQL Query Builder & Compiler
// ------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _queryCompiler = require('../../../query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _lodash = require('lodash');

function QueryCompiler_PG(client, builder) {
  _queryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_PG, _queryCompiler2['default']);

_lodash.assign(QueryCompiler_PG.prototype, {

  // Compiles a truncate query.
  truncate: function truncate() {
    return 'truncate ' + this.tableName + ' restart identity';
  },

  // is used if the an array with multiple empty values supplied
  _defaultInsertValue: 'default',

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var sql = _queryCompiler2['default'].prototype.insert.call(this);
    if (sql === '') return sql;
    var returning = this.single.returning;

    return {
      sql: sql + this._returning(returning),
      returning: returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  update: function update() {
    var updateData = this._prepUpdate(this.single.update);
    var wheres = this.where();
    var returning = this.single.returning;

    return {
      sql: 'update ' + this.tableName + ' set ' + updateData.join(', ') + (wheres ? ' ' + wheres : '') + this._returning(returning),
      returning: returning
    };
  },

  // Compiles an `update` query, allowing for a return value.
  del: function del() {
    var sql = _queryCompiler2['default'].prototype.del.apply(this, arguments);
    var returning = this.single.returning;

    return {
      sql: sql + this._returning(returning),
      returning: returning
    };
  },

  _returning: function _returning(value) {
    return value ? ' returning ' + this.formatter.columnize(value) : '';
  },

  forUpdate: function forUpdate() {
    return 'for update';
  },

  forShare: function forShare() {
    return 'for share';
  },

  // Compiles a columnInfo query
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;

    var sql = 'select * from information_schema.columns where table_name = ? and table_catalog = ?';
    var bindings = [this.single.table, this.client.database()];

    if (this.single.schema) {
      sql += ' and table_schema = ?';
      bindings.push(this.single.schema);
    } else {
      sql += ' and table_schema = current_schema()';
    }

    return {
      sql: sql,
      bindings: bindings,
      output: function output(resp) {
        var out = _lodash.reduce(resp.rows, function (columns, val) {
          columns[val.column_name] = {
            type: val.data_type,
            maxLength: val.character_maximum_length,
            nullable: val.is_nullable === 'YES',
            defaultValue: val.column_default
          };
          return columns;
        }, {});
        return column && out[column] || out;
      }
    };
  }

});

exports['default'] = QueryCompiler_PG;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9wb3N0Z3Jlcy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7d0JBR3FCLFVBQVU7Ozs7NkJBRUwseUJBQXlCOzs7O3NCQUVwQixRQUFROztBQUV2QyxTQUFTLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDekMsNkJBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7Q0FDM0M7QUFDRCxzQkFBUyxnQkFBZ0IsNkJBQWdCLENBQUM7O0FBRTFDLGVBQU8sZ0JBQWdCLENBQUMsU0FBUyxFQUFFOzs7QUFHakMsVUFBUSxFQUFBLG9CQUFHO0FBQ1QseUJBQW1CLElBQUksQ0FBQyxTQUFTLHVCQUFvQjtHQUN0RDs7O0FBR0QscUJBQW1CLEVBQUUsU0FBUzs7OztBQUk5QixRQUFNLEVBQUEsa0JBQUc7QUFDUCxRQUFNLEdBQUcsR0FBRywyQkFBYyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNyRCxRQUFJLEdBQUcsS0FBSyxFQUFFLEVBQUUsT0FBTyxHQUFHLENBQUM7UUFDbkIsU0FBUyxHQUFLLElBQUksQ0FBQyxNQUFNLENBQXpCLFNBQVM7O0FBQ2pCLFdBQU87QUFDTCxTQUFHLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO0FBQ3JDLGVBQVMsRUFBVCxTQUFTO0tBQ1YsQ0FBQztHQUNIOzs7QUFHRCxRQUFNLEVBQUEsa0JBQUc7QUFDUCxRQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEQsUUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3BCLFNBQVMsR0FBSyxJQUFJLENBQUMsTUFBTSxDQUF6QixTQUFTOztBQUNqQixXQUFPO0FBQ0wsU0FBRyxFQUFFLFlBQVUsSUFBSSxDQUFDLFNBQVMsYUFBUSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUN6RCxNQUFNLFNBQU8sTUFBTSxHQUFLLEVBQUUsQ0FBQSxBQUFDLEdBQzVCLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDO0FBQzFCLGVBQVMsRUFBVCxTQUFTO0tBQ1YsQ0FBQztHQUNIOzs7QUFHRCxLQUFHLEVBQUEsZUFBRztBQUNKLFFBQU0sR0FBRyxHQUFHLDJCQUFjLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN2RCxTQUFTLEdBQUssSUFBSSxDQUFDLE1BQU0sQ0FBekIsU0FBUzs7QUFDakIsV0FBTztBQUNMLFNBQUcsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7QUFDckMsZUFBUyxFQUFULFNBQVM7S0FDVixDQUFDO0dBQ0g7O0FBRUQsWUFBVSxFQUFBLG9CQUFDLEtBQUssRUFBRTtBQUNoQixXQUFPLEtBQUssbUJBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFLLEVBQUUsQ0FBQztHQUNyRTs7QUFFRCxXQUFTLEVBQUEscUJBQUc7QUFDVixXQUFPLFlBQVksQ0FBQztHQUNyQjs7QUFFRCxVQUFRLEVBQUEsb0JBQUc7QUFDVCxXQUFPLFdBQVcsQ0FBQztHQUNwQjs7O0FBR0QsWUFBVSxFQUFBLHNCQUFHO0FBQ1gsUUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUM7O0FBRXRDLFFBQUksR0FBRyxHQUFHLHFGQUFxRixDQUFDO0FBQ2hHLFFBQU0sUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDOztBQUU3RCxRQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3RCLFNBQUcsSUFBSSx1QkFBdUIsQ0FBQztBQUMvQixjQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDbkMsTUFBTTtBQUNMLFNBQUcsSUFBSSxzQ0FBc0MsQ0FBQztLQUMvQzs7QUFFRCxXQUFPO0FBQ0wsU0FBRyxFQUFILEdBQUc7QUFDSCxjQUFRLEVBQVIsUUFBUTtBQUNSLFlBQU0sRUFBQSxnQkFBQyxJQUFJLEVBQUU7QUFDWCxZQUFNLEdBQUcsR0FBRyxlQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBUyxPQUFPLEVBQUUsR0FBRyxFQUFFO0FBQ25ELGlCQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHO0FBQ3pCLGdCQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVM7QUFDbkIscUJBQVMsRUFBRSxHQUFHLENBQUMsd0JBQXdCO0FBQ3ZDLG9CQUFRLEVBQUcsR0FBRyxDQUFDLFdBQVcsS0FBSyxLQUFLLEFBQUM7QUFDckMsd0JBQVksRUFBRSxHQUFHLENBQUMsY0FBYztXQUNqQyxDQUFDO0FBQ0YsaUJBQU8sT0FBTyxDQUFDO1NBQ2hCLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDUCxlQUFPLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDO09BQ3JDO0tBQ0YsQ0FBQztHQUNIOztDQUVGLENBQUMsQ0FBQTs7cUJBRWEsZ0JBQWdCIiwiZmlsZSI6ImNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBQb3N0Z3JlU1FMIFF1ZXJ5IEJ1aWxkZXIgJiBDb21waWxlclxuLy8gLS0tLS0tXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuXG5pbXBvcnQgUXVlcnlDb21waWxlciBmcm9tICcuLi8uLi8uLi9xdWVyeS9jb21waWxlcic7XG5cbmltcG9ydCB7IGFzc2lnbiwgcmVkdWNlIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBRdWVyeUNvbXBpbGVyX1BHKGNsaWVudCwgYnVpbGRlcikge1xuICBRdWVyeUNvbXBpbGVyLmNhbGwodGhpcywgY2xpZW50LCBidWlsZGVyKTtcbn1cbmluaGVyaXRzKFF1ZXJ5Q29tcGlsZXJfUEcsIFF1ZXJ5Q29tcGlsZXIpO1xuXG5hc3NpZ24oUXVlcnlDb21waWxlcl9QRy5wcm90b3R5cGUsIHtcblxuICAvLyBDb21waWxlcyBhIHRydW5jYXRlIHF1ZXJ5LlxuICB0cnVuY2F0ZSgpIHtcbiAgICByZXR1cm4gYHRydW5jYXRlICR7dGhpcy50YWJsZU5hbWV9IHJlc3RhcnQgaWRlbnRpdHlgO1xuICB9LFxuXG4gIC8vIGlzIHVzZWQgaWYgdGhlIGFuIGFycmF5IHdpdGggbXVsdGlwbGUgZW1wdHkgdmFsdWVzIHN1cHBsaWVkXG4gIF9kZWZhdWx0SW5zZXJ0VmFsdWU6ICdkZWZhdWx0JyxcblxuICAvLyBDb21waWxlcyBhbiBgaW5zZXJ0YCBxdWVyeSwgYWxsb3dpbmcgZm9yIG11bHRpcGxlXG4gIC8vIGluc2VydHMgdXNpbmcgYSBzaW5nbGUgcXVlcnkgc3RhdGVtZW50LlxuICBpbnNlcnQoKSB7XG4gICAgY29uc3Qgc3FsID0gUXVlcnlDb21waWxlci5wcm90b3R5cGUuaW5zZXJ0LmNhbGwodGhpcylcbiAgICBpZiAoc3FsID09PSAnJykgcmV0dXJuIHNxbDtcbiAgICBjb25zdCB7IHJldHVybmluZyB9ID0gdGhpcy5zaW5nbGU7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbDogc3FsICsgdGhpcy5fcmV0dXJuaW5nKHJldHVybmluZyksXG4gICAgICByZXR1cm5pbmdcbiAgICB9O1xuICB9LFxuXG4gIC8vIENvbXBpbGVzIGFuIGB1cGRhdGVgIHF1ZXJ5LCBhbGxvd2luZyBmb3IgYSByZXR1cm4gdmFsdWUuXG4gIHVwZGF0ZSgpIHtcbiAgICBjb25zdCB1cGRhdGVEYXRhID0gdGhpcy5fcHJlcFVwZGF0ZSh0aGlzLnNpbmdsZS51cGRhdGUpO1xuICAgIGNvbnN0IHdoZXJlcyA9IHRoaXMud2hlcmUoKTtcbiAgICBjb25zdCB7IHJldHVybmluZyB9ID0gdGhpcy5zaW5nbGU7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbDogYHVwZGF0ZSAke3RoaXMudGFibGVOYW1lfSBzZXQgJHt1cGRhdGVEYXRhLmpvaW4oJywgJyl9YCArXG4gICAgICAod2hlcmVzID8gYCAke3doZXJlc31gIDogJycpICtcbiAgICAgIHRoaXMuX3JldHVybmluZyhyZXR1cm5pbmcpLFxuICAgICAgcmV0dXJuaW5nXG4gICAgfTtcbiAgfSxcblxuICAvLyBDb21waWxlcyBhbiBgdXBkYXRlYCBxdWVyeSwgYWxsb3dpbmcgZm9yIGEgcmV0dXJuIHZhbHVlLlxuICBkZWwoKSB7XG4gICAgY29uc3Qgc3FsID0gUXVlcnlDb21waWxlci5wcm90b3R5cGUuZGVsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgY29uc3QgeyByZXR1cm5pbmcgfSA9IHRoaXMuc2luZ2xlO1xuICAgIHJldHVybiB7XG4gICAgICBzcWw6IHNxbCArIHRoaXMuX3JldHVybmluZyhyZXR1cm5pbmcpLFxuICAgICAgcmV0dXJuaW5nXG4gICAgfTtcbiAgfSxcblxuICBfcmV0dXJuaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID8gYCByZXR1cm5pbmcgJHt0aGlzLmZvcm1hdHRlci5jb2x1bW5pemUodmFsdWUpfWAgOiAnJztcbiAgfSxcblxuICBmb3JVcGRhdGUoKSB7XG4gICAgcmV0dXJuICdmb3IgdXBkYXRlJztcbiAgfSxcblxuICBmb3JTaGFyZSgpIHtcbiAgICByZXR1cm4gJ2ZvciBzaGFyZSc7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBjb2x1bW5JbmZvIHF1ZXJ5XG4gIGNvbHVtbkluZm8oKSB7XG4gICAgY29uc3QgY29sdW1uID0gdGhpcy5zaW5nbGUuY29sdW1uSW5mbztcblxuICAgIGxldCBzcWwgPSAnc2VsZWN0ICogZnJvbSBpbmZvcm1hdGlvbl9zY2hlbWEuY29sdW1ucyB3aGVyZSB0YWJsZV9uYW1lID0gPyBhbmQgdGFibGVfY2F0YWxvZyA9ID8nO1xuICAgIGNvbnN0IGJpbmRpbmdzID0gW3RoaXMuc2luZ2xlLnRhYmxlLCB0aGlzLmNsaWVudC5kYXRhYmFzZSgpXTtcblxuICAgIGlmICh0aGlzLnNpbmdsZS5zY2hlbWEpIHtcbiAgICAgIHNxbCArPSAnIGFuZCB0YWJsZV9zY2hlbWEgPSA/JztcbiAgICAgIGJpbmRpbmdzLnB1c2godGhpcy5zaW5nbGUuc2NoZW1hKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3FsICs9ICcgYW5kIHRhYmxlX3NjaGVtYSA9IGN1cnJlbnRfc2NoZW1hKCknO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzcWwsXG4gICAgICBiaW5kaW5ncyxcbiAgICAgIG91dHB1dChyZXNwKSB7XG4gICAgICAgIGNvbnN0IG91dCA9IHJlZHVjZShyZXNwLnJvd3MsIGZ1bmN0aW9uKGNvbHVtbnMsIHZhbCkge1xuICAgICAgICAgIGNvbHVtbnNbdmFsLmNvbHVtbl9uYW1lXSA9IHtcbiAgICAgICAgICAgIHR5cGU6IHZhbC5kYXRhX3R5cGUsXG4gICAgICAgICAgICBtYXhMZW5ndGg6IHZhbC5jaGFyYWN0ZXJfbWF4aW11bV9sZW5ndGgsXG4gICAgICAgICAgICBudWxsYWJsZTogKHZhbC5pc19udWxsYWJsZSA9PT0gJ1lFUycpLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiB2YWwuY29sdW1uX2RlZmF1bHRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJldHVybiBjb2x1bW5zO1xuICAgICAgICB9LCB7fSk7XG4gICAgICAgIHJldHVybiBjb2x1bW4gJiYgb3V0W2NvbHVtbl0gfHwgb3V0O1xuICAgICAgfVxuICAgIH07XG4gIH1cblxufSlcblxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9QRztcbiJdfQ==
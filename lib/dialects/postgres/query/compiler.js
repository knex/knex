
// PostgreSQL Query Builder & Compiler
// ------
'use strict';

var _ = require('lodash');
var inherits = require('inherits');

var QueryCompiler = require('../../../query/compiler');
var assign = require('lodash/object/assign');

function QueryCompiler_PG(client, builder) {
  QueryCompiler.call(this, client, builder);
}
inherits(QueryCompiler_PG, QueryCompiler);

assign(QueryCompiler_PG.prototype, {

  // Compiles a truncate query.
  truncate: function truncate() {
    return 'truncate ' + this.tableName + ' restart identity';
  },

  // is used if the an array with multiple empty values supplied
  _defaultInsertValue: 'default',

  // Compiles an `insert` query, allowing for multiple
  // inserts using a single query statement.
  insert: function insert() {
    var sql = QueryCompiler.prototype.insert.call(this);
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
    var sql = QueryCompiler.prototype.del.apply(this, arguments);
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
      sql += ' and table_schema = current_schema';
    }

    return {
      sql: sql,
      bindings: bindings,
      output: function output(resp) {
        var out = _.reduce(resp.rows, function (columns, val) {
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

module.exports = QueryCompiler_PG;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9wb3N0Z3Jlcy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUdBLElBQUksQ0FBQyxHQUFVLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRW5DLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3ZELElBQUksTUFBTSxHQUFVLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDOztBQUVwRCxTQUFTLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDekMsZUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQzNDO0FBQ0QsUUFBUSxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDOztBQUUxQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFOzs7QUFHakMsVUFBUSxFQUFFLG9CQUFXO0FBQ25CLFdBQU8sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsbUJBQW1CLENBQUM7R0FDM0Q7OztBQUdELHFCQUFtQixFQUFFLFNBQVM7Ozs7QUFJOUIsUUFBTSxFQUFFLGtCQUFXO0FBQ2pCLFFBQUksR0FBRyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNuRCxRQUFJLEdBQUcsS0FBSyxFQUFFLEVBQUUsT0FBTyxHQUFHLENBQUM7QUFDM0IsUUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDdEMsV0FBTztBQUNMLFNBQUcsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUM7QUFDckMsZUFBUyxFQUFFLFNBQVM7S0FDckIsQ0FBQztHQUNIOzs7QUFHRCxRQUFNLEVBQUUsa0JBQVc7QUFDakIsUUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RELFFBQUksTUFBTSxHQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUM5QixRQUFJLFNBQVMsR0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUN2QyxXQUFPO0FBQ0wsU0FBRyxFQUFFLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUNoRSxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUEsQUFBQyxHQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztBQUMxQixlQUFTLEVBQUUsU0FBUztLQUNyQixDQUFDO0dBQ0g7OztBQUdELEtBQUcsRUFBRSxlQUFXO0FBQ2QsUUFBSSxHQUFHLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM3RCxRQUFJLFNBQVMsR0FBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUN2QyxXQUFPO0FBQ0wsU0FBRyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztBQUNyQyxlQUFTLEVBQUUsU0FBUztLQUNyQixDQUFDO0dBQ0g7O0FBRUQsWUFBVSxFQUFFLG9CQUFTLEtBQUssRUFBRTtBQUMxQixXQUFPLEtBQUssR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO0dBQ3JFOztBQUVELFdBQVMsRUFBRSxxQkFBVztBQUNwQixXQUFPLFlBQVksQ0FBQztHQUNyQjs7QUFFRCxVQUFRLEVBQUUsb0JBQVc7QUFDbkIsV0FBTyxXQUFXLENBQUM7R0FDcEI7OztBQUdELFlBQVUsRUFBRSxzQkFBVztBQUNyQixRQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQzs7QUFFcEMsUUFBSSxHQUFHLEdBQUcscUZBQXFGLENBQUM7QUFDaEcsUUFBSSxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7O0FBRTNELFFBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDdEIsU0FBRyxJQUFJLHVCQUF1QixDQUFDO0FBQy9CLGNBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNuQyxNQUFNO0FBQ0wsU0FBRyxJQUFJLG9DQUFvQyxDQUFDO0tBQzdDOztBQUVELFdBQU87QUFDTCxTQUFHLEVBQUUsR0FBRztBQUNSLGNBQVEsRUFBRSxRQUFRO0FBQ2xCLFlBQU0sRUFBRSxnQkFBUyxJQUFJLEVBQUU7QUFDckIsWUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsT0FBTyxFQUFFLEdBQUcsRUFBRTtBQUNuRCxpQkFBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRztBQUN6QixnQkFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTO0FBQ25CLHFCQUFTLEVBQUUsR0FBRyxDQUFDLHdCQUF3QjtBQUN2QyxvQkFBUSxFQUFHLEdBQUcsQ0FBQyxXQUFXLEtBQUssS0FBSyxBQUFDO0FBQ3JDLHdCQUFZLEVBQUUsR0FBRyxDQUFDLGNBQWM7V0FDakMsQ0FBQztBQUNGLGlCQUFPLE9BQU8sQ0FBQztTQUNoQixFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1AsZUFBTyxNQUFNLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQztPQUNyQztLQUNGLENBQUM7R0FDSDs7Q0FFRixDQUFDLENBQUE7O0FBRUYsTUFBTSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyIsImZpbGUiOiJjb21waWxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gUG9zdGdyZVNRTCBRdWVyeSBCdWlsZGVyICYgQ29tcGlsZXJcbi8vIC0tLS0tLVxudmFyIF8gICAgICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG52YXIgUXVlcnlDb21waWxlciA9IHJlcXVpcmUoJy4uLy4uLy4uL3F1ZXJ5L2NvbXBpbGVyJyk7XG52YXIgYXNzaWduICAgICAgICA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvYXNzaWduJyk7XG5cbmZ1bmN0aW9uIFF1ZXJ5Q29tcGlsZXJfUEcoY2xpZW50LCBidWlsZGVyKSB7XG4gIFF1ZXJ5Q29tcGlsZXIuY2FsbCh0aGlzLCBjbGllbnQsIGJ1aWxkZXIpO1xufVxuaW5oZXJpdHMoUXVlcnlDb21waWxlcl9QRywgUXVlcnlDb21waWxlcik7XG5cbmFzc2lnbihRdWVyeUNvbXBpbGVyX1BHLnByb3RvdHlwZSwge1xuXG4gIC8vIENvbXBpbGVzIGEgdHJ1bmNhdGUgcXVlcnkuXG4gIHRydW5jYXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ3RydW5jYXRlICcgKyB0aGlzLnRhYmxlTmFtZSArICcgcmVzdGFydCBpZGVudGl0eSc7XG4gIH0sXG5cbiAgLy8gaXMgdXNlZCBpZiB0aGUgYW4gYXJyYXkgd2l0aCBtdWx0aXBsZSBlbXB0eSB2YWx1ZXMgc3VwcGxpZWRcbiAgX2RlZmF1bHRJbnNlcnRWYWx1ZTogJ2RlZmF1bHQnLFxuXG4gIC8vIENvbXBpbGVzIGFuIGBpbnNlcnRgIHF1ZXJ5LCBhbGxvd2luZyBmb3IgbXVsdGlwbGVcbiAgLy8gaW5zZXJ0cyB1c2luZyBhIHNpbmdsZSBxdWVyeSBzdGF0ZW1lbnQuXG4gIGluc2VydDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNxbCA9IFF1ZXJ5Q29tcGlsZXIucHJvdG90eXBlLmluc2VydC5jYWxsKHRoaXMpXG4gICAgaWYgKHNxbCA9PT0gJycpIHJldHVybiBzcWw7XG4gICAgdmFyIHJldHVybmluZyA9IHRoaXMuc2luZ2xlLnJldHVybmluZztcbiAgICByZXR1cm4ge1xuICAgICAgc3FsOiBzcWwgKyB0aGlzLl9yZXR1cm5pbmcocmV0dXJuaW5nKSxcbiAgICAgIHJldHVybmluZzogcmV0dXJuaW5nXG4gICAgfTtcbiAgfSxcblxuICAvLyBDb21waWxlcyBhbiBgdXBkYXRlYCBxdWVyeSwgYWxsb3dpbmcgZm9yIGEgcmV0dXJuIHZhbHVlLlxuICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB1cGRhdGVEYXRhID0gdGhpcy5fcHJlcFVwZGF0ZSh0aGlzLnNpbmdsZS51cGRhdGUpO1xuICAgIHZhciB3aGVyZXMgICAgID0gdGhpcy53aGVyZSgpO1xuICAgIHZhciByZXR1cm5pbmcgID0gdGhpcy5zaW5nbGUucmV0dXJuaW5nO1xuICAgIHJldHVybiB7XG4gICAgICBzcWw6ICd1cGRhdGUgJyArIHRoaXMudGFibGVOYW1lICsgJyBzZXQgJyArIHVwZGF0ZURhdGEuam9pbignLCAnKSArXG4gICAgICAod2hlcmVzID8gJyAnICsgd2hlcmVzIDogJycpICtcbiAgICAgIHRoaXMuX3JldHVybmluZyhyZXR1cm5pbmcpLFxuICAgICAgcmV0dXJuaW5nOiByZXR1cm5pbmdcbiAgICB9O1xuICB9LFxuXG4gIC8vIENvbXBpbGVzIGFuIGB1cGRhdGVgIHF1ZXJ5LCBhbGxvd2luZyBmb3IgYSByZXR1cm4gdmFsdWUuXG4gIGRlbDogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNxbCA9IFF1ZXJ5Q29tcGlsZXIucHJvdG90eXBlLmRlbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIHZhciByZXR1cm5pbmcgID0gdGhpcy5zaW5nbGUucmV0dXJuaW5nO1xuICAgIHJldHVybiB7XG4gICAgICBzcWw6IHNxbCArIHRoaXMuX3JldHVybmluZyhyZXR1cm5pbmcpLFxuICAgICAgcmV0dXJuaW5nOiByZXR1cm5pbmdcbiAgICB9O1xuICB9LFxuXG4gIF9yZXR1cm5pbmc6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID8gJyByZXR1cm5pbmcgJyArIHRoaXMuZm9ybWF0dGVyLmNvbHVtbml6ZSh2YWx1ZSkgOiAnJztcbiAgfSxcblxuICBmb3JVcGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnZm9yIHVwZGF0ZSc7XG4gIH0sXG5cbiAgZm9yU2hhcmU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnZm9yIHNoYXJlJztcbiAgfSxcblxuICAvLyBDb21waWxlcyBhIGNvbHVtbkluZm8gcXVlcnlcbiAgY29sdW1uSW5mbzogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbHVtbiA9IHRoaXMuc2luZ2xlLmNvbHVtbkluZm87XG5cbiAgICB2YXIgc3FsID0gJ3NlbGVjdCAqIGZyb20gaW5mb3JtYXRpb25fc2NoZW1hLmNvbHVtbnMgd2hlcmUgdGFibGVfbmFtZSA9ID8gYW5kIHRhYmxlX2NhdGFsb2cgPSA/JztcbiAgICB2YXIgYmluZGluZ3MgPSBbdGhpcy5zaW5nbGUudGFibGUsIHRoaXMuY2xpZW50LmRhdGFiYXNlKCldO1xuXG4gICAgaWYgKHRoaXMuc2luZ2xlLnNjaGVtYSkge1xuICAgICAgc3FsICs9ICcgYW5kIHRhYmxlX3NjaGVtYSA9ID8nO1xuICAgICAgYmluZGluZ3MucHVzaCh0aGlzLnNpbmdsZS5zY2hlbWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzcWwgKz0gJyBhbmQgdGFibGVfc2NoZW1hID0gY3VycmVudF9zY2hlbWEnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzcWw6IHNxbCxcbiAgICAgIGJpbmRpbmdzOiBiaW5kaW5ncyxcbiAgICAgIG91dHB1dDogZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICB2YXIgb3V0ID0gXy5yZWR1Y2UocmVzcC5yb3dzLCBmdW5jdGlvbihjb2x1bW5zLCB2YWwpIHtcbiAgICAgICAgICBjb2x1bW5zW3ZhbC5jb2x1bW5fbmFtZV0gPSB7XG4gICAgICAgICAgICB0eXBlOiB2YWwuZGF0YV90eXBlLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiB2YWwuY2hhcmFjdGVyX21heGltdW1fbGVuZ3RoLFxuICAgICAgICAgICAgbnVsbGFibGU6ICh2YWwuaXNfbnVsbGFibGUgPT09ICdZRVMnKSxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogdmFsLmNvbHVtbl9kZWZhdWx0XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICAgICAgfSwge30pO1xuICAgICAgICByZXR1cm4gY29sdW1uICYmIG91dFtjb2x1bW5dIHx8IG91dDtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbn0pXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlDb21waWxlcl9QRztcbiJdfQ==
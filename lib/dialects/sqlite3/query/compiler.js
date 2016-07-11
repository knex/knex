
// SQLite3 Query Builder & Compiler

'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _queryCompiler = require('../../../query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _lodash = require('lodash');

function QueryCompiler_SQLite3(client, builder) {
  _queryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_SQLite3, _queryCompiler2['default']);

_lodash.assign(QueryCompiler_SQLite3.prototype, {

  // The locks are not applicable in SQLite3
  forShare: emptyStr,

  forUpdate: emptyStr,

  // SQLite requires us to build the multi-row insert as a listing of select with
  // unions joining them together. So we'll build out this list of columns and
  // then join them all together with select unions to complete the queries.
  insert: function insert() {
    var insertValues = this.single.insert || [];
    var sql = 'insert into ' + this.tableName + ' ';

    if (Array.isArray(insertValues)) {
      if (insertValues.length === 0) {
        return '';
      } else if (insertValues.length === 1 && insertValues[0] && _lodash.isEmpty(insertValues[0])) {
        return sql + this._emptyInsertValue;
      }
    } else if (typeof insertValues === 'object' && _lodash.isEmpty(insertValues)) {
      return sql + this._emptyInsertValue;
    }

    var insertData = this._prepInsert(insertValues);

    if (_lodash.isString(insertData)) {
      return sql + insertData;
    }

    if (insertData.columns.length === 0) {
      return '';
    }

    sql += '(' + this.formatter.columnize(insertData.columns) + ')';

    // backwards compatible error
    if (this.client.valueForUndefined !== null) {
      _lodash.each(insertData.values, function (bindings) {
        _lodash.each(bindings, function (binding) {
          if (binding === undefined) throw new TypeError('`sqlite` does not support inserting default values. Specify ' + 'values explicitly or use the `useNullAsDefault` config flag. ' + '(see docs http://knexjs.org/#Builder-insert).');
        });
      });
    }

    if (insertData.values.length === 1) {
      var parameters = this.formatter.parameterize(insertData.values[0], this.client.valueForUndefined);
      return sql + (' values (' + parameters + ')');
    }

    var blocks = [];
    var i = -1;
    while (++i < insertData.values.length) {
      var i2 = -1;
      var block = blocks[i] = [];
      var current = insertData.values[i];
      current = current === undefined ? this.client.valueForUndefined : current;
      while (++i2 < insertData.columns.length) {
        block.push(this.formatter.alias(this.formatter.parameter(current[i2]), this.formatter.wrap(insertData.columns[i2])));
      }
      blocks[i] = block.join(', ');
    }
    return sql + ' select ' + blocks.join(' union all select ');
  },

  // Compile a truncate table statement into SQL.
  truncate: function truncate() {
    var table = this.tableName;
    return {
      sql: 'delete from ' + table,
      output: function output() {
        return this.query({
          sql: 'delete from sqlite_sequence where name = ' + table
        })['catch'](_lodash.noop);
      }
    };
  },

  // Compiles a `columnInfo` query
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;
    return {
      sql: 'PRAGMA table_info(' + this.single.table + ')',
      output: function output(resp) {
        var maxLengthRegex = /.*\((\d+)\)/;
        var out = _lodash.reduce(resp, function (columns, val) {
          var type = val.type;

          var maxLength = (maxLength = type.match(maxLengthRegex)) && maxLength[1];
          type = maxLength ? type.split('(')[0] : type;
          columns[val.name] = {
            type: type.toLowerCase(),
            maxLength: maxLength,
            nullable: !val.notnull,
            defaultValue: val.dflt_value
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

    // Workaround for offset only,
    // see http://stackoverflow.com/questions/10491492/sqllite-with-skip-offset-only-not-limit
    return 'limit ' + this.formatter.parameter(noLimit ? -1 : this.single.limit);
  }

});

function emptyStr() {
  return '';
}

exports['default'] = QueryCompiler_SQLite3;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9zcWxpdGUzL3F1ZXJ5L2NvbXBpbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozt3QkFHcUIsVUFBVTs7Ozs2QkFDTCx5QkFBeUI7Ozs7c0JBQ1csUUFBUTs7QUFFdEUsU0FBUyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQzlDLDZCQUFjLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0NBQzFDO0FBQ0Qsc0JBQVMscUJBQXFCLDZCQUFnQixDQUFBOztBQUU5QyxlQUFPLHFCQUFxQixDQUFDLFNBQVMsRUFBRTs7O0FBR3RDLFVBQVEsRUFBRyxRQUFROztBQUVuQixXQUFTLEVBQUUsUUFBUTs7Ozs7QUFLbkIsUUFBTSxFQUFBLGtCQUFHO0FBQ1AsUUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFBO0FBQzdDLFFBQUksR0FBRyxvQkFBa0IsSUFBSSxDQUFDLFNBQVMsTUFBRyxDQUFBOztBQUUxQyxRQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7QUFDL0IsVUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUM3QixlQUFPLEVBQUUsQ0FBQTtPQUNWLE1BQ0ksSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksZ0JBQVEsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDakYsZUFBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFBO09BQ3BDO0tBQ0YsTUFBTSxJQUFJLE9BQU8sWUFBWSxLQUFLLFFBQVEsSUFBSSxnQkFBUSxZQUFZLENBQUMsRUFBRTtBQUNwRSxhQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUE7S0FDcEM7O0FBRUQsUUFBTSxVQUFVLEdBQUcsSUFB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QUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBRTtHQUM3RTs7Q0FFRixDQUFDLENBQUE7O0FBRUYsU0FBUyxRQUFRLEdBQUc7QUFDbEIsU0FBTyxFQUFFLENBQUE7Q0FDVjs7cUJBR2MscUJBQXFCIiwiZmlsZSI6ImNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBTUUxpdGUzIFF1ZXJ5IEJ1aWxkZXIgJiBDb21waWxlclxuXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi4vLi4vLi4vcXVlcnkvY29tcGlsZXInO1xuaW1wb3J0IHsgYXNzaWduLCBlYWNoLCBpc0VtcHR5LCBpc1N0cmluZywgbm9vcCwgcmVkdWNlIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBRdWVyeUNvbXBpbGVyX1NRTGl0ZTMoY2xpZW50LCBidWlsZGVyKSB7XG4gIFF1ZXJ5Q29tcGlsZXIuY2FsbCh0aGlzLCBjbGllbnQsIGJ1aWxkZXIpXG59XG5pbmhlcml0cyhRdWVyeUNvbXBpbGVyX1NRTGl0ZTMsIFF1ZXJ5Q29tcGlsZXIpXG5cbmFzc2lnbihRdWVyeUNvbXBpbGVyX1NRTGl0ZTMucHJvdG90eXBlLCB7XG5cbiAgLy8gVGhlIGxvY2tzIGFyZSBub3QgYXBwbGljYWJsZSBpbiBTUUxpdGUzXG4gIGZvclNoYXJlOiAgZW1wdHlTdHIsXG5cbiAgZm9yVXBkYXRlOiBlbXB0eVN0cixcblxuICAvLyBTUUxpdGUgcmVxdWlyZXMgdXMgdG8gYnVpbGQgdGhlIG11bHRpLXJvdyBpbnNlcnQgYXMgYSBsaXN0aW5nIG9mIHNlbGVjdCB3aXRoXG4gIC8vIHVuaW9ucyBqb2luaW5nIHRoZW0gdG9nZXRoZXIuIFNvIHdlJ2xsIGJ1aWxkIG91dCB0aGlzIGxpc3Qgb2YgY29sdW1ucyBhbmRcbiAgLy8gdGhlbiBqb2luIHRoZW0gYWxsIHRvZ2V0aGVyIHdpdGggc2VsZWN0IHVuaW9ucyB0byBjb21wbGV0ZSB0aGUgcXVlcmllcy5cbiAgaW5zZXJ0KCkge1xuICAgIGNvbnN0IGluc2VydFZhbHVlcyA9IHRoaXMuc2luZ2xlLmluc2VydCB8fCBbXVxuICAgIGxldCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0aGlzLnRhYmxlTmFtZX0gYFxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5zZXJ0VmFsdWVzKSkge1xuICAgICAgaWYgKGluc2VydFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuICcnXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChpbnNlcnRWYWx1ZXMubGVuZ3RoID09PSAxICYmIGluc2VydFZhbHVlc1swXSAmJiBpc0VtcHR5KGluc2VydFZhbHVlc1swXSkpIHtcbiAgICAgICAgcmV0dXJuIHNxbCArIHRoaXMuX2VtcHR5SW5zZXJ0VmFsdWVcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnNlcnRWYWx1ZXMgPT09ICdvYmplY3QnICYmIGlzRW1wdHkoaW5zZXJ0VmFsdWVzKSkge1xuICAgICAgcmV0dXJuIHNxbCArIHRoaXMuX2VtcHR5SW5zZXJ0VmFsdWVcbiAgICB9XG5cbiAgICBjb25zdCBpbnNlcnREYXRhID0gdGhpcy5fcHJlcEluc2VydChpbnNlcnRWYWx1ZXMpXG5cbiAgICBpZiAoaXNTdHJpbmcoaW5zZXJ0RGF0YSkpIHtcbiAgICAgIHJldHVybiBzcWwgKyBpbnNlcnREYXRhXG4gICAgfVxuXG4gICAgaWYgKGluc2VydERhdGEuY29sdW1ucy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG5cbiAgICBzcWwgKz0gYCgke3RoaXMuZm9ybWF0dGVyLmNvbHVtbml6ZShpbnNlcnREYXRhLmNvbHVtbnMpfSlgXG5cbiAgICAvLyBiYWNrd2FyZHMgY29tcGF0aWJsZSBlcnJvclxuICAgIGlmICh0aGlzLmNsaWVudC52YWx1ZUZvclVuZGVmaW5lZCAhPT0gbnVsbCkge1xuICAgICAgZWFjaChpbnNlcnREYXRhLnZhbHVlcywgYmluZGluZ3MgPT4ge1xuICAgICAgICBlYWNoKGJpbmRpbmdzLCBiaW5kaW5nID0+IHtcbiAgICAgICAgICBpZiAoYmluZGluZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICAgJ2BzcWxpdGVgIGRvZXMgbm90IHN1cHBvcnQgaW5zZXJ0aW5nIGRlZmF1bHQgdmFsdWVzLiBTcGVjaWZ5ICcgK1xuICAgICAgICAgICAgJ3ZhbHVlcyBleHBsaWNpdGx5IG9yIHVzZSB0aGUgYHVzZU51bGxBc0RlZmF1bHRgIGNvbmZpZyBmbGFnLiAnICtcbiAgICAgICAgICAgICcoc2VlIGRvY3MgaHR0cDovL2tuZXhqcy5vcmcvI0J1aWxkZXItaW5zZXJ0KS4nXG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoaW5zZXJ0RGF0YS52YWx1ZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICBjb25zdCBwYXJhbWV0ZXJzID0gdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyaXplKFxuICAgICAgICBpbnNlcnREYXRhLnZhbHVlc1swXSwgdGhpcy5jbGllbnQudmFsdWVGb3JVbmRlZmluZWRcbiAgICAgICk7XG4gICAgICByZXR1cm4gc3FsICsgYCB2YWx1ZXMgKCR7cGFyYW1ldGVyc30pYFxuICAgIH1cblxuICAgIGNvbnN0IGJsb2NrcyA9IFtdXG4gICAgbGV0IGkgPSAtMVxuICAgIHdoaWxlICgrK2kgPCBpbnNlcnREYXRhLnZhbHVlcy5sZW5ndGgpIHtcbiAgICAgIGxldCBpMiA9IC0xO1xuICAgICAgY29uc3QgYmxvY2sgPSBibG9ja3NbaV0gPSBbXTtcbiAgICAgIGxldCBjdXJyZW50ID0gaW5zZXJ0RGF0YS52YWx1ZXNbaV1cbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50ID09PSB1bmRlZmluZWQgPyB0aGlzLmNsaWVudC52YWx1ZUZvclVuZGVmaW5lZCA6IGN1cnJlbnRcbiAgICAgIHdoaWxlICgrK2kyIDwgaW5zZXJ0RGF0YS5jb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICBibG9jay5wdXNoKHRoaXMuZm9ybWF0dGVyLmFsaWFzKFxuICAgICAgICAgIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcihjdXJyZW50W2kyXSksXG4gICAgICAgICAgdGhpcy5mb3JtYXR0ZXIud3JhcChpbnNlcnREYXRhLmNvbHVtbnNbaTJdKVxuICAgICAgICApKVxuICAgICAgfVxuICAgICAgYmxvY2tzW2ldID0gYmxvY2suam9pbignLCAnKVxuICAgIH1cbiAgICByZXR1cm4gc3FsICsgJyBzZWxlY3QgJyArIGJsb2Nrcy5qb2luKCcgdW5pb24gYWxsIHNlbGVjdCAnKVxuICB9LFxuXG4gIC8vIENvbXBpbGUgYSB0cnVuY2F0ZSB0YWJsZSBzdGF0ZW1lbnQgaW50byBTUUwuXG4gIHRydW5jYXRlKCkge1xuICAgIGNvbnN0IHRhYmxlID0gdGhpcy50YWJsZU5hbWVcbiAgICByZXR1cm4ge1xuICAgICAgc3FsOiBgZGVsZXRlIGZyb20gJHt0YWJsZX1gLFxuICAgICAgb3V0cHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWVyeSh7XG4gICAgICAgICAgc3FsOiBgZGVsZXRlIGZyb20gc3FsaXRlX3NlcXVlbmNlIHdoZXJlIG5hbWUgPSAke3RhYmxlfWBcbiAgICAgICAgfSkuY2F0Y2gobm9vcClcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gQ29tcGlsZXMgYSBgY29sdW1uSW5mb2AgcXVlcnlcbiAgY29sdW1uSW5mbygpIHtcbiAgICBjb25zdCBjb2x1bW4gPSB0aGlzLnNpbmdsZS5jb2x1bW5JbmZvXG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbDogYFBSQUdNQSB0YWJsZV9pbmZvKCR7dGhpcy5zaW5nbGUudGFibGV9KWAsXG4gICAgICBvdXRwdXQocmVzcCkge1xuICAgICAgICBjb25zdCBtYXhMZW5ndGhSZWdleCA9IC8uKlxcKChcXGQrKVxcKS9cbiAgICAgICAgY29uc3Qgb3V0ID0gcmVkdWNlKHJlc3AsIGZ1bmN0aW9uIChjb2x1bW5zLCB2YWwpIHtcbiAgICAgICAgICBsZXQgeyB0eXBlIH0gPSB2YWxcbiAgICAgICAgICBsZXQgbWF4TGVuZ3RoID0gKG1heExlbmd0aCA9IHR5cGUubWF0Y2gobWF4TGVuZ3RoUmVnZXgpKSAmJiBtYXhMZW5ndGhbMV1cbiAgICAgICAgICB0eXBlID0gbWF4TGVuZ3RoID8gdHlwZS5zcGxpdCgnKCcpWzBdIDogdHlwZVxuICAgICAgICAgIGNvbHVtbnNbdmFsLm5hbWVdID0ge1xuICAgICAgICAgICAgdHlwZTogdHlwZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgbWF4TGVuZ3RoLFxuICAgICAgICAgICAgbnVsbGFibGU6ICF2YWwubm90bnVsbCxcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogdmFsLmRmbHRfdmFsdWVcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGNvbHVtbnNcbiAgICAgICAgfSwge30pXG4gICAgICAgIHJldHVybiBjb2x1bW4gJiYgb3V0W2NvbHVtbl0gfHwgb3V0XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGxpbWl0KCkge1xuICAgIGNvbnN0IG5vTGltaXQgPSAhdGhpcy5zaW5nbGUubGltaXQgJiYgdGhpcy5zaW5nbGUubGltaXQgIT09IDBcbiAgICBpZiAobm9MaW1pdCAmJiAhdGhpcy5zaW5nbGUub2Zmc2V0KSByZXR1cm4gJydcblxuICAgIC8vIFdvcmthcm91bmQgZm9yIG9mZnNldCBvbmx5LFxuICAgIC8vIHNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNDkxNDkyL3NxbGxpdGUtd2l0aC1za2lwLW9mZnNldC1vbmx5LW5vdC1saW1pdFxuICAgIHJldHVybiBgbGltaXQgJHt0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIobm9MaW1pdCA/IC0xIDogdGhpcy5zaW5nbGUubGltaXQpfWBcbiAgfVxuXG59KVxuXG5mdW5jdGlvbiBlbXB0eVN0cigpIHtcbiAgcmV0dXJuICcnXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgUXVlcnlDb21waWxlcl9TUUxpdGUzXG4iXX0=
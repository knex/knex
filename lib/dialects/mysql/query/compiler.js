'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../../query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// MySQL Query Compiler
// ------
function QueryCompiler_MySQL(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_MySQL, _compiler2.default);

(0, _assign3.default)(QueryCompiler_MySQL.prototype, {

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
exports.default = QueryCompiler_MySQL;
module.exports = exports['default'];
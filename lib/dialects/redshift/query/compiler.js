'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../postgres/query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Redshift Query Builder & Compiler
// ------
function QueryCompiler_Redshift(client, builder) {
  _compiler2.default.call(this, client, builder);
}
(0, _inherits2.default)(QueryCompiler_Redshift, _compiler2.default);

(0, _assign3.default)(QueryCompiler_Redshift.prototype, {
  truncate: function truncate() {
    return 'truncate ' + this.tableName;
  },
  _returning: function _returning(value) {
    return '';
  }
});

exports.default = QueryCompiler_Redshift;
module.exports = exports['default'];
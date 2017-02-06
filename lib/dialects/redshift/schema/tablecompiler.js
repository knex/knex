'use strict';

exports.__esModule = true;

var _helpers = require('../../../helpers');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tablecompiler = require('../../postgres/schema/tablecompiler');

var _tablecompiler2 = _interopRequireDefault(_tablecompiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function TableCompiler_Redshift() {
  _tablecompiler2.default.apply(this, arguments);
} /* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

(0, _inherits2.default)(TableCompiler_Redshift, _tablecompiler2.default);

TableCompiler_Redshift.prototype.index = function (columns, indexName, indexType) {
  (0, _helpers.warn)('Redshift does not support the creation of indexes.');
};
TableCompiler_Redshift.prototype.dropIndex = function (columns, indexName) {
  (0, _helpers.warn)('Redshift does not support the deletion of indexes.');
};

exports.default = TableCompiler_Redshift;
module.exports = exports['default'];
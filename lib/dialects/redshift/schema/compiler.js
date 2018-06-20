'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _compiler = require('../../postgres/schema/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint max-len: 0 */

// Redshift Table Builder & Compiler
// -------

function SchemaCompiler_Redshift() {
  _compiler2.default.apply(this, arguments);
}
(0, _inherits2.default)(SchemaCompiler_Redshift, _compiler2.default);

exports.default = SchemaCompiler_Redshift;
module.exports = exports['default'];
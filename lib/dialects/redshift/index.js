'use strict';

exports.__esModule = true;

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _postgres = require('../postgres');

var _postgres2 = _interopRequireDefault(_postgres);

var _compiler = require('./query/compiler');

var _compiler2 = _interopRequireDefault(_compiler);

var _columncompiler = require('./schema/columncompiler');

var _columncompiler2 = _interopRequireDefault(_columncompiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Redshift Client
// -------
function Client_Redshift(config) {
  _postgres2.default.call(this, config);
}
(0, _inherits2.default)(Client_Redshift, _postgres2.default);

(0, _assign3.default)(Client_Redshift.prototype, {
  QueryCompiler: _compiler2.default,

  ColumnCompiler: _columncompiler2.default,

  dialect: 'redshift'
});

exports.default = Client_Redshift;
module.exports = exports['default'];
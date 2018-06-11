"use strict";

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columnbuilder = require('../../../schema/columnbuilder');

var _columnbuilder2 = _interopRequireDefault(_columnbuilder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ColumnBuilder_Redshift() {
  _columnbuilder2.default.apply(this, arguments);
}
(0, _inherits2.default)(ColumnBuilder_Redshift, _columnbuilder2.default);

// primary needs to set not null on non-preexisting columns, or fail
ColumnBuilder_Redshift.prototype.primary = function () {
  this.notNullable();
  return _columnbuilder2.default.prototype.primary.apply(this, arguments);
};

ColumnBuilder_Redshift.prototype.index = function () {
  this.client.logger.warn('Redshift does not support the creation of indexes.');
  return this;
};

exports.default = ColumnBuilder_Redshift;
module.exports = exports['default'];
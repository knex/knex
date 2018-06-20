'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _columnbuilder = require('../../../schema/columnbuilder');

var _columnbuilder2 = _interopRequireDefault(_columnbuilder);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ColumnBuilder_Oracle() {
  _columnbuilder2.default.apply(this, arguments);
}
(0, _inherits2.default)(ColumnBuilder_Oracle, _columnbuilder2.default);

// checkIn added to the builder to allow the column compiler to change the
// order via the modifiers ("check" must be after "default")
ColumnBuilder_Oracle.prototype.checkIn = function () {
  this._modifiers.checkIn = (0, _lodash.toArray)(arguments);
  return this;
};

exports.default = ColumnBuilder_Oracle;
module.exports = exports['default'];
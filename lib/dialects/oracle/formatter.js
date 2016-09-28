'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Oracle_Formatter = function (_Formatter) {
  (0, _inherits3.default)(Oracle_Formatter, _Formatter);

  function Oracle_Formatter() {
    (0, _classCallCheck3.default)(this, Oracle_Formatter);
    return (0, _possibleConstructorReturn3.default)(this, _Formatter.apply(this, arguments));
  }

  Oracle_Formatter.prototype.alias = function alias(first, second) {
    return first + ' ' + second;
  };

  Oracle_Formatter.prototype.parameter = function parameter(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (value instanceof _utils.ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return _Formatter.prototype.parameter.call(this, value, notSetValue);
  };

  return Oracle_Formatter;
}(_formatter2.default);

exports.default = Oracle_Formatter;
module.exports = exports['default'];
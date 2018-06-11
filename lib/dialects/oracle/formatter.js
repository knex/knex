'use strict';

exports.__esModule = true;

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Oracle_Formatter extends _formatter2.default {

  alias(first, second) {
    return first + ' ' + second;
  }

  parameter(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (value instanceof _utils.ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return super.parameter(value, notSetValue);
  }

}
exports.default = Oracle_Formatter;
module.exports = exports['default'];
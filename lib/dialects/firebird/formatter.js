'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var reservedColumnNames = ['index']; // Firebird Formatter
// -------

function Firebird_Formatter(client, builder) {
  _formatter2.default.call(this, client, builder);
}
(0, _inherits2.default)(Firebird_Formatter, _formatter2.default);

(0, _lodash.assign)(Firebird_Formatter.prototype, {
  alias: function alias(first, second) {
    return first + ' ' + second;
  },
  parameter: function parameter(value, notSetValue) {
    return _formatter2.default.prototype.parameter.call(
      this,
      value,
      notSetValue
    );
  },
  columnizeWithPrefix: function columnizeWithPrefix(prefix, target) {
    var columns = typeof target === 'string' ? [target] : target;
    var str = '',
      i = -1;
    while (++i < columns.length) {
      if (i > 0) str += ', ';
      str += prefix + this.wrap(columns[i]);
    }
    return str;
  },
  wrapAsIdentifier: function wrapAsIdentifier(value) {
    if (reservedColumnNames.indexOf(value) !== -1) {
      value = '"' + value + '"';
    }
    return _formatter2.default.prototype.wrapAsIdentifier.call(
      this,
      (value || '').trim()
    );
  },
});

exports.default = Firebird_Formatter;
module.exports = exports['default'];

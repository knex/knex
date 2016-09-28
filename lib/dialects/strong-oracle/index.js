'use strict';

exports.__esModule = true;

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _oracle = require('../oracle');

var _oracle2 = _interopRequireDefault(_oracle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Oracle Client
// -------
function Client_StrongOracle() {
  _oracle2.default.apply(this, arguments);
}
(0, _inherits2.default)(Client_StrongOracle, _oracle2.default);

Client_StrongOracle.prototype._driver = function () {
  return require('strong-oracle')();
};

Client_StrongOracle.prototype.driverName = 'strong-oracle';

exports.default = Client_StrongOracle;
module.exports = exports['default'];
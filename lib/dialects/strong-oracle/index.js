
// Oracle Client
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _oracle = require('../oracle');

var _oracle2 = _interopRequireDefault(_oracle);

function Client_StrongOracle() {
  _oracle2['default'].apply(this, arguments);
}
_inherits2['default'](Client_StrongOracle, _oracle2['default']);

Client_StrongOracle.prototype._driver = function () {
  return require('strong-oracle')();
};

Client_StrongOracle.prototype.driverName = 'strong-oracle';

exports['default'] = Client_StrongOracle;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9zdHJvbmctb3JhY2xlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozt3QkFHcUIsVUFBVTs7OztzQkFDTCxXQUFXOzs7O0FBRXJDLFNBQVMsbUJBQW1CLEdBQUc7QUFDN0Isc0JBQWMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztDQUN0QztBQUNELHNCQUFTLG1CQUFtQixzQkFBZ0IsQ0FBQzs7QUFFN0MsbUJBQW1CLENBQUMsU0FBUyxDQUFDLE9BQU8sR0FBRztTQUFNLE9BQU8sQ0FBQyxlQUFlLENBQUMsRUFBRTtDQUFBLENBQUE7O0FBRXhFLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsZUFBZSxDQUFBOztxQkFFM0MsbUJBQW1CIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBPcmFjbGUgQ2xpZW50XG4vLyAtLS0tLS0tXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IENsaWVudF9PcmFjbGUgZnJvbSAnLi4vb3JhY2xlJztcblxuZnVuY3Rpb24gQ2xpZW50X1N0cm9uZ09yYWNsZSgpIHtcbiAgQ2xpZW50X09yYWNsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuaW5oZXJpdHMoQ2xpZW50X1N0cm9uZ09yYWNsZSwgQ2xpZW50X09yYWNsZSk7XG5cbkNsaWVudF9TdHJvbmdPcmFjbGUucHJvdG90eXBlLl9kcml2ZXIgPSAoKSA9PiByZXF1aXJlKCdzdHJvbmctb3JhY2xlJykoKVxuXG5DbGllbnRfU3Ryb25nT3JhY2xlLnByb3RvdHlwZS5kcml2ZXJOYW1lID0gJ3N0cm9uZy1vcmFjbGUnXG5cbmV4cG9ydCBkZWZhdWx0IENsaWVudF9TdHJvbmdPcmFjbGU7XG4iXX0=
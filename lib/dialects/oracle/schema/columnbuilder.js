'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _schemaColumnbuilder = require('../../../schema/columnbuilder');

var _schemaColumnbuilder2 = _interopRequireDefault(_schemaColumnbuilder);

var _lodash = require('lodash');

function ColumnBuilder_Oracle() {
  _schemaColumnbuilder2['default'].apply(this, arguments);
}
_inherits2['default'](ColumnBuilder_Oracle, _schemaColumnbuilder2['default']);

// checkIn added to the builder to allow the column compiler to change the
// order via the modifiers ("check" must be after "default")
ColumnBuilder_Oracle.prototype.checkIn = function () {
  this._modifiers.checkIn = _lodash.toArray(arguments);
  return this;
};

exports['default'] = ColumnBuilder_Oracle;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvc2NoZW1hL2NvbHVtbmJ1aWxkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3dCQUNxQixVQUFVOzs7O21DQUNMLCtCQUErQjs7OztzQkFFakMsUUFBUTs7QUFFaEMsU0FBUyxvQkFBb0IsR0FBRztBQUM5QixtQ0FBYyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0NBQ3RDO0FBQ0Qsc0JBQVMsb0JBQW9CLG1DQUFnQixDQUFDOzs7O0FBSTlDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUNuRCxNQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxnQkFBUSxTQUFTLENBQUMsQ0FBQztBQUM3QyxTQUFPLElBQUksQ0FBQztDQUNiLENBQUM7O3FCQUVhLG9CQUFvQiIsImZpbGUiOiJjb2x1bW5idWlsZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IENvbHVtbkJ1aWxkZXIgZnJvbSAnLi4vLi4vLi4vc2NoZW1hL2NvbHVtbmJ1aWxkZXInO1xuXG5pbXBvcnQgeyB0b0FycmF5IH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBDb2x1bW5CdWlsZGVyX09yYWNsZSgpIHtcbiAgQ29sdW1uQnVpbGRlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuaW5oZXJpdHMoQ29sdW1uQnVpbGRlcl9PcmFjbGUsIENvbHVtbkJ1aWxkZXIpO1xuXG4vLyBjaGVja0luIGFkZGVkIHRvIHRoZSBidWlsZGVyIHRvIGFsbG93IHRoZSBjb2x1bW4gY29tcGlsZXIgdG8gY2hhbmdlIHRoZVxuLy8gb3JkZXIgdmlhIHRoZSBtb2RpZmllcnMgKFwiY2hlY2tcIiBtdXN0IGJlIGFmdGVyIFwiZGVmYXVsdFwiKVxuQ29sdW1uQnVpbGRlcl9PcmFjbGUucHJvdG90eXBlLmNoZWNrSW4gPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX21vZGlmaWVycy5jaGVja0luID0gdG9BcnJheShhcmd1bWVudHMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENvbHVtbkJ1aWxkZXJfT3JhY2xlXG4iXX0=
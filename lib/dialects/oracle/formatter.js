'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _formatter = require('../../formatter');

var _formatter2 = _interopRequireDefault(_formatter);

var _utils = require('./utils');

var _lodash = require('lodash');

function Oracle_Formatter(client) {
  _formatter2['default'].call(this, client);
}
_inherits2['default'](Oracle_Formatter, _formatter2['default']);

_lodash.assign(Oracle_Formatter.prototype, {

  alias: function alias(first, second) {
    return first + ' ' + second;
  },

  parameter: function parameter(value, notSetValue) {
    // Returning helper uses always ROWID as string
    if (value instanceof _utils.ReturningHelper && this.client.driver) {
      value = new this.client.driver.OutParam(this.client.driver.OCCISTRING);
    } else if (typeof value === 'boolean') {
      value = value ? 1 : 0;
    }
    return _formatter2['default'].prototype.parameter.call(this, value, notSetValue);
  }

});

exports['default'] = Oracle_Formatter;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9kaWFsZWN0cy9vcmFjbGUvZm9ybWF0dGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozt3QkFDcUIsVUFBVTs7Ozt5QkFDVCxpQkFBaUI7Ozs7cUJBQ1AsU0FBUzs7c0JBRWxCLFFBQVE7O0FBRS9CLFNBQVMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFO0FBQ2hDLHlCQUFVLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7Q0FDN0I7QUFDRCxzQkFBUyxnQkFBZ0IseUJBQVksQ0FBQTs7QUFFckMsZUFBTyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUU7O0FBRWpDLE9BQUssRUFBQSxlQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7QUFDbkIsV0FBTyxLQUFLLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQztHQUM3Qjs7QUFFRCxXQUFTLEVBQUEsbUJBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRTs7QUFFNUIsUUFBSSxLQUFLLGtDQUEyQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQzFELFdBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQTtLQUN2RSxNQUNJLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQ25DLFdBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUN0QjtBQUNELFdBQU8sdUJBQVUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtHQUNwRTs7Q0FFRixDQUFDLENBQUE7O3FCQUVhLGdCQUFnQiIsImZpbGUiOiJmb3JtYXR0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgRm9ybWF0dGVyIGZyb20gJy4uLy4uL2Zvcm1hdHRlcic7XG5pbXBvcnQgeyBSZXR1cm5pbmdIZWxwZXIgfSBmcm9tICcuL3V0aWxzJztcblxuaW1wb3J0IHsgYXNzaWduIH0gZnJvbSAnbG9kYXNoJ1xuXG5mdW5jdGlvbiBPcmFjbGVfRm9ybWF0dGVyKGNsaWVudCkge1xuICBGb3JtYXR0ZXIuY2FsbCh0aGlzLCBjbGllbnQpXG59XG5pbmhlcml0cyhPcmFjbGVfRm9ybWF0dGVyLCBGb3JtYXR0ZXIpXG5cbmFzc2lnbihPcmFjbGVfRm9ybWF0dGVyLnByb3RvdHlwZSwge1xuXG4gIGFsaWFzKGZpcnN0LCBzZWNvbmQpIHtcbiAgICByZXR1cm4gZmlyc3QgKyAnICcgKyBzZWNvbmQ7XG4gIH0sXG5cbiAgcGFyYW1ldGVyKHZhbHVlLCBub3RTZXRWYWx1ZSkge1xuICAgIC8vIFJldHVybmluZyBoZWxwZXIgdXNlcyBhbHdheXMgUk9XSUQgYXMgc3RyaW5nXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUmV0dXJuaW5nSGVscGVyICYmIHRoaXMuY2xpZW50LmRyaXZlcikge1xuICAgICAgdmFsdWUgPSBuZXcgdGhpcy5jbGllbnQuZHJpdmVyLk91dFBhcmFtKHRoaXMuY2xpZW50LmRyaXZlci5PQ0NJU1RSSU5HKVxuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgdmFsdWUgPSB2YWx1ZSA/IDEgOiAwXG4gICAgfVxuICAgIHJldHVybiBGb3JtYXR0ZXIucHJvdG90eXBlLnBhcmFtZXRlci5jYWxsKHRoaXMsIHZhbHVlLCBub3RTZXRWYWx1ZSlcbiAgfVxuXG59KVxuXG5leHBvcnQgZGVmYXVsdCBPcmFjbGVfRm9ybWF0dGVyXG4iXX0=
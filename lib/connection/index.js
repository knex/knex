'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var Connection = (function (_EventEmitter) {
  _inherits(Connection, _EventEmitter);

  function Connection(connection) {
    _classCallCheck(this, Connection);

    _EventEmitter.call(this);
    this.connection = connection;

    // Flag indicating whether the connection is "managed",
    // and should be released to the pool upon completion
    this.managed = false;
  }

  Connection.prototype.execute = function execute() {
    return this._execute();
  };

  return Connection;
})(_events.EventEmitter);

exports['default'] = Connection;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25uZWN0aW9uL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3NCQUE2QixRQUFROztJQUVoQixVQUFVO1lBQVYsVUFBVTs7QUFFbEIsV0FGUSxVQUFVLENBRWpCLFVBQVUsRUFBRTswQkFGTCxVQUFVOztBQUczQiw0QkFBTyxDQUFBO0FBQ1AsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7Ozs7QUFJNUIsUUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7R0FDckI7O0FBVGtCLFlBQVUsV0FXN0IsT0FBTyxHQUFBLG1CQUFHO0FBQ1IsV0FBTyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUE7R0FDdkI7O1NBYmtCLFVBQVU7OztxQkFBVixVQUFVIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25uZWN0aW9uIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICBjb25zdHJ1Y3Rvcihjb25uZWN0aW9uKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb25cblxuICAgIC8vIEZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBjb25uZWN0aW9uIGlzIFwibWFuYWdlZFwiLFxuICAgIC8vIGFuZCBzaG91bGQgYmUgcmVsZWFzZWQgdG8gdGhlIHBvb2wgdXBvbiBjb21wbGV0aW9uXG4gICAgdGhpcy5tYW5hZ2VkID0gZmFsc2VcbiAgfVxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2V4ZWN1dGUoKVxuICB9XG5cblxuXG59XG5cbiJdfQ==
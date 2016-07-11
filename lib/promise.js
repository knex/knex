'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('./helpers');

_bluebird2['default'].prototype.exec = function (cb) {
  _helpers.deprecate('.exec', '.asCallback');
  return this.asCallback(cb);
};

exports['default'] = _bluebird2['default'];
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wcm9taXNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozt3QkFDb0IsVUFBVTs7Ozt1QkFDSixXQUFXOztBQUVyQyxzQkFBUSxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVMsRUFBRSxFQUFFO0FBQ3BDLHFCQUFVLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQTtBQUNqQyxTQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUE7Q0FDM0IsQ0FBQyIsImZpbGUiOiJwcm9taXNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBkZXByZWNhdGUgfSBmcm9tICcuL2hlbHBlcnMnO1xuXG5Qcm9taXNlLnByb3RvdHlwZS5leGVjID0gZnVuY3Rpb24oY2IpIHtcbiAgZGVwcmVjYXRlKCcuZXhlYycsICcuYXNDYWxsYmFjaycpXG4gIHJldHVybiB0aGlzLmFzQ2FsbGJhY2soY2IpXG59O1xuXG5leHBvcnQgZGVmYXVsdCBQcm9taXNlO1xuIl19
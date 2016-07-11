
// Stub Seed:
// Used for now in browser builds, where filesystem access isn't
// available. Maybe we can eventually do websql migrations
// with jsonp and a json migration api.
"use strict";

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var StubSeed = module.exports = function () {};

var noSuchMethod = _bluebird2["default"].method(function () {
  throw new Error("Seeds are not supported");
});

StubSeed.prototype = {
  make: noSuchMethod,
  run: noSuchMethod
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZWVkL3NlZWQtc3R1Yi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7d0JBT29CLFVBQVU7Ozs7QUFGOUIsSUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFXLEVBQUUsQ0FBQzs7QUFJaEQsSUFBTSxZQUFZLEdBQUcsc0JBQVEsTUFBTSxDQUFDLFlBQVc7QUFDN0MsUUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0NBQzVDLENBQUMsQ0FBQzs7QUFFSCxRQUFRLENBQUMsU0FBUyxHQUFHO0FBQ25CLE1BQUksRUFBRSxZQUFZO0FBQ2xCLEtBQUcsRUFBRSxZQUFZO0NBQ2xCLENBQUMiLCJmaWxlIjoic2VlZC1zdHViLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBTdHViIFNlZWQ6XG4vLyBVc2VkIGZvciBub3cgaW4gYnJvd3NlciBidWlsZHMsIHdoZXJlIGZpbGVzeXN0ZW0gYWNjZXNzIGlzbid0XG4vLyBhdmFpbGFibGUuIE1heWJlIHdlIGNhbiBldmVudHVhbGx5IGRvIHdlYnNxbCBtaWdyYXRpb25zXG4vLyB3aXRoIGpzb25wIGFuZCBhIGpzb24gbWlncmF0aW9uIGFwaS5cbmNvbnN0IFN0dWJTZWVkID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHt9O1xuXG5pbXBvcnQgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5cbmNvbnN0IG5vU3VjaE1ldGhvZCA9IFByb21pc2UubWV0aG9kKGZ1bmN0aW9uKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJTZWVkcyBhcmUgbm90IHN1cHBvcnRlZFwiKTtcbn0pO1xuXG5TdHViU2VlZC5wcm90b3R5cGUgPSB7XG4gIG1ha2U6IG5vU3VjaE1ldGhvZCxcbiAgcnVuOiBub1N1Y2hNZXRob2Rcbn07XG4iXX0=
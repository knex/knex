"use strict";

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Stub Seed:
// Used for now in browser builds, where filesystem access isn't
// available. Maybe we can eventually do websql migrations
// with jsonp and a json migration api.
var StubSeed = module.exports = function () {};

var noSuchMethod = _bluebird2.default.method(function () {
  throw new Error("Seeds are not supported");
});

StubSeed.prototype = {
  make: noSuchMethod,
  run: noSuchMethod
};
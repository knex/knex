"use strict";

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Stub Migrate:
// Used for now in browser builds, where filesystem access isn't
// available. Maybe we can eventually do websql migrations
// with jsonp and a json migration api.
var StubMigrate = module.exports = function () {};

var noSuchMethod = _bluebird2.default.method(function () {
  throw new Error("Migrations are not supported");
});

StubMigrate.prototype = {
  make: noSuchMethod,
  latest: noSuchMethod,
  rollback: noSuchMethod,
  currentVersion: noSuchMethod
};
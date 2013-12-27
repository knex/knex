// Stub Migrate:
// Used for now in browser builds, where filesystem access isn't
// available. Maybe we can eventually do websql migrations
// with jsonp and a json migration api.
var StubMigrate = module.exports = function() {};

var noSuchMethod = Promise.method(function() {
  throw new Error("Migrations are not supported");
});

StubMigrate.prototype = {
  make: noSuchMethod,
  latest: noSuchMethod,
  rollback: noSuchMethod,
  currentVersion: noSuchMethod
};
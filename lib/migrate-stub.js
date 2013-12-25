// Stub Migrate:
// Used for now in browser builds, where filesystem access isn't
// available. Maybe we can eventually do websql migrations
// with jsonp and a json migration api.
var StubMigrate = module.exports = function() {};

StubMigrate.prototype = {
  make: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
  latest: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
  rollback: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
  currentVersion: Promise.method(function() {
    throw new Error("Migrations are not supported");
  }),
};
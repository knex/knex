var StubMigrate = module.exports = function() {

};

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
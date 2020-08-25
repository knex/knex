// Stub Migrate:
// Used for now in browser builds, where filesystem access isn't
// available.
const StubMigrate = (module.exports = function () {});

const noSuchMethod = async function () {
  throw new Error('Migrations are not supported');
};

StubMigrate.prototype = {
  make: noSuchMethod,
  latest: noSuchMethod,
  rollback: noSuchMethod,
  currentVersion: noSuchMethod,
  up: noSuchMethod,
  down: noSuchMethod,
};

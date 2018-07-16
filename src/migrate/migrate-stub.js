// Stub Migrate:
// Used for now in browser builds, where filesystem access isn't
// available.
const StubMigrate = (module.exports = function() {});

import Promise from 'bluebird';

const noSuchMethod = Promise.method(function() {
  throw new Error('Migrations are not supported');
});

StubMigrate.prototype = {
  make: noSuchMethod,
  latest: noSuchMethod,
  rollback: noSuchMethod,
  currentVersion: noSuchMethod,
};

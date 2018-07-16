// Stub Seed:
// Used for now in browser builds, where filesystem access isn't
// available.
const StubSeed = (module.exports = function() {});

import Promise from 'bluebird';

const noSuchMethod = Promise.method(function() {
  throw new Error('Seeds are not supported');
});

StubSeed.prototype = {
  make: noSuchMethod,
  run: noSuchMethod,
};

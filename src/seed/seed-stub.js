// Stub Seed:
// Used for now in browser builds, where filesystem access isn't
// available.
const StubSeed = (module.exports = function() {});

const Bluebird = require('bluebird');

const noSuchMethod = Bluebird.method(function() {
  throw new Error('Seeds are not supported');
});

StubSeed.prototype = {
  make: noSuchMethod,
  run: noSuchMethod,
};

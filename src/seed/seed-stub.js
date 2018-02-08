
// Stub Seed:
// Used for now in browser builds, where filesystem access isn't
// available. Maybe we can eventually do websql migrations
// with jsonp and a json migration api.
const StubSeed = module.exports = function() {};

import Promise from 'bluebird';

const noSuchMethod = Promise.method(function() {
  throw new Error("Seeds are not supported");
});

StubSeed.prototype = {
  make: noSuchMethod,
  run: noSuchMethod
};

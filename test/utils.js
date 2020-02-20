const assert = require('assert');

const expectError = (promise) =>
  promise.then(() => assert.fail("Shouldn't have gotten here."), (e) => e);

module.exports = {
  expectError,
};

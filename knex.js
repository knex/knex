// Knex.js
// --------------
//     (c) 2013-present Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// Should be safe to remove after support for Node.js 6 is dropped
if (
  process &&
  process.versions &&
  process.versions.node &&
  process.versions.node.startsWith('6.')
) {
  const oldPromise = global.Promise;

  require('@babel/polyfill');

  // Preserve any Promise overrides set globally prior to importing knex
  if (oldPromise) {
    global.Promise = oldPromise;
  }
}

module.exports = require('./lib/index');

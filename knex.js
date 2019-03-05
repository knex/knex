const { isNode6 } = require('./lib/util/version-helper');

// Knex.js
// --------------
//     (c) 2013-present Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

// Should be safe to remove after support for Node.js 6 is dropped
if (isNode6()) {
  try {
    const oldPromise = global.Promise;

    require('@babel/polyfill');

    // Preserve any Promise overrides set globally prior to importing knex
    if (oldPromise) {
      global.Promise = oldPromise;
    }
  } catch (e) {
    throw new Error(
      `You are using Node.js 6. Please consider upgrading to Node.js 8+ or add '@babel/polyfill' dependency to the project (knex will automatically load it).`
    );
  }
}

module.exports = require('./lib/index');

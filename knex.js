// Knex.js
// --------------
//     (c) 2013-present Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

const oldPromise = global.Promise;

// Should be safe to remove after support for Node.js 6 is dropped
require('@babel/polyfill');

// Preserve any Promise overrides set globally prior to importing knex
if (oldPromise) {
  global.Promise = oldPromise;
}

module.exports = require('./lib/index');

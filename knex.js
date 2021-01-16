// Knex.js
// --------------
//     (c) 2013-present Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

const knex = require('./lib/index');

/**
 * These export configurations enable JS and TS developers
 * to consume knex in whatever way best suits their needs.
 * Some examples of supported import syntax includes:
 * - `const knex = require('knex')`
 * - `const { knex } = require('knex')`
 * - `import * as knex from 'knex'`
 * - `import { knex } from 'knex'`
 * - `import knex from 'knex'`
 */
knex.knex = knex;
knex.default = knex;

module.exports = knex;

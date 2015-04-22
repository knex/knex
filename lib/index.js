// Knex.js  0.8.0
// --------------
//     (c) 2014 Tim Griesser
//     Knex may be freely distributed under the MIT license.
//     For details and documentation:
//     http://knexjs.org

'use strict';

var Raw            = require('./raw')
var warn           = require('./helpers').warn
var Client         = require('./client')

var makeClient     = require('./util/make-client')
var makeKnex       = require('./util/make-knex')
var assign         = require('lodash/object/assign')

function Knex(config) {
  if (typeof config === 'string') {
    return new Knex(assign(parseUrl(config), arguments[2]))
  }
  var Dialect;
  if (arguments.length === 0 || (!config.client && !config.dialect)) {
    Dialect = makeClient(Client)
  } else {
    var clientName = config.client || config.dialect
    Dialect = makeClient(require('./dialects/' + (aliases[clientName] || clientName)))
  }
  return makeKnex(new Dialect(config))
}

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = function(sql, bindings) {
  return new Raw({}).set(sql, bindings)
}

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  warn('knex.initialize is deprecated, pass your config object directly to the knex module')
  return new Knex(config)
}

function parseUrl() {

}

// The client names we'll allow in the `{name: lib}` pairing.
var aliases = {
  'mariadb'       : 'maria',
  'mariasql'      : 'maria',
  'pg'            : 'postgres',
  'sqlite'        : 'sqlite3'
};

module.exports = Knex
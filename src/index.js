
import Raw from './raw';
import { warn } from './helpers';
import Client from './client';

import makeClient from './util/make-client';
import makeKnex from './util/make-knex';
import parseConnection from './util/parse-connection';

import { assign } from 'lodash'

// The client names we'll allow in the `{name: lib}` pairing.
const aliases = {
  'mariadb'   : 'maria',
  'mariasql'  : 'maria',
  'pg'        : 'postgres',
  'postgresql': 'postgres',
  'sqlite'    : 'sqlite3'
};

export default function Knex(config) {
  if (typeof config === 'string') {
    return new Knex(assign(parseConnection(config), arguments[2]))
  }
  let Dialect;
  if (arguments.length === 0 || (!config.client && !config.dialect)) {
    Dialect = makeClient(Client)
  } else if (typeof config.client === 'function' && config.client.prototype instanceof Client) {
    Dialect = makeClient(config.client)
  } else {
    const clientName = config.client || config.dialect
    Dialect = makeClient(require(`./dialects/${aliases[clientName] || clientName}/index.js`))
  }
  if (typeof config.connection === 'string') {
    config = assign({}, config, {connection: parseConnection(config.connection).connection})
  }
  return makeKnex(new Dialect(config))
}

// Expose Client on the main Knex namespace.
Knex.Client = Client

// Expose Knex version on the main Knex namespace.
Knex.VERSION = require('../package.json').version

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = (sql, bindings) => new Raw({}).set(sql, bindings)

// Create a new "knex" instance with the appropriate configured client.
Knex.initialize = function(config) {
  warn('knex.initialize is deprecated, pass your config object directly to the knex module')
  return new Knex(config)
}

// Bluebird
Knex.Promise = require('./promise')

// Doing this ensures Browserify works. Still need to figure out
// the best way to do some of this.
if (process.browser) {
  require('./dialects/websql/index.js')
}

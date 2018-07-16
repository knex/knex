import Raw from './raw';
import Client from './client';

import makeKnex from './util/make-knex';
import parseConnection from './util/parse-connection';

import { assign } from 'lodash';

// The client names we'll allow in the `{name: lib}` pairing.
const aliases = {
  pg: 'postgres',
  postgresql: 'postgres',
  sqlite: 'sqlite3',
};

export default function Knex(config) {
  if (typeof config === 'string') {
    return new Knex(assign(parseConnection(config), arguments[2]));
  }
  let Dialect;
  if (arguments.length === 0 || (!config.client && !config.dialect)) {
    Dialect = Client;
  } else if (
    typeof config.client === 'function' &&
    config.client.prototype instanceof Client
  ) {
    Dialect = config.client;
  } else {
    const clientName = config.client || config.dialect;
    Dialect = require(`./dialects/${aliases[clientName] ||
      clientName}/index.js`);
  }
  if (typeof config.connection === 'string') {
    config = assign({}, config, {
      connection: parseConnection(config.connection).connection,
    });
  }
  return makeKnex(new Dialect(config));
}

// Expose Client on the main Knex namespace.
Knex.Client = Client;

/* eslint no-console:0 */

Object.defineProperties(Knex, {
  VERSION: {
    get() {
      console.warn(
        'Knex.VERSION is deprecated, you can get the module version' +
          "by running require('knex/package').version"
      );
      return '0.12.6';
    },
  },
  Promise: {
    get() {
      console.warn(
        `Knex.Promise is deprecated, either require bluebird or use the global Promise`
      );
      return require('bluebird');
    },
  },
});

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = (sql, bindings) => {
  console.warn(
    'global Knex.raw is deprecated, use knex.raw (chain off an initialized knex object)'
  );
  return new Raw().set(sql, bindings);
};

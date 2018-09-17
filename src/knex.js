import Raw from './raw';
import Client from './client';

import makeKnex from './util/make-knex';
import parseConnection from './util/parse-connection';
import { SUPPORTED_CLIENTS, CLIENT_ALIASES } from './constants';
import { clone } from 'lodash';

export default function Knex(config) {
  // If config is string, try to parse it
  if (typeof config === 'string') {
    const parsedConfig = Object.assign(parseConnection(config), arguments[2]);
    return new Knex(parsedConfig);
  }

  let Dialect;
  // If user provided no relevant parameters, use generic client
  if (arguments.length === 0 || (!config.client && !config.dialect)) {
    Dialect = Client;
  }

  // If user provided Client constructor as a parameter, use it
  else if (
    typeof config.client === 'function' &&
    config.client.prototype instanceof Client
  ) {
    Dialect = config.client;
  }

  // If neither applies, let's assume user specified name of a client or dialect as a string
  else {
    const clientName = config.client || config.dialect;
    if (!SUPPORTED_CLIENTS.includes(clientName)) {
      throw new Error(
        `knex: Unknown configuration option 'client' value ${clientName}. Note that it is case-sensitive, check documentation for supported values.`
      );
    }

    Dialect = require(`./dialects/${CLIENT_ALIASES[clientName] ||
      clientName}/index.js`);
  }

  // If config connection parameter is passed as string, try to parse it
  if (typeof config.connection === 'string') {
    config = Object.assign({}, config, {
      connection: parseConnection(config.connection).connection,
    });
  }
  return makeKnex(new Dialect(config));
}

// Expose Client on the main Knex namespace.
Knex.Client = Client;

/* eslint no-console:0 */

Object.defineProperties(Knex, {
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

Knex.withUserParams = (params) => {
  const knexClone = clone(this);
  knexClone.userParams = params;
  return knexClone;
};

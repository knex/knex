
import { EventEmitter } from 'events';

import Migrator from '../migrate';
import Seeder from '../seed';
import FunctionHelper from '../functionhelper';
import QueryInterface from '../query/methods';
import * as helpers from '../helpers';
import { assign } from 'lodash'
import BatchInsert from './batchInsert';

export default function makeKnex(client) {

  // The object we're potentially using to kick off an initial chain.
  function knex(tableName) {
    const qb = knex.queryBuilder()
    if (!tableName) helpers.warn(
      'calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.'
    );
    return tableName ? qb.table(tableName) : qb
  }

  assign(knex, {

    Promise: require('bluebird'),

    // A new query builder instance.
    queryBuilder() {
      return client.queryBuilder()
    },

    raw() {
      return client.raw.apply(client, arguments)
    },

    batchInsert(table, batch, chunkSize = 1000) {
      return new BatchInsert(this, table, batch, chunkSize);
    },

    // Runs a new transaction, taking a container and returning a promise
    // for when the transaction is resolved.
    transaction(container, config) {
      return client.transaction(container, config)
    },

    // Typically never needed, initializes the pool for a knex client.
    initialize(config) {
      return client.initialize(config)
    },

    // Convenience method for tearing down the pool.
    destroy(callback) {
      return client.destroy(callback)
    }

  })

  // Hook up the "knex" object as an EventEmitter.
  const ee = new EventEmitter()
  for (const key in ee) {
    knex[key] = ee[key]
  }

  // Allow chaining methods from the root object, before
  // any other information is specified.
  QueryInterface.forEach(function(method) {
    knex[method] = function() {
      const builder = knex.queryBuilder()
      return builder[method].apply(builder, arguments)
    }
  })

  knex.client = client

  const VERSION = '0.12.6'

  Object.defineProperties(knex, {

    __knex__: {
      get() {
        helpers.warn(
          'knex.__knex__ is deprecated, you can get the module version' +
          "by running require('knex/package').version"
        )
        return VERSION
      }
    },

    VERSION: {
      get() {
        helpers.warn(
          'knex.VERSION is deprecated, you can get the module version' +
          "by running require('knex/package').version"
        )
        return VERSION
      }
    },

    schema: {
      get() {
        return client.schemaBuilder()
      }
    },

    migrate: {
      get() {
        return new Migrator(knex)
      }
    },

    seed: {
      get() {
        return new Seeder(knex)
      }
    },

    fn: {
      get() {
        return new FunctionHelper(client)
      }
    }

  })

  // Passthrough all "start" and "query" events to the knex object.
  client.on('start', function(obj) {
    knex.emit('start', obj)
  })
  client.on('query', function(obj) {
    knex.emit('query', obj)
  })
  client.on('query-error', function(err, obj) {
    knex.emit('query-error', err, obj)
  })
  client.on('query-response', function(response, obj, builder) {
    knex.emit('query-response', response, obj, builder)
  })

  client.makeKnex = makeKnex

  return knex
}

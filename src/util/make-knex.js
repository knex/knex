import { EventEmitter } from 'events';

import Migrator from '../migrate/Migrator';
import Seeder from '../seed';
import FunctionHelper from '../functionhelper';
import QueryInterface from '../query/methods';
import { assign } from 'lodash';
import batchInsert from './batchInsert';
import * as bluebird from 'bluebird';

export default function makeKnex(client) {
  // The object we're potentially using to kick off an initial chain.
  function knex(tableName, options) {
    return createQueryBuilder(knex.context, tableName, options);
  }
  redefineProperties(knex, client);
  return knex;
}

function initContext(knexFn) {
  const knexContext = knexFn.context || {};
  assign(knexContext, {
    queryBuilder() {
      return this.client.queryBuilder();
    },

    raw() {
      return this.client.raw.apply(this.client, arguments);
    },

    batchInsert(table, batch, chunkSize = 1000) {
      return batchInsert(this, table, batch, chunkSize);
    },

    // Runs a new transaction, taking a container and returning a promise
    // for when the transaction is resolved.
    transaction(container, config) {
      const trx = this.client.transaction(container, config);
      trx.userParams = this.userParams;
      return trx;
    },

    // Typically never needed, initializes the pool for a knex client.
    initialize(config) {
      return this.client.initializePool(config);
    },

    // Convenience method for tearing down the pool.
    destroy(callback) {
      return this.client.destroy(callback);
    },

    ref(ref) {
      return this.client.ref(ref);
    },

    // Do not document this as public API until naming and API is improved for general consumption
    // This method exists to disable processing of internal queries in migrations
    disableProcessing() {
      if (this.userParams.isProcessingDisabled) {
        return;
      }
      this.userParams.wrapIdentifier = this.client.config.wrapIdentifier;
      this.userParams.postProcessResponse = this.client.config.postProcessResponse;
      this.client.config.wrapIdentifier = null;
      this.client.config.postProcessResponse = null;
      this.userParams.isProcessingDisabled = true;
    },

    // Do not document this as public API until naming and API is improved for general consumption
    // This method exists to enable execution of non-internal queries with consistent identifier naming in migrations
    enableProcessing() {
      if (!this.userParams.isProcessingDisabled) {
        return;
      }
      this.client.config.wrapIdentifier = this.userParams.wrapIdentifier;
      this.client.config.postProcessResponse = this.userParams.postProcessResponse;
      this.userParams.isProcessingDisabled = false;
    },

    withUserParams(params) {
      const knexClone = shallowCloneFunction(knexFn); // We need to include getters in our clone
      if (this.client) {
        knexClone.client = Object.assign({}, this.client); // Clone client to avoid leaking listeners that are set on it
        knexClone.client.config = Object.assign({}, this.client.config); // Clone client config to make sure they can be modified independently
        const parentPrototype = Object.getPrototypeOf(this.client);
        if (parentPrototype) {
          Object.setPrototypeOf(knexClone.client, parentPrototype);
        }
      }

      redefineProperties(knexClone, knexClone.client);
      knexClone.userParams = params;
      return knexClone;
    },
  });

  if (!knexFn.context) {
    knexFn.context = knexContext;
  }
}

function redefineProperties(knex, client) {
  // Allow chaining methods from the root object, before
  // any other information is specified.
  QueryInterface.forEach(function(method) {
    knex[method] = function() {
      const builder = knex.queryBuilder();
      return builder[method].apply(builder, arguments);
    };
  });

  Object.defineProperties(knex, {
    context: {
      get() {
        return knex._context;
      },
      set(context) {
        knex._context = context;

        // Redefine public API for knex instance that would be proxying methods from correct context
        knex.raw = context.raw;
        knex.batchInsert = context.batchInsert;
        knex.transaction = context.transaction;
        knex.initialize = context.initialize;
        knex.destroy = context.destroy;
        knex.ref = context.ref;
        knex.withUserParams = context.withUserParams;
        knex.queryBuilder = context.queryBuilder;
        knex.disableProcessing = context.disableProcessing;
        knex.enableProcessing = context.enableProcessing;
      },
      configurable: true,
    },

    client: {
      get() {
        return knex.context.client;
      },
      set(client) {
        knex.context.client = client;
      },
      configurable: true,
    },

    userParams: {
      get() {
        return knex.context.userParams;
      },
      set(userParams) {
        knex.context.userParams = userParams;
      },
      configurable: true,
    },

    schema: {
      get() {
        return knex.client.schemaBuilder();
      },
      configurable: true,
    },

    migrate: {
      get() {
        return new Migrator(knex);
      },
      configurable: true,
    },

    seed: {
      get() {
        return new Seeder(knex);
      },
      configurable: true,
    },

    fn: {
      get() {
        return new FunctionHelper(knex.client);
      },
      configurable: true,
    },
  });

  initContext(knex);
  knex.Promise = bluebird;
  knex.client = client;
  knex.client.makeKnex = makeKnex;
  knex.userParams = {};

  // Hook up the "knex" object as an EventEmitter.
  const ee = new EventEmitter();
  for (const key in ee) {
    knex[key] = ee[key];
  }

  // Passthrough all "start" and "query" events to the knex object.
  knex.client.on('start', function(obj) {
    knex.emit('start', obj);
  });
  knex.client.on('query', function(obj) {
    knex.emit('query', obj);
  });
  knex.client.on('query-error', function(err, obj) {
    knex.emit('query-error', err, obj);
  });
  knex.client.on('query-response', function(response, obj, builder) {
    knex.emit('query-response', response, obj, builder);
  });
}

function createQueryBuilder(knexContext, tableName, options) {
  const qb = knexContext.queryBuilder();
  if (!tableName)
    knexContext.client.logger.warn(
      'calling knex without a tableName is deprecated. Use knex.queryBuilder() instead.'
    );
  return tableName ? qb.table(tableName, options) : qb;
}

function shallowCloneFunction(originalFunction) {
  const fnContext = Object.create(
    Object.getPrototypeOf(originalFunction),
    Object.getOwnPropertyDescriptors(originalFunction)
  );

  const knexContext = {};
  const knexFnWrapper = (tableName, options) => {
    return createQueryBuilder(knexContext, tableName, options);
  };

  const clonedFunction = knexFnWrapper.bind(fnContext);
  Object.assign(clonedFunction, originalFunction);
  clonedFunction._context = knexContext;
  return clonedFunction;
}

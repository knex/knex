const { EventEmitter } = require('events');

const { Migrator } = require('../migrate/Migrator');
const Seeder = require('../seed/Seeder');
const FunctionHelper = require('../functionhelper');
const QueryInterface = require('../query/methods');
const { merge } = require('lodash');
const batchInsert = require('./batchInsert');

function makeKnex(client) {
  // The object we're potentially using to kick off an initial chain.
  function knex(tableName, options) {
    return createQueryBuilder(knex.context, tableName, options);
  }

  redefineProperties(knex, client);
  return knex;
}

function initContext(knexFn) {
  const knexContext = knexFn.context || {};
  Object.assign(knexContext, {
    queryBuilder() {
      return this.client.queryBuilder();
    },

    raw() {
      return this.client.raw.apply(this.client, arguments);
    },

    batchInsert(table, batch, chunkSize = 1000) {
      return batchInsert(this, table, batch, chunkSize);
    },

    // Creates a new transaction.
    // If container is provided, returns a promise for when the transaction is resolved.
    // If container is not provided, returns a promise with a transaction that is resolved
    // when transaction is ready to be used.
    transaction(container, config) {
      const trx = this.client.transaction(container, config);
      trx.userParams = this.userParams;

      if (container) {
        return trx;
      }
      // If no container was passed, assume user wants to get a transaction and use it directly
      else {
        return trx.initPromise;
      }
    },

    transactionProvider(config) {
      let trx;
      return () => {
        if (!trx) {
          trx = this.transaction(undefined, config);
        }
        return trx;
      };
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
        knexClone.client = Object.create(this.client.constructor.prototype); // Clone client to avoid leaking listeners that are set on it
        merge(knexClone.client, this.client);
        knexClone.client.config = Object.assign({}, this.client.config); // Clone client config to make sure they can be modified independently
      }

      redefineProperties(knexClone, knexClone.client);
      _copyEventListeners('query', knexFn, knexClone);
      _copyEventListeners('query-error', knexFn, knexClone);
      _copyEventListeners('query-response', knexFn, knexClone);
      _copyEventListeners('start', knexFn, knexClone);
      knexClone.userParams = params;
      return knexClone;
    },
  });

  if (!knexFn.context) {
    knexFn.context = knexContext;
  }
}

function _copyEventListeners(eventName, sourceKnex, targetKnex) {
  const listeners = sourceKnex.listeners(eventName);
  listeners.forEach((listener) => {
    targetKnex.on(eventName, listener);
  });
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
        knex.transactionProvider = context.transactionProvider;
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
  knex.client = client;
  knex.client.makeKnex = makeKnex;
  knex.userParams = {};

  // Hook up the "knex" object as an EventEmitter.
  const ee = new EventEmitter();
  for (const key in ee) {
    knex[key] = ee[key];
  }

  // Unfortunately, something seems to be broken in Node 6 and removing events from a clone also mutates original Knex,
  // which is highly undesirable
  if (knex._internalListeners) {
    knex._internalListeners.forEach(({ eventName, listener }) => {
      knex.client.removeListener(eventName, listener); // Remove duplicates for copies
    });
  }
  knex._internalListeners = [];

  // Passthrough all "start" and "query" events to the knex object.
  _addInternalListener(knex, 'start', (obj) => {
    knex.emit('start', obj);
  });
  _addInternalListener(knex, 'query', (obj) => {
    knex.emit('query', obj);
  });
  _addInternalListener(knex, 'query-error', (err, obj) => {
    knex.emit('query-error', err, obj);
  });
  _addInternalListener(knex, 'query-response', (response, obj, builder) => {
    knex.emit('query-response', response, obj, builder);
  });
}

function _addInternalListener(knex, eventName, listener) {
  knex.client.on(eventName, listener);
  knex._internalListeners.push({
    eventName,
    listener,
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

module.exports = makeKnex;

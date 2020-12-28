const Client = require('./client');
const QueryBuilder = require('./query/builder');
const QueryInterface = require('./query/methods');

const makeKnex = require('./util/make-knex');
const { KnexTimeoutError } = require('./util/timeout');
const { resolveConfig } = require('./config-resolver');

function Knex(config) {
  const { resolvedConfig, Dialect } = resolveConfig(...arguments);

  const newKnex = makeKnex(new Dialect(resolvedConfig));
  if (resolvedConfig.userParams) {
    newKnex.userParams = resolvedConfig.userParams;
  }

  if (config.defaultSchema) {
    newKnex.withSchema(config.defaultSchema);
  }

  return newKnex;
}

// Expose Client on the main Knex namespace.
Knex.Client = Client;

Knex.KnexTimeoutError = KnexTimeoutError;

Knex.QueryBuilder = {
  extend: function (methodName, fn) {
    QueryBuilder.extend(methodName, fn);
    QueryInterface.push(methodName);
  },
};

module.exports = Knex;

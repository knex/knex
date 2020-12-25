const Raw = require('./raw');
const Client = require('./client');
const QueryBuilder = require('./query/builder');
const QueryInterface = require('./query/methods');

const makeKnex = require('./util/make-knex');
const { KnexTimeoutError } = require('./util/timeout');
const fakeClient = require('./util/fake-client');
const { resolveConfig } = require('./config-resolver');

function Knex(config) {
  const { resolvedConfig, Dialect } = resolveConfig(...arguments);

  const newKnex = makeKnex(new Dialect(resolvedConfig));
  if (resolvedConfig.userParams) {
    newKnex.userParams = resolvedConfig.userParams;
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

// Run a "raw" query, though we can't do anything with it other than put
// it in a query statement.
Knex.raw = (sql, bindings) => {
  console.warn(
    'global Knex.raw is deprecated, use knex.raw (chain off an initialized knex object)'
  );
  return new Raw(fakeClient).set(sql, bindings);
};

module.exports = Knex;

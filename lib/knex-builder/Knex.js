const Client = require('../client');
const QueryBuilder = require('../query/querybuilder');
const QueryInterface = require('../query/method-constants');
const Raw = require('../raw');

const makeKnex = require('./make-knex');
const { KnexTimeoutError } = require('../util/timeout');
const { KnexPool } = require('../pool');
const { resolveConfig } = require('./internal/config-resolver');
const SchemaBuilder = require('../schema/builder');
const ViewBuilder = require('../schema/viewbuilder');
const ColumnBuilder = require('../schema/columnbuilder');
const TableBuilder = require('../schema/tablebuilder');

function knex(config) {
  const { resolvedConfig, Dialect } = resolveConfig(...arguments);

  const newKnex = makeKnex(new Dialect(resolvedConfig));
  if (resolvedConfig.userParams) {
    newKnex.userParams = resolvedConfig.userParams;
  }
  return newKnex;
}

// Expose Client on the main Knex namespace.
knex.Client = Client;

knex.KnexTimeoutError = KnexTimeoutError;
knex.KnexPool = KnexPool;

// Expose the real QueryBuilder class (not just an extend shim) so consumers
// can use it for instanceof checks. extend() keeps its documented behavior of
// also registering the method on the query interface.
knex.QueryBuilder = QueryBuilder;
const queryBuilderExtend = QueryBuilder.extend;
knex.QueryBuilder.extend = function (methodName, fn) {
  queryBuilderExtend(methodName, fn);
  QueryInterface.push(methodName);
};

// Expose the Raw class for instanceof checks (e.g. telling a Raw apart from
// a QueryBuilder before passing a value along).
knex.Raw = Raw;

knex.SchemaBuilder = {
  extend: function (methodName, fn) {
    SchemaBuilder.extend(methodName, fn);
  },
};

knex.ViewBuilder = {
  extend: function (methodName, fn) {
    ViewBuilder.extend(methodName, fn);
  },
};

knex.ColumnBuilder = {
  extend: function (methodName, fn) {
    ColumnBuilder.extend(methodName, fn);
  },
};

knex.TableBuilder = {
  extend: function (methodName, fn) {
    TableBuilder.extend(methodName, fn);
  },
};

module.exports = knex;

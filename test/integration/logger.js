/*global expect, d*/

'use strict';

const _ = require('lodash')
const expect = require('expect')

module.exports = function(knex) {

  const client = knex.client;

  function compareBindings(gotBindings, wantedBindings) {
    if (Array.isArray(wantedBindings)) {
      expect(gotBindings.length).toEqual(wantedBindings.length);
      wantedBindings.forEach(function (wantedBinding, index) {
        if (typeof wantedBinding === 'function') {
          expect(wantedBinding(gotBindings[index])).toEqual(true);
        } else {
          expect(wantedBinding).toEqual(gotBindings[index]);
        }
      });
    } else {
      expect(gotBindings).toEqual(wantedBindings);
    }
  }

  // Useful in cases where we want to just test the sql for both PG and SQLite3
  function testSqlTester(qb, driverName, statement, bindings, returnval) {

    if (Array.isArray(driverName)) {
      driverName.forEach(function(val) {
        testSqlTester(qb, val, statement, bindings, returnval);
      });
    } else if (client.driverName === driverName) {
      const sql = qb.toSQL();

      if (statement) {
        if (Array.isArray(sql)) {
          expect(_.map(sql, 'sql')).toEqual(statement);
        } else {
          expect(sql.sql).toEqual(statement);
        }
      }
      if (bindings) {
        if (Array.isArray(sql)) {
          compareBindings(_.map(sql, 'bindings'), bindings);
        } else {
          compareBindings(sql.bindings, bindings);
        }
      }
      if (returnval !== undefined && returnval !== null) {
        const oldThen = qb.then;
        qb.then = function() {
          let promise = oldThen.apply(this, []);
          promise = promise.tap(function(resp) {
            if (typeof returnval === 'function') {
              expect(!!returnval(resp)).toEqual(true);
            } else {
              expect(stripDates(resp)).toEqual(returnval);
            }
          });
          return promise.then.apply(promise, arguments);
        };
      }
    }
  }

  function stripDates(resp) {
    if (!_.isObject(resp[0])) return resp;
    return _.map(resp, function(val) {
      return _.reduce(val, function(memo, val, key) {
        if (_.includes(['created_at', 'updated_at'], key)) {
          memo[key] = d;
        } else {
          memo[key] = val;
        }
        return memo;
      }, {});
    });
  }

  function makeTestSQL(builder) {
    const tester = testSqlTester.bind(null, builder)
    return function(handler) {
      handler(tester)
      return this
    }
  }

  const originalRaw = knex.raw
  const originalQueryBuilder = client.queryBuilder
  const originalSchemaBuilder = client.schemaBuilder

  knex.raw = function() {
    const raw = originalRaw.apply(this, arguments)
    raw.testSql = makeTestSQL(raw)
    return raw
  }
  client.queryBuilder = function() {
    const qb = originalQueryBuilder.apply(this, arguments)
    qb.testSql = makeTestSQL(qb)
    return qb
  }
  client.schemaBuilder = function() {
    const sb = originalSchemaBuilder.apply(this, arguments)
    sb.testSql = makeTestSQL(sb)
    return sb
  }

  return knex;
}

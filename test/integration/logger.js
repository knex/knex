/*global expect, d*/

'use strict';

var _ = require('lodash')

module.exports = function(knex) {

  var client  = knex.client;

  function compareBindings(gotBindings, wantedBindings) {
    if (Array.isArray(wantedBindings)) {
      expect(gotBindings.length).to.eql(wantedBindings.length);
      wantedBindings.forEach(function (wantedBinding, index) {
        if (typeof wantedBinding === 'function') {
          expect(wantedBinding(gotBindings[index])).to.eql(true);
        } else {
          expect(wantedBinding).to.eql(gotBindings[index]);
        }
      });
    } else {
      expect(gotBindings).to.eql(wantedBindings);
    }
  }

  // Useful in cases where we want to just test the sql for both PG and SQLite3
  function testSqlTester(qb, driverName, statement, bindings, returnval) {

    if (Array.isArray(driverName)) {
      driverName.forEach(function(val) {
        testSqlTester(qb, val, statement, bindings, returnval);
      });
    } else if (client.driverName === driverName) {
      var sql = qb.toSQL();

      if (statement) {
        if (Array.isArray(sql)) {
          expect(_.map(sql, 'sql')).to.eql(statement);
        } else {
          expect(sql.sql).to.equal(statement);
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
        var oldThen = qb.then;
        qb.then = function() {
          var promise = oldThen.apply(this, []);
          promise = promise.tap(function(resp) {
            if (typeof returnval === 'function') {
              expect(!!returnval(resp)).to.equal(true);
            } else {
              expect(stripDates(resp)).to.eql(returnval);
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
    var tester = testSqlTester.bind(null, builder)
    return function(handler) {
      handler(tester)
      return this
    }
  }

  var originalRaw = client.raw
  var originalQueryBuilder = client.queryBuilder
  var originalSchemaBuilder = client.schemaBuilder
  client.raw = function() {
    var raw = originalRaw.apply(this, arguments)
    raw.testSql = makeTestSQL(raw)
    return raw
  }
  client.queryBuilder = function() {
    var qb = originalQueryBuilder.apply(this, arguments)
    qb.testSql = makeTestSQL(qb)
    return qb
  }
  client.schemaBuilder = function() {
    var sb = originalSchemaBuilder.apply(this, arguments)
    sb.testSql = makeTestSQL(sb)
    return sb
  }

  return knex;
}

/*global expect, d*/

'use strict';

module.exports = function () {

  var _ = require('lodash');

  // This is where all of the info from the query calls goes...
  return {
    client: function(knex) {
      var Raw = require('../../lib/raw');
      var client = knex.client;
      client.initSchema();

      var aliases = {
        'pg': 'postgresql',
        'sqlite': 'sqlite3'
      };

      function compareBindings(gotBindings, wantedBindings) {
        if (_.isArray(wantedBindings)) {
          expect(gotBindings.length).to.eql(wantedBindings.length);

          _.each(wantedBindings, function (wantedBinding, index) {
            if (_.isFunction(wantedBinding)) {
              expect(wantedBinding(gotBindings[index])).to.eql(true);
            } else {
              expect(wantedBinding).to.eql(gotBindings[index]);
            }
          });
        } else {
          expect(gotBindings).to.eql(wantedBindings);
        }
      }

      function testSqlTester(qb, dialect, statement, bindings, returnval) {
        // Useful in cases where we want to just test the sql for both PG and SQLite3
        if (_.isArray(dialect)) {
          _.each(dialect, function(val) {
            testSqlTester.call(this, val, statement, bindings, returnval);
          }, qb);
        } else if (client.dialect === dialect || aliases[dialect] === client.dialect) {
          var sql = qb.toSQL();

          if (statement) {
            if (_.isArray(sql)) {
              expect(_.pluck(sql, 'sql')).to.eql(statement);
            } else {
              expect(sql.sql).to.equal(statement);
            }
          }
          if (bindings) {
            if (_.isArray(sql)) {
              compareBindings(_.pluck(sql, 'bindings'), bindings);
            } else {
              compareBindings(sql.bindings, bindings);
            }
          }
          if (returnval !== undefined && returnval !== null) {
            var oldThen = qb.then;
            qb.then = function() {
              var promise = oldThen.apply(this, []);
              promise = promise.tap(function(resp) {
                if (_.isFunction(returnval)) {
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
            if (_.contains(['created_at', 'updated_at'], key)) {
              memo[key] = d;
            } else {
              memo[key] = val;
            }
            return memo;
          }, {});
        });
      }

      Raw.prototype.testSql =
      client.QueryBuilder.prototype.testSql =
      client.SchemaBuilder.prototype.testSql = function Logger$testSql(handler) {
        handler(_.bind(testSqlTester, null, this));
        return this;
      };

      return knex;
    }
  };
};

module.exports = function(testSuite) {

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
      var matches = ['mysql', 'pg', 'sqlite', 'sqlite3', 'postgresql'];

      function testSqlTester(dialect, statement, bindings, returnval) {
        // Useful in cases where we want to just test the sql for both PG and SQLite3
        if (_.isArray(dialect)) {
          _.each(dialect, function(val) {
            testSqlTester.call(this, val, statement, bindings, returnval);
          }, this);
        } else if (client.dialect === dialect || aliases[dialect] === client.dialect) {
          var sql = this.toSQL();

          if (statement != null) {
            if (_.isArray(sql)) {
              expect(_.pluck(sql, 'sql')).to.eql(statement);
            } else {
              expect(sql.sql).to.equal(statement);
            }
          }
          if (bindings != null) {
            if (_.isArray(sql)) {
              expect(_.pluck(sql, 'bindings')).to.eql(bindings);
            } else {
              expect(sql.bindings).to.eql(bindings);
            }
          }
          if (returnval != null) {
            var oldThen = this.then;
            this.then = function() {
              var promise = oldThen.apply(this, []);
              promise = promise.tap(function(resp) {
                expect(stripDates(resp)).to.eql(returnval);
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
        handler(_.bind(testSqlTester, this));
        return this;
      };

      return knex;
    }
  };
};
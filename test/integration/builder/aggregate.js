/*global describe, it*/

'use strict';

module.exports = function(knex) {

  describe('Aggregate', function() {

    it('has a sum', function() {

      return knex('accounts').sum('logins').testSql(function(tester) {
          tester(
            'mysql',
            'select sum(`logins`) from `accounts`',
            [],
            [{
              'sum(`logins`)': 10
            }]
          );
          tester(
            'postgresql',
            'select sum("logins") from "accounts"',
            [],
            [{
              sum: '10'
            }]
          );
          tester(
            'sqlite3',
            'select sum("logins") from "accounts"',
            [],
            [{
              'sum("logins")': 10
            }]
          );
          tester(
            'oracle',
            'select sum("logins") from "accounts"',
            [],
            [{
              'SUM("LOGINS")': 10
            }]
          );
          tester(
            'fdbsql',
            'select sum("logins") from "accounts"',
            [],
            [{
              _SQL_COL_1: '10'
            }]
          );
      });
    });

    it('has an avg', function() {

      return knex('accounts').avg('logins').testSql(function(tester) {

        function checkResRange(key, resp) {
          return Math.abs(10/6 - +(resp[0][key])) < 0.001;
        }

        // mysql: 1.6667
        tester('mysql', 'select avg(`logins`) from `accounts`', [], checkResRange.bind(null, 'avg(`logins`)'));
        // sqlite: 1.6666666666666667
        tester('sqlite3', 'select avg("logins") from "accounts"', [], checkResRange.bind(null, 'avg("logins")'));
        // postgres: '1.6666666666666667'
        tester('postgresql', 'select avg("logins") from "accounts"', [], checkResRange.bind(null, 'avg'));
        // oracle: 1.66666666666667
        tester('oracle', 'select avg("logins") from "accounts"', [], checkResRange.bind(null, 'AVG("LOGINS")'));
        // fdbsql: '1.6666666666666667'
        tester('fdbsql', 'select avg("logins") from "accounts"', [], checkResRange.bind(null, '_SQL_COL_1'));
      });

    });

    it('has a count', function() {

      return knex('accounts').count('id').testSql(function(tester) {
          tester(
          'mysql',
          'select count(`id`) from `accounts`',
          [],
          [{
            'count(`id`)': 6
          }]
        );
        tester(
          'postgresql',
          'select count("id") from "accounts"',
          [],
          [{
            count: '6'
          }]
        );
        tester(
          'sqlite3',
          'select count("id") from "accounts"',
          [],
          [{
            'count("id")': 6
          }]
        );
        tester(
          'oracle',
          'select count("id") from "accounts"',
          [],
          [{
            'COUNT("ID")': 6
          }]
        );
        tester(
          'fdbsql',
          'select count("id") from "accounts"',
          [],
          [{
            _SQL_COL_1: '6'
          }]
        );
      });

    });

    it('supports multiple aggregate functions', function() {

      return knex('accounts').count('id').max('logins').min('logins').testSql(function(tester) {
        tester(
          'mysql',
          'select count(`id`), max(`logins`), min(`logins`) from `accounts`',
          [],
          [{
            'count(`id`)': 6,
            'max(`logins`)': 2,
            'min(`logins`)': 1
          }]
        );
        tester(
          'postgresql',
          'select count("id"), max("logins"), min("logins") from "accounts"',
          [],
          [{
            count: '6',
            max: 2,
            min: 1
          }]
        );
        tester(
          'sqlite3',
          'select count("id"), max("logins"), min("logins") from "accounts"',
          [],
          [{
            'count("id")': 6,
            'max("logins")': 2,
            'min("logins")': 1
          }]
        );
        tester(
          'oracle',
          'select count("id"), max("logins"), min("logins") from "accounts"',
          [],
          [{
            'COUNT("ID")': 6,
            'MAX("LOGINS")': 2,
            'MIN("LOGINS")': 1
          }]
        );
        tester(
          'fdbsql',
          'select count("id"), max("logins"), min("logins") from "accounts"',
          [],
          [{
            _SQL_COL_1: '6',
            _SQL_COL_2: 2,
            _SQL_COL_3: 1
          }]
        );
      });

    });

    it("support the groupBy function", function() {

      return knex('accounts').count('id').groupBy('logins').testSql(function(tester) {
        tester(
          'mysql',
          'select count(`id`) from `accounts` group by `logins`',
          [],
          [{
            'count(`id`)': 2
          },{
            'count(`id`)': 4
          }]
        );
        tester(
          'postgresql',
          'select count("id") from "accounts" group by "logins"',
          [],
          [{
            count: '2'
          },{
            count: '4'
          }]
        );
        tester(
          'sqlite3',
          'select count("id") from "accounts" group by "logins"',
          [],
          [{
            'count("id")': 2
          },{
            'count("id")': 4
          }]
        );
        tester(
          'oracle',
          'select count("id") from "accounts" group by "logins"',
          [],
          [{
            'COUNT("ID")': 2
          },{
            'COUNT("ID")': 4
          }]
        );
        tester(
          'fdbsql',
          'select count("id") from "accounts" group by "logins"',
          [],
          [{
            _SQL_COL_1: '2'
          },{
            _SQL_COL_1: '4'
          }]
        );


      }).then(function() {
        return knex('accounts').count('id').groupBy('first_name').testSql(function(tester) {
          tester(
            'mysql',
            'select count(`id`) from `accounts` group by `first_name`',
            [],
            [{
              'count(`id`)': 6
            }]
          );
          tester(
            'postgresql',
            'select count("id") from "accounts" group by "first_name"',
            [],
            [{
              count: '6'
            }]
          );
          tester(
            'sqlite3',
            'select count("id") from "accounts" group by "first_name"',
            [],
            [{
              'count("id")': 6
            }]
          );

          tester(
            'oracle',
            'select count("id") from "accounts" group by "first_name"',
            [],
            [{
              'COUNT("ID")': 6
            }]
          );
          tester(
            'fdbsql',
            'select count("id") from "accounts" group by "first_name"',
            [],
            [{
              _SQL_COL_1: '6'
            }]
          );
        });
      });

    });

  });


};

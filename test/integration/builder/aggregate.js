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
            'mysql2',
            'select sum(`logins`) from `accounts`',
            [],
            [{
              'sum(`logins`)': '10'
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
            'pg-redshift',
            'select sum("logins") from "accounts"',
            [],
            [{
              sum: '10'
            }]
          );
          tester(
            'sqlite3',
            'select sum(`logins`) from `accounts`',
            [],
            [{
              'sum(`logins`)': 10
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
            'mssql',
            'select sum([logins]) from [accounts]',
            [],
            [{
              '': 10
            }]
          );
      });
    });

    it('has an avg', function() {

      return knex('accounts').avg('logins').testSql(function(tester) {

        function checkResRange(key, resp) {
          return Math.abs(10/6 - +(resp[0][key])) < 0.001;
        }
        function checkResRangeMssql(key, resp) {
          return +(resp[0][key]) === 1;
        }

        // mysql: 1.6667
        tester('mysql', 'select avg(`logins`) from `accounts`', [], checkResRange.bind(null, 'avg(`logins`)'));
        // sqlite: 1.6666666666666667
        tester('sqlite3', 'select avg(`logins`) from `accounts`', [], checkResRange.bind(null, 'avg(`logins`)'));
        // postgres: '1.6666666666666667'
        tester('postgresql', 'select avg("logins") from "accounts"', [], checkResRange.bind(null, 'avg'));
        // postgres: '1.6666666666666667'
        tester('pg-redshift', 'select avg("logins") from "accounts"', [], checkResRangeMssql.bind(null, 'avg'));
        // oracle: 1.66666666666667
        tester('oracle', 'select avg("logins") from "accounts"', [], checkResRange.bind(null, 'AVG("LOGINS")'));
        // mssql: 1
        tester('mssql', 'select avg([logins]) from [accounts]', [], checkResRangeMssql.bind(null, ''));
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
          'pg-redshift',
          'select count("id") from "accounts"',
          [],
          [{
            count: '6'
          }]
        );
        tester(
          'sqlite3',
          'select count(`id`) from `accounts`',
          [],
          [{
            'count(`id`)': 6
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
          'mssql',
          'select count([id]) from [accounts]',
          [],
          [{
            '': 6
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
          'pg-redshift',
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
          'select count(`id`), max(`logins`), min(`logins`) from `accounts`',
          [],
          [{
            'count(`id`)': 6,
            'max(`logins`)': 2,
            'min(`logins`)': 1
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
          'mssql',
          'select count([id]), max([logins]), min([logins]) from [accounts]',
          [],
          [{
            '': [6, 2, 1]
          }]
        );
      });

    });

    it('has distinct modifier for aggregates', function() {

      return knex('accounts').countDistinct('id').sumDistinct('logins').avgDistinct('logins').testSql(function(tester) {
        tester(
            'mysql',
            'select count(distinct `id`), sum(distinct `logins`), avg(distinct `logins`) from `accounts`',
            [],
            [{
              'count(distinct `id`)': 6,
              'sum(distinct `logins`)': 3,
              'avg(distinct `logins`)': 1.5
            }]
        );
        tester(
            'postgresql',
            'select count(distinct "id"), sum(distinct "logins"), avg(distinct "logins") from "accounts"',
            [],
            [{
              count: '6',
              sum: 3,
              avg: 1.5
            }]
        );
        tester(
            'pg-redshift',
            'select count(distinct "id"), sum(distinct "logins"), avg(distinct "logins") from "accounts"',
            [],
            [{
              count: '6',
              sum: '3',
              avg: '1'
            }]
        );
        tester(
            'sqlite3',
            'select count(distinct `id`), sum(distinct `logins`), avg(distinct `logins`) from `accounts`',
            [],
            [{
              'count(distinct `id`)': 6,
              'sum(distinct `logins`)': 3,
              'avg(distinct `logins`)': 1.5
            }]
        );
        tester(
            'oracle',
            'select count(distinct "id"), sum(distinct "logins"), avg(distinct "logins") from "accounts"',
            [],
            [{
              'COUNT(DISTINCT "ID")': 6,
              'SUM(DISTINCT "LOGINS")': 3,
              'AVG(DISTINCT "LOGINS")': 1.5
            }]
        );
        tester(
            'mssql',
            'select count(distinct [id]), sum(distinct [logins]), avg(distinct [logins]) from [accounts]',
            [],
            [{
              '': [6, 3, 1]
            }]
        );
      });

    });

    const testWithMultipleColumns = knex.client.driverName === 'mysql' || 
      knex.client.driverName === 'postgresql';

    it('supports countDistinct with multiple columns', function() {
      if (!testWithMultipleColumns) {
        return this.skip();
      }

      return knex('accounts').countDistinct('id', 'logins').testSql(function(tester) {
        tester(
          'mysql',
          'select count(distinct `id`, `logins`) from `accounts`',
          [],
          [{
            'count(distinct `id`, `logins`)': 6
          }]
        );
        tester(
          'postgresql',
          'select count(distinct("id", "logins")) from "accounts"',
          [],
          [{
            count: '6'
          }]
        );
      });

    });

    it('supports countDistinct with multiple columns with alias', function () {
      if (!testWithMultipleColumns) {
        return this.skip();
      }

      return knex('accounts').countDistinct({ count: ['id', 'logins'] })
        .testSql(function (tester) {
          tester(
            'mysql',
            'select count(distinct `id`, `logins`) as `count` from `accounts`',
            [],
            [{
              count: 6
            }]
          );
          tester(
            'postgresql',
            'select count(distinct("id", "logins")) as "count" from "accounts"',
            [],
            [{
              count: '6'
            }]
          );
        });

    });

    it("support the groupBy function", function() {

      return knex('accounts').count('id').groupBy('logins').orderBy('logins', 'asc').testSql(function(tester) {
        tester(
          'mysql',
          'select count(`id`) from `accounts` group by `logins` order by `logins` asc',
          [],
          [{
            'count(`id`)': 2
          },{
            'count(`id`)': 4
          }]
        );
        tester(
          'postgresql',
          'select count("id") from "accounts" group by "logins" order by "logins" asc',
          [],
          [{
            count: '2'
          },{
            count: '4'
          }]
        );
        tester(
          'pg-redshift',
          'select count("id") from "accounts" group by "logins" order by "logins" asc',
          [],
          [{
            count: '2'
          },{
            count: '4'
          }]
        );
        tester(
          'sqlite3',
          'select count(`id`) from `accounts` group by `logins` order by `logins` asc',
          [],
          [{
            'count(`id`)': 2
          },{
            'count(`id`)': 4
          }]
        );
        tester(
          'oracle',
          'select count("id") from "accounts" group by "logins" order by "logins" asc',
          [],
          [{
            'COUNT("ID")': 2
          },{
            'COUNT("ID")': 4
          }]
        );
        tester(
          'mssql',
          'select count([id]) from [accounts] group by [logins] order by [logins] asc',
          [],
          [{
            '': 2
          },{
            '': 4
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
            'pg-redshift',
            'select count("id") from "accounts" group by "first_name"',
            [],
            [{
              count: '6'
            }]
          );
          tester(
            'sqlite3',
            'select count(`id`) from `accounts` group by `first_name`',
            [],
            [{
              'count(`id`)': 6
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
            'mssql',
            'select count([id]) from [accounts] group by [first_name]',
            [],
            [{
              '': 6
            }]
          );
        });
      });

    });

  });


};

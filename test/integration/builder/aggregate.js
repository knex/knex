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
      });

    });

    it('has an avg', function() {

      return knex('accounts').avg('logins').testSql(function(tester) {
        tester('mysql', 'select avg(`logins`) from `accounts`', [], [{
          'avg(`logins`)': 1.6667
        }]);
        tester('sqlite3', 'select avg("logins") from "accounts"', [], [{
          'avg("logins")': 1.6666666666666667
        }]);
        tester('postgresql', 'select avg("logins") from "accounts"', [], [{
          avg: '1.6666666666666667'
        }]);
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
        });
      });

    });


    it('has an avg', function() {

      return knex('accounts').avg('logins').testSql(function(tester) {
        tester('mysql', 'select avg(`logins`) from `accounts`', [], [{
          'avg(`logins`)': 1.6667
        }]);
        tester('postgresql', 'select avg("logins") from "accounts"', [], [{
          avg: '1.6666666666666667'
        }]);
        tester('sqlite3', 'select avg("logins") from "accounts"', [], [{
          'avg("logins")': 1.6666666666666667
        }]);
      });

    });


  });


};

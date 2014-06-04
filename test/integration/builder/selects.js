var Promise = testPromise;

module.exports = function(knex) {

  describe('Selects', function() {

    it('runs with no conditions', function() {

      return knex('accounts').select();

    });

    it('returns an array of a single column with `pluck`', function() {
      return knex.pluck('id').from('accounts')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `id` from `accounts`',
            [],
            [1, 2, 3, 4, 5, 7]
          );
          tester(
            'postgresql',
            'select "id" from "accounts"',
            [],
            ['1', '2', '3', '4', '5', '7']
          );
          tester(
            'sqlite3',
            'select "id" from "accounts"',
            [],
            [1, 2, 3, 4, 5, 6]
          );
        });
    });

    it('returns a single entry with first', function() {
      return knex.first('id', 'first_name').from('accounts')
        .testSql(function(tester) {
          tester(
            'mysql',
            'select `id`, `first_name` from `accounts` limit ?',
            [1],
            { id: 1, first_name: 'Test' }
          );
          tester(
            'postgresql',
            'select "id", "first_name" from "accounts" limit ?',
            [1],
            { id: '1', first_name: 'Test' }
          );
          tester(
            'sqlite3',
            'select "id", "first_name" from "accounts" limit ?',
            [1],
            { id: 1, first_name: 'Test' }
          );
        });
    });


    it('allows you to stream', function() {
      var count = 0;
      return knex('accounts').stream(function(rowStream) {
        rowStream.on('data', function(chunk) {
          count++;
        });
      }).then(function() {
        assert(count === 6, 'Six rows should have been streamed');
      }).catch(function(e) {
        // Don't worry about failing streaming tests in 0.8
        if (process.version.indexOf('0.8') === -1) {
          throw e;
        }
      });
    });

    it('throws errors on the exec if uncaught in the last block', function(ok) {

      var listeners = process.listeners('uncaughtException');

      process.removeAllListeners('uncaughtException');

      process.on('uncaughtException', function() {
        process.removeAllListeners('uncaughtException');
        for (var i = 0, l = listeners.length; i < l; i++) {
          process.on('uncaughtException', listeners[i]);
        }
        ok();
      });

      knex('accounts').select().exec(function() {
        console.log(undefinedVar);
      });
    });

    it('uses `orderBy`', function() {
      return knex('accounts')
        .select()
        .orderBy('id', 'asc');
    });

    describe('simple "where" cases', function() {

      it('allows key, value', function() {

        return knex('accounts')
          .where('id', 1)
          .select('first_name', 'last_name')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `first_name`, `last_name` from `accounts` where `id` = ?',
              [1]
            );
            tester(
              'postgresql',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1]
            );
            tester(
              'sqlite3',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1]
            );
          });
      });

      it('allows key, operator, value', function() {

        return knex('accounts')
          .where('id', 1)
          .select('first_name', 'last_name')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `first_name`, `last_name` from `accounts` where `id` = ?',
              [1]
            );
            tester(
              'postgresql',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1]
            );
            tester(
              'sqlite3',
              'select "first_name", "last_name" from "accounts" where "id" = ?',
              [1]
            );
          });
      });

      it('allows selecting columns with an array', function() {

        return knex('accounts')
          .where('id', '>', 1)
          .select(['email', 'logins'])
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `email`, `logins` from `accounts` where `id` > ?',
              [1]
            );
            tester(
              'postgresql',
              'select "email", "logins" from "accounts" where "id" > ?',
              [1]
            );
            tester(
              'sqlite3',
              'select "email", "logins" from "accounts" where "id" > ?',
              [1]
            );
          });
      });

      it('allows a hash of where attrs', function() {

        return knex('accounts')
          .where({'id': 1})
          .select('*')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select * from `accounts` where `id` = ?',
              [1],
              [{
                id: 1,
                first_name: "Test",
                last_name: "User",
                email: "test@example.com",
                logins: 1,
                about: "Lorem ipsum Dolore labore incididunt enim.",
                created_at: d,
                updated_at: d,
                phone: null
              }]
            );
            tester(
              'postgresql',
              'select * from "accounts" where "id" = ?',
              [1]
            );
            tester(
              'sqlite3',
              'select * from "accounts" where "id" = ?',
              [1]
            );
          });
      });

      it('allows where id: undefined or id: null as a where null clause', function() {

        return knex('accounts')
          .where({'id': null})
          .select('first_name', 'email')
          .testSql(function(tester) {
            tester(
              'mysql',
              'select `first_name`, `email` from `accounts` where `id` is null',
              []
            );
            tester(
              'postgresql',
              'select "first_name", "email" from "accounts" where "id" is null',
              []
            );
            tester(
              'sqlite3',
              'select "first_name", "email" from "accounts" where "id" is null',
              []
            );
          });

      });

      it('allows where id = 0', function() {

        return knex('accounts')
          .where({'id': 0})
          .select()
          .testSql(function(tester) {
            tester(
              'mysql',
              'select * from `accounts` where `id` = ?',
              [0]
            );
            tester(
              'postgresql',
              'select * from "accounts" where "id" = ?',
              [0]
            );
            tester(
              'sqlite3',
              'select * from "accounts" where "id" = ?',
              [0]
            );
          });
      });

    });

    it('has a "distinct" clause', function() {
      return Promise.all([
        knex('accounts').select().distinct('email').where('logins', 2).orderBy('email'),
        knex('accounts').distinct('email').select().orderBy('email')
      ]);
    });

    it('does "orWhere" cases', function() {
      return knex('accounts').where('id', 1).orWhere('id', '>', 2).select('first_name', 'last_name');
    });

    it('does "andWhere" cases', function() {
      return knex('accounts').select('first_name', 'last_name', 'about').where('id', 1).andWhere('email', 'test@example.com');
    });

    it('takes a function to wrap nested where statements', function() {
      return Promise.all([
        knex('accounts').where(function() {
          this.where('id', 2);
          this.orWhere('id', 3);
        }).select('*')
      ]);
    });

    it('handles "where in" cases', function() {
      return Promise.all([
        knex('accounts').whereIn('id', [1, 2, 3]).select()
      ]);
    });

    it('handles "or where in" cases', function() {
      return knex('accounts')
        .where('email', 'test@example.com')
        .orWhereIn('id', [2, 3, 4])
        .select();
    });

    it('handles multi-column "where in" cases', function() {
      if (knex.client.dialect != 'sqlite3') {
        return knex('composite_key_test')
          .whereIn(['column_a', 'column_b'], [[1, 1], [1, 2]])
          .select()
          .testSql(function(tester) {
            tester('mysql',
              'select * from `composite_key_test` where (`column_a`,`column_b`) in ((?, ?),(?, ?))',
              [1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              },{
                column_a: 1,
                column_b: 2,
                details: 'One, Two, Zero',
                status: 0
            }]);
            tester('postgresql',
              'select * from "composite_key_test" where ("column_a","column_b") in ((?, ?),(?, ?))',
              [1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              },{
                column_a: 1,
                column_b: 2,
                details: 'One, Two, Zero',
                status: 0
              }]);
          });
      }
    });

    it('handles multi-column "where in" cases with where', function() {
      if (knex.client.dialect != 'sqlite3') {
        return knex('composite_key_test')
          .where('status', 1)
          .whereIn(['column_a', 'column_b'], [[1, 1], [1, 2]])
          .select()
          .testSql(function(tester) {
            tester('mysql',
              'select * from `composite_key_test` where `status` = ? and (`column_a`,`column_b`) in ((?, ?),(?, ?))',
              [1,1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              }]);
            tester('postgresql',
              'select * from "composite_key_test" where "status" = ? and ("column_a","column_b") in ((?, ?),(?, ?))',
              [1,1,1,1,2],
              [{
                column_a: 1,
                column_b: 1,
                details: 'One, One, One',
                status: 1
              }]);
          });
      }
    });

    it('handles "where exists"', function() {
      return knex('accounts')
        .whereExists(function() {
          this.select('id').from('test_table_two').where({id: 1});
        })
        .select();
    });

    it('handles "where between"', function() {
      return knex('accounts').whereBetween('id', [1, 100]).select();
    });

    it('handles "or where between"', function() {
      return knex('accounts')
        .whereBetween('id', [1, 100])
        .orWhereBetween('id', [200, 300])
        .select();
    });

    it('does where(raw)', function() {
      return knex('accounts')
        .whereExists(function() {
          this.select(knex.raw(1))
            .from('test_table_two')
            .where(knex.raw('test_table_two.account_id = accounts.id'));
        })
        .select();
    });

    it('does sub-selects', function() {
      return knex('accounts').whereIn('id', function() {
        this.select('account_id').from('test_table_two').where('status', 1);
      }).select('first_name', 'last_name');
    });

    it("supports the <> operator", function() {
      return knex('accounts').where('id', '<>', 2).select('email', 'logins');
    });

    it("Allows for knex.Raw passed to the `where` clause", function() {
      return knex('accounts').where(knex.raw('id = 2')).select('email', 'logins');
    });

    it('Retains array bindings, #228', function() {
      var raw  = knex.raw('select * from table t where t.id = ANY( $1::int[] )', [[1, 2, 3]]);
      var raw2 = knex.raw('select "stored_procedure"(?, ?, ?)', [1, 2, ['a', 'b', 'c']]);
      expect(raw.toSQL().bindings).to.eql([[1, 2, 3]]);
      expect(raw2.toSQL().bindings).to.eql([1, 2, ['a', 'b', 'c']]);
    });

    it('always returns the response object from raw', function() {
      if (knex.client.dialect === 'postgresql') {
        return knex.raw('select id from accounts').then(function(resp) {
          assert(Array.isArray(resp.rows) === true);
        });
      }
    });

  });

};
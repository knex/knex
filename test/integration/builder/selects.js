var Promise = testPromise;

module.exports = function(knex) {

  describe('Selects', function() {

    it('runs with no conditions', function() {

      return knex('accounts').select();

    });

    it('throws errors on the exec if uncaught in the last block', function(ok) {

      var listeners = process.listeners('uncaughtException');

      process.removeAllListeners('uncaughtException');

      process.on('uncaughtException', function(err) {
        process.removeAllListeners('uncaughtException');
        for (var i = 0, l = listeners.length; i < l; i++) {
          process.on('uncaughtException', listeners[i]);
        }
        ok();
      });

      knex('accounts').select().exec(function(err, resp) {
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

        return knex('accounts').logMe('sql').where('id', 1).select('first_name', 'last_name');

      });

      it('allows key, operator, value', function() {

        return knex('accounts').logMe('sql').where('id', 1).select('first_name', 'last_name');

      });

      it('allows selecting columns with an array', function() {

        return knex('accounts').logMe('sql').where('id', '>', 1).select(['email', 'logins']);

      });

      it('allows a hash of where attrs', function() {

        return knex('accounts').logMe('sql').where({'id': 1}).select('*');

      });

      it('allows where id: undefined or id: null as a where null clause', function() {

        return Promise.all([
          knex('accounts').logMe('sql').where({'id': void 0}).select('*'),
          knex('accounts').logMe('sql').where({'id': null}).select('first_name', 'email')
        ]);

      });

      it('allows where id = 0', function() {

        return knex('accounts').logMe('sql').where({'id': 0}).select();

      });

    });

    it('has a "distinct" clause', function() {

      return Promise.all([
        knex('accounts').select().distinct('email').where('logins', 2).orderBy('email'),
        knex('accounts').distinct('email').select().orderBy('email')
      ]);

    });

    it('does "orWhere" cases', function() {

      return Promise.all([
        knex('accounts').where('id', 1).orWhere('id', '>', 2).select('first_name', 'last_name')
        // More tests can be added here.
      ]);

    });

    it('does "andWhere" cases', function() {

      return Promise.all([
        knex('accounts').select('first_name', 'last_name', 'about').where('id', 1).andWhere('email', 'test@example.com')
      ]);

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

    it('handles "where exists"', function() {

      return knex('accounts')
        .whereExists(function(qb) {
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


    it('does whereRaw', function() {
      return knex('accounts')
        .whereExists(function() {
          this.select(knex.raw(1))
            .from('test_table_two')
            .whereRaw('test_table_two.account_id = accounts.id');
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


  });

};
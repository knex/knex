var Q = require('q');
module.exports = function(Knex, dbName, handler, type) {

  describe(dbName, function() {
  
    it('runs with no conditions', function(ok) {
      Knex('accounts').select().then(handler(ok), ok);
    });

    it('uses `orderBy`', function(ok) {
      Knex('accounts')
        .select()
        .orderBy('id', 'asc').then(handler(ok), ok);
    }),
    
    it('does simple "where" cases', function(ok) {
      Q.all([
        Knex('accounts').where('id', 1).select('first_name', 'last_name'),
        Knex('accounts').where('id', '>', 1).select(['email', 'logins']),
        Knex('accounts').where({'id': 1}).select('*'),
        Knex('accounts').where({'id': void 0}).select('*'),
        Knex('accounts').where({'id': null}).select('first_name', 'email'),
        Knex('accounts').where({'id': 0}).select()
      ]).then(handler(ok, true), ok);
    });

    it('has a "distinct" clause', function(ok) {
      Q.all([
        Knex('accounts').select().distinct('email').where('logins', 2),
        Knex('accounts').distinct('email').select()
      ]).then(handler(ok, true), ok);
    });

    it('does "orWhere" cases', function(ok) {
      Q.all([
        Knex('accounts').where('id', 1).orWhere('id', '>', 2).select('first_name', 'last_name')
        // More tests can be added here.
      ]).then(handler(ok, true), ok);
    });

    it('does "andWhere" cases', function(ok) {
      Q.all([
        Knex('accounts').select('first_name', 'last_name', 'about').where('id', 1).andWhere('email', 'test@example.com')
      ]).then(handler(ok, true), ok);
    });

    it('takes a function to wrap nested where statements', function(ok) {
      Q.all([
        Knex('accounts').where(function() {
          this.where('id', 2);
          this.orWhere('id', 3);
        }).select('*')
      ]).then(handler(ok, true), ok);
    });

    it('handles "where in" cases', function(ok) {
      Q.all([
        Knex('accounts').whereIn('id', [1, 2, 3]).select()
      ]).then(handler(ok, true), ok);
    });

    it('handles "or where in" cases', function(ok) {
      Knex('accounts')
        .where('email', 'test@example.com')
        .orWhereIn('id', [2, 3, 4])
        .select()
        .then(handler(ok), ok);
    });

    it('handles "where exists"', function(ok) {
      Knex('accounts')
        .whereExists(function(qb) {
          this.select('id').from('test_table_two').where({id: 1});
        })
        .select()
        .then(handler(ok), ok);
    });

    it('handles "where between"', function(ok) {
      Knex('accounts').whereBetween('id', [1, 100])
        .select()
        .then(handler(ok), ok);
    });

    it('handles "or where between"', function(ok) {
      Knex('accounts')
        .whereBetween('id', [1, 100])
        .orWhereBetween('id', [200, 300])
        .select()
        .then(handler(ok), ok);
    });

    describe('joins', function() {

      it('uses inner join by default', function(ok) {
        Knex('accounts')
          .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id')
          .select('accounts.*', 'test_table_two.details')
          .then(handler(ok), ok);
      });

      it('takes a fifth parameter to specify the join type', function(ok) {
        Knex('accounts')
          .join('test_table_two', 'accounts.id', '=', 'test_table_two.account_id', 'left')
          .select('accounts.*', 'test_table_two.details')
          .then(handler(ok), ok);
      });
    
      it('accepts a callback as the second argument for advanced joins', function(ok) {
        Knex('accounts').join('test_table_two', function(join) {
          join.on('accounts.id', '=', 'test_table_two.account_id');
          join.orOn('accounts.email', '=', 'test_table_two.details');
        }, 'left')
        .select()
        .then(handler(ok), ok);
      });

    });

  });

};
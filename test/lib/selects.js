var When = require('when');
module.exports = function(Knex, dbName, resolver) {

  describe(dbName, function() {
  
    it('runs with no conditions', function(ok) {
      Knex('accounts').select().then(resolver(ok), ok);
    });

    it('uses `orderBy`', function(ok) {
      Knex('accounts')
        .select()
        .orderBy('id', 'asc').then(resolver(ok), ok);
    }),
    
    it('does simple "where" cases', function(ok) {
      When.all([
        Knex('accounts').where('id', 1).select('first_name', 'last_name'),
        Knex('accounts').where('id', '>', 1).select(['email', 'logins']),
        Knex('accounts').where({'id': 1}).select('*'),
        Knex('accounts').where({'id': void 0}).select('*'),
        Knex('accounts').where({'id': null}).select('first_name', 'email'),
        Knex('accounts').where({'id': 0}).select()
      ]).then(resolver(ok, true), ok);
    });

    it('has a "distinct" clause', function(ok) {
      When.all([
        Knex('accounts').select().distinct('email').where('logins', 2).orderBy('email'),
        Knex('accounts').distinct('email').select().orderBy('email')
      ]).then(resolver(ok, true), ok);
    });

    it('does "orWhere" cases', function(ok) {
      When.all([
        Knex('accounts').where('id', 1).orWhere('id', '>', 2).select('first_name', 'last_name')
        // More tests can be added here.
      ]).then(resolver(ok, true), ok);
    });

    it('does "andWhere" cases', function(ok) {
      When.all([
        Knex('accounts').select('first_name', 'last_name', 'about').where('id', 1).andWhere('email', 'test@example.com')
      ]).then(resolver(ok, true), ok);
    });

    it('takes a function to wrap nested where statements', function(ok) {
      When.all([
        Knex('accounts').where(function() {
          this.where('id', 2);
          this.orWhere('id', 3);
        }).select('*')
      ]).then(resolver(ok, true), ok);
    });

    it('handles "where in" cases', function(ok) {
      When.all([
        Knex('accounts').whereIn('id', [1, 2, 3]).select()
      ]).then(resolver(ok, true), ok);
    });

    it('handles "or where in" cases', function(ok) {
      Knex('accounts')
        .where('email', 'test@example.com')
        .orWhereIn('id', [2, 3, 4])
        .select()
        .then(resolver(ok), ok);
    });

    it('handles "where exists"', function(ok) {
      Knex('accounts')
        .whereExists(function(qb) {
          this.select('id').from('test_table_two').where({id: 1});
        })
        .select()
        .then(resolver(ok), ok);
    });

    it('handles "where between"', function(ok) {
      Knex('accounts').whereBetween('id', [1, 100])
        .select()
        .then(resolver(ok), ok);
    });

    it('handles "or where between"', function(ok) {
      Knex('accounts')
        .whereBetween('id', [1, 100])
        .orWhereBetween('id', [200, 300])
        .select()
        .then(resolver(ok), ok);
    });

  });

};
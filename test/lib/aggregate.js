
module.exports = function(Knex, dbName, resolver) {

  it('has a sum', function(ok) {

    Knex('accounts')
      .sum('logins')
      .then(resolver(ok), ok);

  });

  it('has a count', function(ok) {
      Knex('accounts').count('id').then(resolver(ok), ok);
  });

  it("support the groupBy function", function(ok) {
      Knex('accounts').count('id').groupBy('logins').then(resolver(ok), ok);
  });

};

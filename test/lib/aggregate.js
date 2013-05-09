
module.exports = function(Knex, dbName, resolver) {

  it('has a sum', function(ok) {

    Knex('accounts')
      .sum('logins')
      .then(resolver(ok), ok);

  });

};
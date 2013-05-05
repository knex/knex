var Q = require('q');
module.exports = function(Knex, dbName, handler, type) {

  it('has a sum', function(ok) {

    Knex('accounts')
      .sum('logins')
      .then(handler(ok), ok);

  });

};
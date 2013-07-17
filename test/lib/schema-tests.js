
module.exports = function(Knex, dbName, resolver) {

  it('should return a true on hasTable if the table does not exist', function(ok) {

    Knex.Schema.hasTable('accounts').then(function(exists) {
      if (!exists.object) throw new Error('Should not get here');
      ok();
    })
    .then(null, ok);

  });

  it('should return a false on hasTable if the table does not exist', function(ok) {

    Knex.Schema.hasTable('invisible_accounts').then(function(exists) {
      if (exists.object) throw new Error('Should not get here');
      ok();
    })
    .then(null, ok);

  });

};

module.exports = function(Knex, dbName, resolver) {

  describe(dbName, function() {

    it('handles unions', function(ok) {

      Knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(function() {
          this.select('*').from('accounts').where('id', 2);
        })
        .then(resolver(ok), ok);

    });

  });

};
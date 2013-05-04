var Q = require('q');
module.exports = function(Knex, item, handler, type) {

  describe(item, function() {

    it('handles unions', function(ok) {

      Knex('accounts')
        .select('*')
        .where('id', '=', 1)
        .union(function() {
          this.select('*').from('accounts').where('id', 2);
        })
        .then(handler(ok), ok);

    });

  });

};
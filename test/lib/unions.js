var Q = require('q');
module.exports = function(Knex, item, handler) {

  describe(item, function() {

    it('handles unions', function(ok) {

      Knex('users')
        .where('id', '=', 1)
        .union(function() {
          this.select('*').from('users').where('id', 2);
        })
        .select('*')
        .then(handler(ok), ok);

    });

  });

};
var Q = require('q');
module.exports = function(Knex, item, handler, type) {

  describe(item, function() {

    it('handles unions', function(ok) {

      Knex('users')
        .select('*')
        .where('id', '=', 1)
        .union(function() {
          this.select('*').from('users').where('id', 2);
        })
        .then(handler(ok), ok);

    });

  });

};
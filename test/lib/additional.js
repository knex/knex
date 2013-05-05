var Q = require('q');
module.exports = function(Knex, dbName, handler, type) {

  it('should truncate a table with truncate', function(ok) {
    
    Knex('test_table_two')
      .truncate()
      .then(handler(function() {}), ok)
      .then(function() {
        if (type === 'String') return ok();
        Knex('test_table_two')
          .select('*')
          .then(function(resp) {
            if (resp.length === 0) return ok();
            ok(resp);
          });
      });

  });

};
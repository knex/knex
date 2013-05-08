var Q = require('q');
var _ = require('underscore');

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

  it('should allow raw queries directly with `Knex.Raw`', function(ok) {

    var tables = {
      mysql: 'SHOW TABLES',
      postgres: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
      sqlite3: "SELECT name FROM sqlite_master WHERE type='table';"
    };

    Knex.Raw(tables[dbName]).then(function() {
      ok();
    });

  });

};
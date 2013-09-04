
var _ = require('underscore');
var equal = require('assert').equal;

module.exports = function(Knex, dbName, resolver) {

  it('should truncate a table with truncate', function(ok) {

    Knex('test_table_two')
      .truncate()
      .then(resolver(function() {}), ok)
      .then(function() {
        Knex('test_table_two')
          .select('*')
          .then(function(resp) {
            if (resp.object.length === 0) return ok();
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

  it('should allow using the primary table as a raw statement', function() {
    equal(Knex(Knex.Raw("raw_table_name")).toString(), 'select * from raw_table_name');
  });

  it('should allow renaming a column', function(done) {

    Knex.Schema.table('accounts', function(t) {
      t.renameColumn('about', 'about_col');
    }).then(function() {
      return Knex('accounts').select('about_col');
    }).then(function(resp) {
      return Knex.Schema.table('accounts', function(t) {
        t.renameColumn('about_col', 'about');
      });
    }).then(function() {
      done();
    });

  });

};
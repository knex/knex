
module.exports = function(knex) {

  describe('Additional', function () {

    it('should truncate a table with truncate', function() {

      return knex('test_table_two')
        .truncate()
        .testSql(function(tester) {
          tester('mysql', 'truncate `test_table_two`');
          tester('postgresql', 'truncate "test_table_two" restart identity');
          tester('sqlite3', "delete from sqlite_sequence where name = \"test_table_two\"");
        })
        .then(function() {

          return knex('test_table_two')
            .select('*')
            .then(function(resp) {
              expect(resp).to.have.length(0);
            });

        });

    });

    it('should allow raw queries directly with `knex.raw`', function() {

      var tables = {
        mysql: 'SHOW TABLES',
        postgresql: "SELECT table_name FROM information_schema.tables WHERE table_schema='public'",
        sqlite3: "SELECT name FROM sqlite_master WHERE type='table';"
      };

      return knex.raw(tables[knex.client.dialect]).testSql(function(tester) {
        tester(knex.client.dialect, tables[knex.client.dialect]);
      });

    });

    it('should allow using the primary table as a raw statement', function() {

      expect(knex(knex.raw("raw_table_name")).toString()).to.equal('select * from raw_table_name');

    });

    it('should allow renaming a column', function(done) {

      return knex.schema.table('accounts', function(t) {

        t.renameColumn('about', 'about_col');

      }).testSql(function(tester) {

        tester('mysql', ["show fields from `accounts` where field = ?"]);
        tester('postgresql', ["alter table \"accounts\" rename \"about\" to \"about_col\""]);
        tester('sqlite3', ["PRAGMA table_info(\"accounts\")"]);

      }).then(function() {

        return knex('accounts').select('about_col');

      }).then(function(resp) {

        return knex.schema.table('accounts', function(t) {
          t.renameColumn('about_col', 'about');
        });

      });

    });

    // it('should reject with a custom error, with the sql, bindings, and message, along with a clientError property', function() {

    //   return knex('nonexistent_table').insert([{item: 1}, {item: 2}]).then(null, function(err) {
    //     expect(err).to.have.property('sql');
    //     expect(err).to.have.property('bindings');
    //     expect(err).to.have.property('clientError');
    //     expect(err).to.be.an.instanceOf(Error);
    //   });

    // });

  });

};
var Promise = testPromise;

module.exports = function(knex) {

  describe('Schema', function() {

    it('has a dropTableIfExists method', function() {
      return Promise.all([
        knex.schema.dropTableIfExists('test_foreign_table_two').logMe('sql'),
        knex.schema.dropTableIfExists('test_table_one').logMe('sql'),
        knex.schema.dropTableIfExists('test_table_two'),
        knex.schema.dropTableIfExists('test_table_three'),
        knex.schema.dropTableIfExists('datatype_test'),
        knex.schema.dropTableIfExists('accounts'),
        knex.schema.dropTableIfExists('test_default_table'),
        knex.schema.dropTableIfExists('composite_key_test'),
        knex.schema.dropTableIfExists('charset_collate_test'),
        knex.schema.dropTableIfExists('knex_migrations'),
        knex.schema.dropTableIfExists('migration_test_1'),
        knex.schema.dropTableIfExists('migration_test_2'),
        knex.schema.dropTableIfExists('migration_test_2_1'),
        knex.schema.dropTableIfExists('catch_test')
      ]);
    });

    describe('createTable', function() {

      it('is possible to chain .catch', function() {
        return knex.schema.createTable('catch_test', function(t) {
          t.increments();
        }).catch(function(e) {
          throw e;
        });
      });

      it('accepts the table name, and a "container" function', function() {
        return knex.schema.createTable('test_table_one', function(table) {
          table.engine('InnoDB');
          table.comment('A table comment.');
          table.bigIncrements('id');
          table.string('first_name').index();
          table.string('last_name');
          table.string('email').unique().nullable();
          table.integer('logins').defaultTo(1).index().comment();
          table.text('about').comment('A comment.');
          table.timestamps();
        }).logMe('sql').then(null);
      });

      it('is possible to set the db engine with the table.engine', function() {
        return knex.schema.createTable('test_table_two', function(table) {
          table.engine('InnoDB');
          table.increments();
          table.integer('account_id');
          table.text('details');
          table.tinyint('status');
        }).logMe('sql');
      });

      it('sets default values with defaultTo', function() {
        return knex.schema.createTable('test_table_three', function(table) {
          table.engine('InnoDB');
          table.integer('main').primary();
          table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
        }).logMe('sql');
      });

      it('supports the enum and uuid columns', function() {
        return knex.schema.createTable('datatype_test', function(table) {
          table.enum('enum_value', ['a', 'b', 'c']);
          table.uuid('uuid');
        }).logMe('sql');
      });

      it('allows for setting foreign keys on schema creation', function() {
        return knex.schema.createTable('test_foreign_table_two', function(table) {
          table.increments();
          table.integer('fkey_two')
            .unsigned()
            .references('id')
            .inTable('test_table_two');
        }).logMe('sql');
      });

      it('allows for composite keys', function() {
        return knex.schema.createTable('composite_key_test', function(table) {
          table.integer('column_a');
          table.integer('column_b');
          table.unique(['column_a', 'column_b']);
        }).logMe('sql');
      });

      it('is possible to set the table collation with table.charset and table.collate', function() {
        return knex.schema.createTable('charset_collate_test', function(table) {
          table.charset('latin1');
          table.collate('latin1_general_ci');
          table.engine('InnoDB');
          table.increments();
          table.integer('account_id');
          table.text('details');
          table.tinyint('status');
        }).logMe('sql');
      });

    });

    describe('table', function() {

      it('allows adding a field', function () {
        return knex.schema.table('test_table_two', function(t) {
          t.json('json_data').nullable();
        });
      });

      it('allows changing a field', function() {
        return knex.schema.table('test_table_one', function(t) {
          t.string('phone').nullable();
        });
      });

    });


    describe('hasTable', function() {

      it('checks whether a table exists', function() {
        return knex.schema.hasTable('test_table_two').then(function(resp) {
          expect(resp).to.be.true;
        });
      });

      it('should be false if a table does not exists', function() {
        return knex.schema.hasTable('this_table_is_fake').then(function(resp) {
          expect(resp).to.be.false;
        });
      });

    });

    describe('renameTable', function() {

      it('renames the table from one to another', function () {
        return knex.schema.renameTable('test_table_one', 'accounts');
      });

    });

    describe('dropTable', function() {

      it('should drop a table', function() {

        return knex.schema.dropTable('test_table_three').then(function() {

          // Drop this here so we don't have foreign key constraints...
          return knex.schema.dropTable('test_foreign_table_two');

        });

      });

    });

    describe('hasColumn', function() {

      it('checks whether a column exists, resolving with a boolean', function() {

        return knex.schema.hasColumn('accounts', 'first_name').then(function(exists) {

          expect(exists).to.be.true;

        });

      });

    });

  });

};
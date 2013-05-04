var Q = require('q');
module.exports = function(Knex, item, handler, type) {
  
  describe(item, function() {

    it('creates test_table_one with `createTable` - ' + item, function(ok) {
      
      Knex.Schema.createTable('test_table_one', function(table) {
        table.increments('id');
        table.string('first_name');
        table.string('last_name');
        table.string('email').nullable();
        table.integer('logins').defaultTo(1).index();
        table.text('about');
        table.timestamps();
      }).then(handler(ok), ok);

    });

    it('creates a test_table_two for joins', function(ok) {

      Knex.Schema.createTable('test_table_two', function(t) {
        t.increments();
        t.integer('account_id');
        t.text('details');
      }).then(handler(ok), ok);

    });

    it('will not break on default values on text in MySql' + item, function(ok) {

      Knex.Schema.createTable('test_table_three', function(table) {
        table.integer('main').primary();
        table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
      }).then(handler(ok), ok);
    
    });

    it('edits tables with table', function() {
      Knex.Schema.table('test_table_one', function(t) {
        t.string('phone');
      });
    });

    it('drops tables with `dropTable` - ' + item, function(ok) {
      Knex.Schema.dropTable('test_table_three').then(handler(ok), ok);
    });

    it('conditionally drops tables with `dropTableIfExists` - ' + item, function(ok) {
      Knex.Schema.dropTableIfExists('accounts').then(handler(ok), ok);
    });

    if (type !== 'String') {
      
      it('checks for table existence with `hasTable` - ' + item, function(ok) {
        Knex.Schema.hasTable('test_table_two').then(handler(ok), ok);
      });

    }

    it('renames tables with `renameTable` - ' + item, function(ok) {
      Knex.Schema.renameTable('test_table_one', 'accounts').then(handler(ok), ok);
    });

  });

};
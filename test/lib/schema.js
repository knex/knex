var Q = require('q');
module.exports = function(Knex, item, handler, type) {
  
  describe(item, function() {

    it('creates tables with `createTable` - ' + item, function(ok) {
      
      Knex.Schema.createTable('test_table', function(table) {
        table.increments('id');
        table.string('first_name');
        table.string('last_name');
        table.string('email').nullable();
        table.integer('logins').defaultTo(1).index();
        table.text('about');
        table.timestamps();
      }).then(handler(ok), ok);

    });

    it('will not break on default values on text in MySql' + item, function(ok) {

      Knex.Schema.createTable('other_table', function(table) {
        table.integer('main').primary();
        table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
      }).then(handler(ok), ok);
    
    });

    it('edits tables with table');

    it('drops tables with `dropTable` - ' + item, function(ok) {
      Knex.Schema.dropTable('accounts').then(handler(ok), ok);
    });

    it('conditionally drops tables with `dropTableIfExists` - ' + item, function(ok) {
      Knex.Schema.dropTableIfExists('other_accounts').then(handler(ok), ok);
    });

    it('renames tables with `renameTable` - ' + item, function(ok) {
      Knex.Schema.renameTable('accounts', 'new_accounts').then(handler(ok), ok);
    });

    if (type === 'String') return;

    it('checks for table existence with `hasTable` - ' + item, function(ok) {
      Knex.Schema.hasTable('test_table').then(handler(ok), ok);
    });


  });

};
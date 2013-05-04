var Q = require('q');
module.exports = function(Knex, item, handler, type) {
  
  before(function(ok) {

    Q.all([
      
      Knex.Schema.createTable('test_table_one', function(table) {
        table.increments('id');
        table.string('first_name');
        table.string('last_name');
        table.string('email').nullable();
        table.integer('logins').defaultTo(1).index();
        table.text('about');
        table.timestamps();
      }),
      Knex.Schema.createTable('test_table_two', function(t) {
        t.increments();
        t.integer('account_id');
        t.text('details');
      }),

      Knex.Schema.createTable('test_table_three', function(table) {
        table.integer('main').primary();
        table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
      })

    ]).then(function(resp) {

      // Edit test table one
      return Knex.Schema.table('test_table_one', function(t) {
        t.string('phone').nullable();
      }).then(function(res2) {
        resp.push(res2);
        return resp;
      });

    }).then(handler(ok, true), ok);

  });

  describe(item, function() {

    it('conditionally drops tables with `dropTableIfExists` - ' + item, function(ok) {
      Knex.Schema.dropTableIfExists('items').then(handler(ok), ok);
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

  after(function(ok) {

    Knex.Schema.dropTable('test_table_three').then(handler(ok), ok);
    
  });

};
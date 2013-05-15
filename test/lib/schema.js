var When = require('when');
module.exports = function(Knex, resolver, error) {

  var res = null;

  return When.all([
    Knex.Schema.dropTableIfExists('test_table_one'),
    Knex.Schema.dropTableIfExists('test_table_two'),
    Knex.Schema.dropTableIfExists('test_table_three'),
    Knex.Schema.dropTableIfExists('accounts')
  ]).then(function(resp) {
    
    res = [resp[0]]; // only really need one of these for the test output.
    
    return When.all([
      Knex.Schema.createTable('test_table_one', function(table) {
        table.engine('InnoDB');
        table.increments('id');
        table.string('first_name');
        table.string('last_name');
        table.string('email').unique().nullable();
        table.integer('logins').defaultTo(1).index();
        table.text('about');
        table.timestamps();
      }),
      Knex.Schema.createTable('test_table_two', function(t) {
        t.engine('InnoDB');
        t.increments();
        t.integer('account_id');
        t.text('details');
        t.tinyint('status');
      }),
      Knex.Schema.createTable('test_table_three', function(table) {
        table.engine('InnoDB');
        table.integer('main').primary();
        table.text('paragraph').defaultTo('Lorem ipsum Qui quis qui in.');
      })
    ]);
  })
  .then(function(resp) {
    // Edit test table one
    res = res.concat(resp);
    return Knex.Schema.table('test_table_one', function(t) {
      t.string('phone').nullable();
    });

  }).then(function(resp) {
    // conditionally drops tables with `dropTableIfExists`
    res.push(resp);
    return Knex.Schema.dropTableIfExists('items');
  })
  .then(function(resp) {
    res.push(resp);
    return Knex.Schema.hasTable('test_table_two');
  })
  .then(function(resp) {
    res.push(resp);
    return Knex.Schema.renameTable('test_table_one', 'accounts');
  })
  .then(function(resp) {
    res.push(resp);
    return Knex.Schema.dropTable('test_table_three');
  })
  .then(function(resp) {
    res.push(resp);
    return res;
  })
  .then(resolver, error);

};
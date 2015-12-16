var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(3030);

var knex = require('./lib/index')({
  dialect: 'mysql',
  connection: {
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'db_intranet'
  }
});

// Create a table
knex.schema.createTable('users', function(table) {
  table.increments('id');
  table.string('user_name');
})

// ...and another
.createTable('accounts', function(table) {
  table.increments('id');
  table.string('account_name');
  table.integer('user_id').unsigned().references('users.id');
})

// Then query the table...
.then(function() {
  return knex.insert({user_name: 'Tim'}).into('users');
})

// ...and using the insert id, insert into the other table.
.then(function(rows) {
  return knex.table('accounts').insert({account_name: 'knex', user_id: rows[0]});
})

// Query both of the rows.
.then(function() {
  return knex('users')
    .join('accounts', 'users.id', 'accounts.user_id')
    .select('users.user_name as user', 'accounts.account_name as account');
})

// .map over the results
.map(function(row) {
  console.log(row);
})

// Finally, add a .catch handler for the promise chain
.catch(function(e) {
  console.error(e);
});
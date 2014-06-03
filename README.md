knex.js
-----

SQL that is flexible, portable, and fun to use!

[![Build Status](https://travis-ci.org/tgriesser/knex.png?branch=master)](https://travis-ci.org/tgriesser/knex)

### [Full Documentation Site: knexjs.org](http://knexjs.org)

A batteries-included, multi-dialect (MySQL, PostgreSQL, SQLite3, WebSQL) SQL query builder for Node.js, featuring:

- [transactions](http://knexjs.org/#Transactions)
- [connection pooling](http://knexjs.org/#Initialize-pool)
- [streaming queries](http://knexjs.org/#Interface-streams)
- both a [promise](http://knexjs.org/#Interface-promises) and [callback](http://knexjs.org/#Interface-callback) API
- a [thorough test suite](https://travis-ci.org/tgriesser/knex)
- the ability to [run in the Browser](http://knexjs.org/#faq-browser)

For Docs, FAQ, and other information, see: http://knexjs.org

For an Object Relational Mapper, see: http://bookshelfjs.org

To suggest a feature, report a bug, or general discussion: http://github.com/tgriesser/knex/issues/

#### Here's a quick demo:

```js
var knex = require('knex')({
  dialect: 'mysql',
  connection: process.env.DB_CONNECTION_STRING
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
  return knex.insert({name: 'Tim'}).into('users');
})

// ...and using the insert id, insert into the other table.
.then(function(rows) {
  return knex.table('users').insert({account_name: 'knex', user_id: knex.rows[0]});
});

// Query both of the rows.
.then(function() {
  return knex('users')
    .join('accounts', 'accounts.id')
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
```
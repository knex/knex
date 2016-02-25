# [knex.js](http://knexjs.org) [![Build Status](https://travis-ci.org/tgriesser/knex.svg?branch=master)](https://travis-ci.org/tgriesser/knex) [![Coverage Status](https://coveralls.io/repos/tgriesser/knex/badge.svg?branch=master)](https://coveralls.io/r/tgriesser/knex?branch=master)

Gitter chat
[![Gitter chat](https://badges.gitter.im/tgriesser/knex.svg)](https://gitter.im/tgriesser/knex "Gitter chat")

A SQL query builder that is flexible, portable, and fun to use!

A batteries-included, multi-dialect (MySQL, PostgreSQL, SQLite3, WebSQL, Oracle) query builder for
Node.js and the Browser, featuring:

- [transactions](http://knexjs.org/#Transactions)
- [connection pooling](http://knexjs.org/#Installation-pooling)
- [streaming queries](http://knexjs.org/#Interfaces-Streams)
- both a [promise](http://knexjs.org/#Interfaces-Promises) and [callback](http://knexjs.org/#Interfaces-Callbacks) API
- a [thorough test suite](https://travis-ci.org/tgriesser/knex)
- the ability to [run in the Browser](http://knexjs.org/#Installation-browser)

[Read the full documentation to get started!](http://knexjs.org)

For support and questions, join the #bookshelf channel on freenode IRC

For an Object Relational Mapper, see: http://bookshelfjs.org

To see the SQL that Knex will generate for a given query, see: [Knex Query Lab](http://michaelavila.com/knex-querylab/)

## Examples

We have several examples [on the website](http://knexjs.org). Here is the first one to get you started:

```js
var knex = require('knex')({
  dialect: 'sqlite3',
  connection: {
    filename: './data.db'
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
```

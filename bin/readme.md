# Migration CLI

----

Installing the CLI globally (`npm install -g knex`) will cause dependency issues. You should use the locally installed executable by running `./node_modules/.bin/knex migrate:[command]`.

### knex migrate:make [name]

Creates a new migration, specifying the name for the migration.

Migrations are node modules that export an up and down function.  These functions take a knex instance and a Promise.  Use the [knex.schema API](http://knexjs.org/#Schema) to make changes to your database.

**Example**:

```js
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function (table) {
    table.increments('id').primary();
    table.string('name');
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
```

#### Options

- database:  either a knex instance or a config hash to be passed to Knex.
- directory: relative directory from which the migrations should be read & written.
- tableName: table name for the migrations
- extension: filename extension of migrations.  See [github](https://github.com/tgriesser/knex/tree/master/lib/stub) for a list of supported extensions, and feel free to [contribute](https://help.github.com/articles/fork-a-repo) more extensions.

**Example config.js**

```js
require('../node_modules/LiveScript');   // If using a non-standard extension,
module.exports = {                       // be sure to require its runtime.
  database: {
    client: 'mysql',
    connection: {
      host     : process.env.APP_DB_HOST     || '127.0.0.1',
      user     : process.env.APP_DB_USER     || 'user',
      password : process.env.APP_DB_PASSWORD || 'password',
      database : process.env.APP_DB_NAME     || 'database'
    }
  },
  directory: './migrations',
  tableName: 'migrations',
  extension: 'ls'
};
```

### knex migrate:latest

Runs migrations for the current config.

### knex migrate:rollback

Rolls back the last migration batch.

### knex migrate:currentVersion

The current version for the migrations.

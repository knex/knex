# Migration CLI

----

### knex migrate:make

Creates a new migration.

#### Options

- database:  either a knex instance or a config hash to be passed to Knex.
- directory: relative directory from which the migrations should be read & written.
-

### knex migrate:latest

Runs migrations for the current config.

### knex migrate:rollback

Rolls back the last migration batch.

### knex migrate:

knex migrate:up       - runs one specific migration
knex migrate:down     - rolls back one specific migration
knex migrate:status   - shows current migration status
knex migrate:rollback -

### knex migrate:currentVersion

var db = knex.initialize({ ... });

var migrator = new db.migrate({
  path: './migrations',
  database: db,
  logger: console.log
});

migrator.currentVersion().then(...   /* "20130523" */

// Perform a migration
migrator.migrate().then(...
migrator.migrate({ to: "20130605" })

// Create a migration file
migrator.generate().then(...
migrator.generate("add_created_at_to_user")


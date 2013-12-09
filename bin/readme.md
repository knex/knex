# Migration CLI

----

Installing the CLI globally (`npm install -g knex`) will cause dependency issues. You should use the locally installed executable by running `./node_modules/.bin/knex migrate:[command]`.

### knex migrate:make [name]

Creates a new migration, specifying the name for the migration.

#### Options

- database:  either a knex instance or a config hash to be passed to Knex.
- directory: relative directory from which the migrations should be read & written.
- tableName: table name for the migrations

### knex migrate:latest

Runs migrations for the current config.

### knex migrate:rollback

Rolls back the last migration batch.

### knex migrate:currentVersion

The current version for the migrations.

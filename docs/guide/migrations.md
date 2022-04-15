# Migrations

Migrations allow for you to define sets of schema changes so upgrading a database is a breeze.

## Migration CLI

The migration CLI is bundled with the knex install, and is driven by the [node-liftoff](https://github.com/tkellen/node-liftoff) module. To install globally, run:

```bash
$ npm install knex -g
```

The migration CLI accepts the following general command-line options. You can view help text and additional options for each command using `--help`. E.g. `knex migrate:latest --help`.

- `--debug`: Run with debugging
- `--knexfile [path]`: Specify the knexfile path
- `--knexpath [path]`: Specify the path to the knex instance
- `--cwd [path]`: Specify the working directory
- `--client [name]`: Set the DB client
- `--connection [address]`: Set the DB connection
- `--migrations-table-name`: Set the migration table name
- `--migrations-directory`: Set the migrations directory
- `--env`: environment, default: `process.env.NODE\_ENV || development`
- `--esm`: [Enables ESM module interoperability](#esm-interop)
- `--help`: Display help text for a particular command and exit.

Migrations use a **knexfile**, which specify various configuration settings for the module. To create a new knexfile, run the following:

```bash
$ knex init

# or for .ts

$ knex init -x ts
```

will create a sample knexfile.js - the file which contains our various database configurations. Once you have a knexfile.js, you can use the migration tool to create migration files to the specified directory (default migrations). Creating new migration files can be achieved by running:

```bash
$ knex migrate:make migration_name 

# or for .ts

$ knex migrate:make migration_name -x ts
```

-   you can also create your migration using a specific stub file, this serves as a migration template to speed up development for common migration operations
-   if the --stub option is not passed, the CLI will use either the knex default stub for the chosen extension, or the config.stub file

```bash
$ knex migrate:make --stub 

# or

$ knex migrate:make --stub 
```

-   if a stub path is provided, it must be relative to the knexfile.\[js, ts, etc\] location
-   if a is used, the stub is selected by its file name. The CLI will look for this file in the config.migrations.directory folder. If the config.migrations.directory is not defined, this operation will fail

Once you have finished writing the migrations, you can update the database matching your `NODE_ENV` by running:

```bash
$ knex migrate:latest
```

You can also pass the `--env` flag or set `NODE_ENV` to select an alternative environment:

```bash
$ knex migrate:latest --env production

# or

$ NODE_ENV=production knex migrate:latest
```

To rollback the last batch of migrations:

```bash
$ knex migrate:rollback
```

To rollback all the completed migrations:

```bash
$ knex migrate:rollback --all
```

To run the next migration that has not yet been run

```bash
$ knex migrate:up
```

To run the specified migration that has not yet been run

```bash
$ knex migrate:up 001_migration_name.js
```

To undo the last migration that was run

```bash
$ knex migrate:down
```

To undo the specified migration that was run

```bash
$ knex migrate:down 001_migration_name.js
```

To list both completed and pending migrations:

```bash
$ knex migrate:list
```

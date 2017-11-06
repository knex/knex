export default [
  {
    type: "heading",
    size: "lg",
    content: "Migrations",
    href: "Migrations"
  },
  {
    type: "text",
    content: "Migrations allow for you to define sets of schema changes so upgrading a database is a breeze."
  },
  {
    type: "heading",
    size: "md",
    content: "Migration CLI",
    href: "Migrations-CLI"
  },
  {
    type: "text",
    content: "The migration CLI is bundled with the knex install, and is driven by the [node-liftoff](https://github.com/tkellen/node-liftoff) module. To install globally, run:"
  },
  {
    type: "code",
    content: `
      $ npm install knex -g
    `
  },
  {
    type: "text",
    content: "Migrations use a **knexfile**, which specify various configuration settings for the module. To create a new knexfile, run the following:"
  },
  {
    type: "code",
    content: `
      $ knex init

      # or for .coffee

      $ knex init -x coffee
    `
  },
  {
    type: "text",
    content: "will create a sample knexfile.js - the file which contains our various database configurations. Once you have a knexfile.js, you can use the migration tool to create migration files to the specified directory (default migrations). Creating new migration files can be achieved by running:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:make migration_name
    `
  },
  {
    type: "text",
    content: "Once you have finished writing the migrations, you can update the database matching your `NODE_ENV` by running:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:latest
    `
  },
  {
    type: "text",
    content: "You can also pass the `--env` flag or set `NODE_ENV` to select an alternative environment:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:latest --env production

      # or

      $ NODE_ENV=production knex migrate:latest
    `
  },
  {
    type: "text",
    content: "To rollback the last batch of migrations:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:rollback
    `
  },
  {
    type: "heading",
    size: "lg",
    content: "Seed files",
    href: "Seeds"
  },
  {
    type: "text",
    content: "Seed files allow you to populate your database with test or seed data independent of your migration files."
  },
  {
    type: "heading",
    size: "md",
    content: "Seed CLI",
    href: "Seeds-CLI"
  },
  {
    type: "text",
    content: "To create a seed file, run:"
  },
  {
    type: "code",
    content: `
      $ knex seed:make seed_name
    `
  },
  {
    type: "text",
    content: "Seed files are created in the directory specified in your knexfile.js for the current environment. A sample seed configuration looks like:"
  },
  {
    type: "code",
    content: `
      development: {
        client: ...,
        connection: { ... },
        seeds: {
            directory: './seeds/dev'
        }
      }
    `
  },
  {
    type: "text",
    content: [
      "If no `seeds.directory` is defined, files are created in `./seeds`. Note that the seed directory needs to be a relative path. Absolute paths are not supported (nor is it good practice).",
      "To run seed files, execute:"
    ]
  },
  {
    type: "code",
    content: `
      $ knex seed:run
    `
  },
  {
    type: "text",
    content: "Seed files are executed in alphabetical order. Unlike migrations, _every_ seed file will be executed when you run the command. You should design your seed files to reset tables as needed before inserting data."
  },
  {
    type: "heading",
    size: "md",
    content: "knexfile.js",
    href: "knexfile"
  },
  {
    type: "text",
    content: "A knexfile.js or knexfile.coffee generally contains all of the configuration for your database. It can optionally provide different configuration for different environments. You may pass a `--knexfile` option to any of the command line statements to specify an alternate path to your knexfile."
  },
  {
    type: "heading",
    size: "sm",
    content: "Basic configuration:"
  },
  {
    type: "code",
    language: "js",
    content: `
      module.exports = {
        client: 'pg',
        connection: process.env.DATABASE_URL || { user: 'me', database: 'my_app' }
      };
    `
  },
  {
    type: "heading",
    size: "sm",
    content: "Environment configuration:"
  },
  {
    type: "code",
    language: "js",
    content: `
      module.exports = {
        development: {
          client: 'pg',
          connection: { user: 'me', database: 'my_app' }
        },
        production: { client: 'pg', connection: process.env.DATABASE_URL }
      };
    `
  },
  {
    type: "heading",
    size: "sm",
    content: "Custom migration:"
  },
  {
    type: "text",
    size: "sm",
    content: "You may provide a custom migration stub to be used in place of the default option."
  },
  {
    type: "code",
    language: "js",
    content: `
      module.exports = {
        client: 'pg',
        migration: {
          stub: 'migration.stub'
        }
      };
    `
  },
  {
    type: "heading",
    size: "md",
    content: "Migration API",
    href: "Migrations-API"
  },
  {
    type: "text",
    content: [
      "`knex.migrate` is the class utilized by the knex migrations cli.",
      "Each method takes an optional `config` object, which may specify the following properties:"
    ]
  },
  {
    type: "list",
    content: [
      "`directory`: a relative path to the directory containing the migration files (default `./migrations`)",
      "`extension`: the file extension used for the generated migration files (default `js`)",
      "`tableName`: the table name used for storing the migration state (default `knex_migrations`)",
      "`disableTransactions`: don't run migrations inside transactions (default `false`)",
      "`loadExtensions`: array of file extensions which knex will treat as migrations. For example, if you have typescript transpiled into javascript in the same folder, you want to execute only javascript migrations. In this case, set `loadExtensions` to `['.js']` (Notice the dot!) (default `['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls', '.ts']`)",
    ]
  },
  {
    type: "heading",
    size: "sm",
    content: "Transactions in migrations",
    href: "Migrations-API-transactions"
  },
  {
    type: "text",
    content: "By default, each migration is run inside a transaction. Whenever needed, one can disable transactions for all migrations via the common migration config option `config.disableTransactions` or per-migration, via exposing a boolean property `config.transaction` from a migration file:"
  },
  {
    type: "code",
    language: "js",
    content: `
      exports.up = function(knex, Promise) { /* ... */ };

      exports.down = function(knex, Promise) { /* ... */ };

      exports.config = { transaction: false };
    `
  },
  {
    type: "text",
    content: "The same config property can be used for enabling transaction per-migration in case the common configuration has `disableTransactions: true`."
  },
  {
    type: "method",
    method: "make",
    example: "knex.migrate.make(name, [config])",
    description: "Creates a new migration, with the name of the migration being added.",
    children: [    ]
  },
  {
    type: "method",
    method: "latest",
    example: "knex.migrate.latest([config])",
    description: "Runs all migrations that have not yet been run.",
    children: [    ]
  },
  {
    type: "text",
    content: "If you need to run something only after all migrations have finished their execution, you can do something like this:"
  },
  {
    type: "code",
    language: "js",
    content: `
      knex.migrate.latest()
        .then(function() {
          return knex.seed.run();
        })
        .then(function() {
          // migrations are finished
        });
    `
  },
  {
    type: "method",
    method: "rollback",
    example: "knex.migrate.rollback([config])",
    description: "Rolls back the latest migration group.",
    children: [    ]
  },
  {
    type: "method",
    method: "currentVersion",
    example: "knex.migrate.currentVersion([config])",
    description: "Retrieves and returns the current migration version, as a promise. If there aren't any migrations run yet, returns \"none\" as the value for the currentVersion.",
    children: [    ]
  },
	{
		type: "heading",
		size: "md",
		content: "Notes about locks",
		href: "Notes-about-locks"
	},
	{
		type: "text",
		content: "A lock system is there to prevent multiple processes from running the same migration batch in the same time. When a batch of migrations is about to be run, the migration system first tries to get a lock using a `SELECT ... FOR UPDATE` statement (preventing race conditions from happening). If it can get a lock, the migration batch will run. If it can't, it will wait until the lock is released."
	},
	{
		type: "text",
		content: "Please note that if your process unfortunately crashes, the lock will have to be *manually* removed in order to let migrations run again. The locks are saved in a table called \"`tableName`_lock\"; it has single one column called `is_locked` that you need to set to `0` in order to release the lock."
	}
]

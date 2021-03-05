import esmInterop from "./esm-interop"
export default [
  {
    type: "heading",
    size: "lg",
    content: "Migrations",
    href: "Migrations"
  },
  {
    type: "text",
    content:
      "Migrations allow for you to define sets of schema changes so upgrading a database is a breeze."
  },
  {
    type: "heading",
    size: "md",
    content: "Migration CLI",
    href: "Migrations-CLI"
  },
  {
    type: "text",
    content:
      "The migration CLI is bundled with the knex install, and is driven by the [node-liftoff](https://github.com/tkellen/node-liftoff) module. To install globally, run:"
  },
  {
    type: "code",
    content: `
      $ npm install knex -g
    `
  },
  {
    type: "text",
    content: [
      "The migration CLI accepts the following general command-line options. You can view help text and additional options for each command using `--help`. E.g. `knex migrate:latest --help`."
    ]
  },
  {
    type: "list",
    content: [
      "`--debug`: Run with debugging",
      "`--knexfile [path]`: Specify the knexfile path",
      "`--knexpath [path]`: Specify the path to the knex instance",
      "`--cwd [path]`: Specify the working directory",
      "`--client [name]`: Set the DB client without a knexfile",
      "`--connection [address]`: Set the DB connection without a knexfile",
      "`--migrations-table-name`: Set the migration table name without a knexfile",
      "`--migrations-directory`: Set the migrations directory without a knexfile",
      "`--env`: environment, default: process.env.NODE_ENV || development",
      "`--esm`: [Enables ESM module interoperability](#esm-interop)",
      "`--help`: Display help text for a particular command and exit."
    ]
  },
  {
    type: "text",
    content:
      "Migrations use a **knexfile**, which specify various configuration settings for the module. To create a new knexfile, run the following:"
  },
  {
    type: "code",
    content: `
      $ knex init

      # or for .ts

      $ knex init -x ts
    `
  },
  {
    type: "text",
    content:
      "will create a sample knexfile.js - the file which contains our various database configurations. Once you have a knexfile.js, you can use the migration tool to create migration files to the specified directory (default migrations). Creating new migration files can be achieved by running:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:make migration_name 
      
      # or for .ts
      
      $ knex migrate:make migration_name -x ts
    `
  },
  {
    type: "list",
    content: [
      "you can also create your migration using a specific stub file, this serves as a migration template to speed up development for common migration operations",
      "if the --stub option is not passed, the CLI will use either the knex default stub for the chosen extension, or the config.stub file"
    ]
  },
  {
    type: "code",
    content: `
      $ knex migrate:make --stub </path/to/stub/file>

      # or

      $ knex migrate:make --stub <name>
    `
  },
  {
    type: "list",
    content: [
      "if a stub path is provided, it must be relative to the knexfile.[js, ts, etc] location",
      "if a <name> is used, the stub is selected by its file name. The CLI will look for this file in the config.migrations.directory folder. If the config.migrations.directory is not defined, this operation will fail"
    ]
  },
  {
    type: "text",
    content:
      "Once you have finished writing the migrations, you can update the database matching your `NODE_ENV` by running:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:latest
    `
  },
  {
    type: "text",
    content:
      "You can also pass the `--env` flag or set `NODE_ENV` to select an alternative environment:"
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
    type: "text",
    content: "To rollback all the completed migrations:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:rollback --all
    `
  },
  {
    type: "text",
    content: "To run the next migration that has not yet been run"
  },
  {
    type: "code",
    content: `
      $ knex migrate:up
    `
  },
  {
    type: "text",
    content: "To run the specified migration that has not yet been run"
  },
  {
    type: "code",
    content: `
      $ knex migrate:up 001_migration_name.js
    `
  },
  {
    type: "text",
    content: "To undo the last migration that was run"
  },
  {
    type: "code",
    content: `
      $ knex migrate:down
    `
  },
  {
    type: "text",
    content: "To undo the specified migration that was run"
  },
  {
    type: "code",
    content: `
      $ knex migrate:down 001_migration_name.js
    `
  },
  {
    type: "text",
    content: "To list both completed and pending migrations:"
  },
  {
    type: "code",
    content: `
      $ knex migrate:list
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
    content:
      "Seed files allow you to populate your database with test or seed data independent of your migration files."
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
    content:
      "Seed files are created in the directory specified in your knexfile.js for the current environment. A sample seed configuration looks like:"
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
    content:
      "Seed files are executed in alphabetical order. Unlike migrations, _every_ seed file will be executed when you run the command. You should design your seed files to reset tables as needed before inserting data."
  },
  {
    type: "text",
    content: "To run a specific seed file, execute:"
  },
  {
    type: "code",
    content: `
      $ knex seed:run --specific=seed-filename.js
    `
  },
  {
    type: "heading",
    size: "md",
    content: "knexfile.js",
    href: "knexfile"
  },
  {
    type: "text",
    content:
      "A knexfile.js generally contains all of the configuration for your database. It can optionally provide different configuration for different environments. You may pass a `--knexfile` option to any of the command line statements to specify an alternate path to your knexfile."
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
    type: "text",
    size: "sm",
    content: "you can also export an async function from the knexfile. This is useful when you need to fetch credentials from a secure location like vault"
  },
  {
    type: "code",
    language: "js",
    content: `
      async function fetchConfiguration() {
        // TODO: implement me
        return {
          client: 'pg',
          connection: { user: 'me', password: 'my_pass' }
        }
      }

      module.exports = async () => {
        const configuration = await fetchConfiguration();
        return {
          ...configuration,
          migrations: {}
        }
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
    content:
      "You may provide a custom migration stub to be used in place of the default option."
  },
  {
    type: "code",
    language: "js",
    content: `
      module.exports = {
        client: 'pg',
        migrations: {
          stub: 'migration.stub'
        }
      };
    `
  },
  {
    type: "heading",
    size: "sm",
    content: "Generated migration extension:"
  },
  {
    type: "text",
    size: "sm",
    content: "You can control extension of generated migrations."
  },
  {
    type: "code",
    language: "js",
    content: `
      module.exports = {
        client: 'pg',
        migrations: {
          extension: 'ts'
        }
      };
    `
  },
  {
    type: "heading",
    size: "sm",
    content: "Knexfile in other languages"
  },
  {
    type: "text",
    size: "sm",
    content: [
      "Knex uses [Liftoff](https://github.com/js-cli/js-liftoff) to support knexfile written in other compile-to-js languages.",
      "Depending on the language, this may require you to install additional dependencies. The complete list of dependencies for each supported language can be found [here](https://github.com/gulpjs/interpret#extensions).",
      "Most common cases are typescript (for which [typescript](https://www.npmjs.com/package/typescript) and [ts-node](https://www.npmjs.com/package/ts-node) packages are recommended), and coffeescript (for which [coffeescript](https://www.npmjs.com/package/coffeescript) dependency is required).",
      "If you don't specify the extension explicitly, the extension of generated migrations/seed files will be inferred from the knexfile extension"
    ]
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
      "`directory`: a relative path to the directory containing the migration files. Can be an array of paths (default `./migrations`)",
      "`extension`: the file extension used for the generated migration files (default `js`)",
      "`tableName`: the table name used for storing the migration state (default `knex_migrations`)",
      "`schemaName`: the schema name used for storing the table with migration state (optional parameter, only works on DBs that support multiple schemas in a single DB, such as PostgreSQL)",
      "`disableTransactions`: don't run migrations inside transactions (default `false`)",
      "`disableMigrationsListValidation`: do not validate that all the already executed migrations are still present in migration directories (default `false`)",
      "`sortDirsSeparately`: if true and multiple directories are specified, all migrations from a single directory will be executed before executing migrations in the next folder (default `false`)",
      "`loadExtensions`: array of file extensions which knex will treat as migrations. For example, if you have typescript transpiled into javascript in the same folder, you want to execute only javascript migrations. In this case, set `loadExtensions` to `['.js']` (Notice the dot!) (default `['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls', '.ts']`)",
      "`migrationSource`: specify a custom migration source, see [Custom Migration Source](#custom-migration-sources) for more info (default filesystem)"
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
    content:
      "By default, each migration is run inside a transaction. Whenever needed, one can disable transactions for all migrations via the common migration config option `config.disableTransactions` or per-migration, via exposing a boolean property `config.transaction` from a migration file:"
  },
  {
    type: "code",
    language: "js",
    content: `
      exports.up = function(knex) {
        return knex.schema
          .createTable('users', function (table) {
             table.increments('id');
             table.string('first_name', 255).notNullable();
             table.string('last_name', 255).notNullable();
          })
          .createTable('products', function (table) {
             table.increments('id');
             table.decimal('price').notNullable();
             table.string('name', 1000).notNullable();
          });
      };

      exports.down = function(knex) {
        return knex.schema
            .dropTable("products")
            .dropTable("users");
      };

      exports.config = { transaction: false };
    `
  },
  {
    type: "text",
    content:
      "The same config property can be used for enabling transaction per-migration in case the common configuration has `disableTransactions: true`."
  },
  {
    type: "method",
    method: "make",
    example: "knex.migrate.make(name, [config])",
    description:
      "Creates a new migration, with the name of the migration being added.",
    children: []
  },
  {
    type: "method",
    method: "latest",
    example: "knex.migrate.latest([config])",
    description: "Runs all migrations that have not yet been run.",
    children: []
  },
  {
    type: "text",
    content:
      "If you need to run something only after all migrations have finished their execution, you can do something like this:"
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
    example: "knex.migrate.rollback([config], [all])",
    description:
      "Rolls back the latest migration group. If the `all` parameter is truthy, all applied migrations will be rolled back instead of just the last batch. The default value for this parameter is `false`.",
    children: []
  },
  {
    type: "method",
    method: "up",
    example: "knex.migrate.up([config])",
    description:
      "Runs the specified (by `config.name` parameter) or the next chronological migration that has not yet be run.",
    children: []
  },
  {
    type: "method",
    method: "down",
    example: "knex.migrate.down([config])",
    description: "Will undo the specified (by `config.name` parameter) or the last migration that was run.",
    children: []
  },
  {
    type: "method",
    method: "currentVersion",
    example: "knex.migrate.currentVersion([config])",
    description:
      'Retrieves and returns the current migration version, as a promise. If there aren\'t any migrations run yet, returns "none" as the value for the currentVersion.',
    children: []
  },
  {
    type: "method",
    method: "list",
    example: "knex.migrate.list([config])",
    description: "Will return list of completed and pending migrations",
    children: []
  },
  {
    type: "method",
    method: "unlock",
    example: "knex.migrate.forceFreeMigrationsLock([config])",
    description: "Forcibly unlocks the migrations lock table, and ensures that there is only one row in it.",
    children: []
  },
  {
    type: "heading",
    size: "md",
    content: "Notes about locks",
    href: "Notes-about-locks"
  },
  {
    type: "text",
    content:
      "A lock system is there to prevent multiple processes from running the same migration batch in the same time. When a batch of migrations is about to be run, the migration system first tries to get a lock using a `SELECT ... FOR UPDATE` statement (preventing race conditions from happening). If it can get a lock, the migration batch will run. If it can't, it will wait until the lock is released."
  },
  {
    type: "text",
    content:
      'Please note that if your process unfortunately crashes, the lock will have to be *manually* removed with `knex migrate:unlock` in order to let migrations run again.'
  },
  {
    type: "text",
    content:
      'The locks are saved in a table called "`tableName`_lock"; it has a column called `is_locked` that `knex migrate:unlock` sets to `0` in order to release the lock. The `index` column in the lock table exists for compatibility with some database clusters that require a primary key, but is otherwise unused. There must be only one row in this table, or an error will be thrown when running migrations: "Migration table is already locked". Run `knex migrate:unlock` to ensure that there is only one row in the table.'
  },
  {
    type: "heading",
    size: "md",
    content: "Custom migration sources",
    href: "custom-migration-sources"
  },
  {
    type: "text",
    content:
      "Knex supports custom migration sources, allowing you full control of where your migrations come from. This can be useful for custom folder structures, when bundling with webpack/browserify and other scenarios."
  },
  {
    type: "code",
    language: "js",
    content: `
      // Create a custom migration source class
      class MyMigrationSource {
        // Must return a Promise containing a list of migrations. 
        // Migrations can be whatever you want, they will be passed as
        // arguments to getMigrationName and getMigration
        getMigrations() {
          // In this example we are just returning migration names
          return Promise.resolve(['migration1'])
        }

        getMigrationName(migration) {
          return migration;
        }

        getMigration(migration) {
          switch(migration) {
            case 'migration1':
              return {
                up(knex)   { /* ... * / }
                down(knex) { /* ... * / }
              }
          }
        },
      }

      // pass an instance of your migration source as knex config
      knex.migrate.latest({ migrationSource: new MyMigrationSource() })
    `
  },
  {
    type: "heading",
    size: "sm",
    content: "Webpack migration source example"
  },
  {
    type: "text",
    content:
      "An example of how to create a migration source where migrations are included in a webpack bundle."
  },
  {
    type: "code",
    language: "js",
    content: `
    const path = require('path')

    class WebpackMigrationSource {
      constructor(migrationContext) {
        this.migrationContext = migrationContext
      }

      getMigrations() {
        return Promise.resolve(this.migrationContext.keys().sort())
      }

      getMigrationName(migration) {
        return path.parse(migration).base
      }
  
      getMigration(migration) {
        return this.migrationContext(migration)
      }
    }

    // pass an instance of your migration source as knex config
    knex.migrate.latest({
      migrationSource: new WebpackMigrationSource(require.context('./migrations', false, /\.js$/))
    })
    
    // with webpack >=5, require.context will add both the relative and absolute paths to the context
    // to avoid duplicate migration errors, you'll need to filter out one or the other
    // this example filters out absolute paths, leaving only the relative ones(./migrations/*.js):
    knex.migrate.latest({
      migrationSource: new WebpackMigrationSource(require.context('./migrations', false, /^\\.\\/.*\\.js$/))
    })
    `
  },
  // esm interop
  ...esmInterop
]

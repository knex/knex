const migrations = {
  migration1: {
    up(knex) {
      return knex.schema.createTable('migration_source_test_1', function (t) {
        t.increments();
        t.string('name');
      });
    },
    down(knex) {
      return knex.schema.dropTable('migration_source_test_1');
    },
  },

  migration2: {
    up(knex) {
      return knex.schema.createTable('migration_source_test_2', function (t) {
        t.increments();
        t.string('name');
      });
    },
    down(knex) {
      return knex.schema.dropTable('migration_source_test_2');
    },
  },
};

class MigrationSource {
  getMigrations() {
    return Promise.resolve(Object.keys(migrations));
  }
  getMigrationName(migration) {
    return 'migration1';
  }
  getMigration(migration) {
    return migrations[migration];
  }
}
const migrationSource = new MigrationSource();

module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/../test.sqlite3',
  },

  // Note that if any FS-related parameters are provided, such as directory, custom migration source is ignored
  migrations: {
    migrationSource,
  },
  seeds: {
    directory: __dirname + '/../knexfile_seeds',
  },
};

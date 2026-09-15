'use strict';

const tape = require('tape');
const { Migrator } = require('../../lib/migrations/migrate/Migrator');
const {
  FsMigrations,
} = require('../../lib/migrations/migrate/sources/fs-migrations');
const mergeConfig =
  require('../../lib/migrations/migrate/migrator-configuration-merger').getMergedConfig;

tape('migrate: constructor uses config.migrations', function (t) {
  t.plan(1);
  const migrator = new Migrator({
    client: { config: { migrations: { directory: '/some/dir' } } },
  });
  t.equal(migrator.config.directory, '/some/dir');
});

tape(
  'migrate: setConfig() overrides configs given in constructor',
  function (t) {
    t.plan(1);

    const config = mergeConfig({ directory: './custom/path' });

    t.equal(config.directory, './custom/path');
  }
);

tape(
  'migrate: getMergedConfig discards a plain migrationSource when directory is also set',
  function (t) {
    t.plan(1);

    const migrationSource = { getMigrations: () => Promise.resolve([]) };

    const config = mergeConfig({
      directory: './custom/path',
      migrationSource,
    });

    t.notEqual(config.migrationSource, migrationSource);
  }
);

tape(
  'migrate: getMergedConfig keeps a migrationSource that extends FsMigrations even when directory is also set',
  function (t) {
    t.plan(1);

    class CustomMigrationSource extends FsMigrations {
      constructor(directory) {
        super(directory);
      }
    }

    const migrationSource = new CustomMigrationSource('./custom/path');

    const config = mergeConfig({
      directory: './custom/path',
      migrationSource,
    });

    t.equal(config.migrationSource, migrationSource);
  }
);

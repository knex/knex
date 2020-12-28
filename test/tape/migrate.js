'use strict';

const tape = require('tape');
const { Migrator } = require('../../lib/migrations/migrate/Migrator');
const mergeConfig = require('../../lib/migrations/migrate/configuration-merger')
  .getMergedConfig;

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

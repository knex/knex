'use strict';

const { Migrator } = require('../../lib/migrations/migrate/Migrator');
const mergeConfig =
  require('../../lib/migrations/migrate/migrator-configuration-merger').getMergedConfig;

describe('Migrate config', () => {
  it('migrate: constructor uses config.migrations', () => {
    const migrator = new Migrator({
      client: { config: { migrations: { directory: '/some/dir' } } },
    });
    expect(migrator.config.directory).toBe('/some/dir');
  });

  it('migrate: setConfig() overrides configs given in constructor', () => {
    const config = mergeConfig({ directory: './custom/path' });
    expect(config.directory).toBe('./custom/path');
  });
});

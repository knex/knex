'use strict';

const Seed = require('../../lib/migrations/seed/Seeder');

describe('Seed config', () => {
  it('checks config.seeds for seed config', () => {
    const seeder = new Seed({
      client: { config: { seeds: { directory: '/some/dir' } } },
    });
    expect(seeder.config.directory).toBe('/some/dir');
  });
});

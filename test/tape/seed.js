'use strict';

const tape = require('tape');
const Seed = require('../../lib/migrations/seed/Seeder');

tape('checks config.seeds for seed config', function (t) {
  t.plan(1);
  const seeder = new Seed({
    client: { config: { seeds: { directory: '/some/dir' } } },
  });
  t.equal(seeder.config.directory, '/some/dir');
});

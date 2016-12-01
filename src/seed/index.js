// Seeder
// -------

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Promise from 'bluebird';
import { filter, includes, map, bind, template, each, extend } from 'lodash'

// The new seeds we're performing, typically called from the `knex.seed`
// interface on the main `knex` object. Passes the `knex` instance performing
// the seeds.
function Seeder(knex) {
  this.knex = knex;
  this.config = this.setConfig(knex.client.config.seeds);
}

// Runs all seed files for the given environment.
Seeder.prototype.run = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return this._seedData()
    .bind(this)
    .spread(function(all) {
      return this._runSeeds(all);
    });
});

// Creates a new seed file, with a given name.
Seeder.prototype.make = function(name, config) {
  this.config = this.setConfig(config);
  if (!name) Promise.rejected(new Error('A name must be specified for the generated seed'));
  return this._ensureFolder(config)
    .bind(this)
    .then(this._generateStubTemplate)
    .then(this._writeNewSeed(name));
};

// Lists all available seed files as a sorted array.
Seeder.prototype._listAll = Promise.method(function(config) {
  this.config = this.setConfig(config);
  return Promise.promisify(fs.readdir, {context: fs})(this._absoluteConfigDir())
    .bind(this)
    .then(seeds =>
      filter(seeds, function(value) {
        const extension = path.extname(value);
        return includes(
          ['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls', '.ts'], extension);
      }).sort()
    );
});

// Gets the seed file list from the specified seed directory.
Seeder.prototype._seedData = function() {
  return Promise.join(this._listAll());
};


// Ensures a folder for the seeds exist, dependent on the
// seed config settings.
Seeder.prototype._ensureFolder = function() {
  const dir = this._absoluteConfigDir();
  return Promise.promisify(fs.stat, {context: fs})(dir)
    .catch(() => Promise.promisify(mkdirp)(dir));
};

// Run seed files, in sequence.
Seeder.prototype._runSeeds = function(seeds) {
  return Promise.all(map(seeds, bind(this._validateSeedStructure, this)))
    .bind(this)
    .then(function(seeds) {
      return Promise.bind(this)
        .then(function() {
          return this._waterfallBatch(seeds);
        });
    });
};

// Validates seed files by requiring and checking for a `seed` function.
Seeder.prototype._validateSeedStructure = function(name) {
  const seed = require(path.join(this._absoluteConfigDir(), name));
  if (typeof seed.seed !== 'function') {
    throw new Error(`Invalid seed file: ${name} must have a seed function`);
  }
  return name;
};

// Generates the stub template for the current seed file, returning a compiled template.
Seeder.prototype._generateStubTemplate = function() {
  const stubPath = this.config.stub ||
    path.join(__dirname, 'stub', this.config.extension + '.stub');
  return Promise.promisify(fs.readFile, {context: fs})(stubPath).then(stub =>
    template(stub.toString(), {variable: 'd'})
  );
};

// Write a new seed to disk, using the config and generated filename,
// passing any `variables` given in the config to the template.
Seeder.prototype._writeNewSeed = function(name) {
  const { config } = this;
  const dir = this._absoluteConfigDir();
  return function(tmpl) {
    if (name[0] === '-') name = name.slice(1);
    const filename = name + '.' + config.extension;
    return Promise.promisify(fs.writeFile, {context: fs})(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  };
};

// Runs a batch of seed files.
Seeder.prototype._waterfallBatch = function(seeds) {
  const { knex } = this;
  const seedDirectory = this._absoluteConfigDir();
  let current = Promise.bind({failed: false, failedOn: 0});
  const log = [];
  each(seeds, function(seed) {
    const name = path.join(seedDirectory, seed);
    seed = require(name);

    // Run each seed file.
    current = current.then(() => seed.seed(knex, Promise)).then(function() {
      log.push(name);
    });
  });

  return current.thenReturn([log]);
};

Seeder.prototype._absoluteConfigDir = function() {
  return path.resolve(process.cwd(), this.config.directory);
};

Seeder.prototype.setConfig = function(config) {
  return extend({
    extension: 'js',
    directory: './seeds'
  }, this.config || {}, config);
};

export default Seeder;

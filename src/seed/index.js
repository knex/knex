// Seeder
// -------

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Promise from 'bluebird';
import { template, each } from 'lodash'

const EXTENSIONS = ['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls']

// The new seeds we're performing, typically called from the `knex.seed`
// interface on the main `knex` object. Passes the `knex` instance performing
// the seeds.
export default class Seeder {

  constructor(knex) {
    this.knex = knex
    this.config = this.setConfig(knex.client.config.seeds)
  }

  // Runs all seed files for the given environment.
  run(config) {
    return Promise.try(() => {
      this.config = this.setConfig(config);
      return this._seedData()
        .spread((all) => {
          return this._runSeeds(all);
        });
    })
  }

  // Creates a new seed file, with a given name.
  make(name, config) {
    this.config = this.setConfig(config);
    if (!name) Promise.rejected(new Error('A name must be specified for the generated seed'));
    return this._ensureFolder(config)
      .then(val => this._generateStubTemplate(val))
      .then(val => this._writeNewSeed(name, val));
  }

  // Lists all available seed files as a sorted array.
  async _listAll(config) {
    this.config = this.setConfig(config);
    return Promise.promisify(fs.readdir, {context: fs})(this._absoluteConfigDir())
      .then(seeds => {
        return seeds.filter(function(value) {
          const extension = path.extname(value);
          return EXTENSIONS.indexOf(extension) !== -1
        }).sort()
      })
  }

  // Gets the seed file list from the specified seed directory.
  _seedData() {
    return Promise.join(this._listAll());
  }

  // Ensures a folder for the seeds exist, dependent on the
  // seed config settings.
  _ensureFolder() {
    const dir = this._absoluteConfigDir();
    return Promise.promisify(fs.stat, {context: fs})(dir)
      .catch(() => Promise.promisify(mkdirp)(dir));
  }

  // Run seed files, in sequence.
  _runSeeds(seeds) {
    return Promise.all(seeds.map(name => this._validateSeedStructure(name)))
      .then((seeds) => this._waterfallBatch(seeds))
  }

  // Validates seed files by requiring and checking for a `seed` function.
  _validateSeedStructure(name) {
    const seed = require(path.join(this._absoluteConfigDir(), name));
    if (typeof seed.seed !== 'function') {
      throw new Error(`Invalid seed file: ${name} must have a seed function`);
    }
    return name
  }

  // Generates the stub template for the current seed file, returning a compiled template.
  _generateStubTemplate() {
    const stubPath = this.config.stub ||
      path.join(__dirname, 'stub', this.config.extension + '.stub');
    return Promise.promisify(fs.readFile, {context: fs})(stubPath).then(stub =>
      template(stub.toString(), {variable: 'd'})
    );
  }

  // Write a new seed to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  _writeNewSeed(name, tmpl) {
    const { config } = this;
    const dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    const filename = name + '.' + config.extension;
    return Promise.promisify(fs.writeFile, {context: fs})(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  }

  // Runs a batch of seed files.
  _waterfallBatch(seeds) {
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
  }

  _absoluteConfigDir() {
    return path.resolve(process.cwd(), this.config.directory);
  }

  setConfig(config) {
    return {
      extension: 'js',
      directory: './seeds',
      ...this.config,
      ...config
    }
  }

}

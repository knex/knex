// Seeder
// -------

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const Bluebird = require('bluebird');
const {
  filter,
  includes,
  map,
  bind,
  template,
  each,
  extend,
} = require('lodash');
const { writeJsFileUsingTemplate } = require('../util/template');

// The new seeds we're performing, typically called from the `knex.seed`
// interface on the main `knex` object. Passes the `knex` instance performing
// the seeds.
class Seeder {
  constructor(knex) {
    this.knex = knex;
    this.config = this.setConfig(knex.client.config.seeds);
  }

  // Runs seed files for the given environment.
  async run(config) {
    this.config = this.setConfig(config);
    const [all] = await this._seedData();
    const files =
      config && config.specific
        ? all.filter((file) => file === config.specific)
        : all;
    return this._runSeeds(files);
  }

  // Creates a new seed file, with a given name.
  async make(name, config) {
    this.config = this.setConfig(config);
    if (!name)
      throw new Error('A name must be specified for the generated seed');
    await this._ensureFolder(config);
    const seedPath = await this._writeNewSeed(name);
    return seedPath;
  }

  // Lists all available seed files as a sorted array.
  async _listAll(config) {
    this.config = this.setConfig(config);
    const loadExtensions = this.config.loadExtensions;
    return Bluebird.promisify(fs.readdir, { context: fs })(
      this._absoluteConfigDir()
    )
      .bind(this)
      .then((seeds) =>
        filter(seeds, function(value) {
          const extension = path.extname(value);
          return includes(loadExtensions, extension);
        }).sort()
      );
  }

  // Gets the seed file list from the specified seed directory.
  _seedData() {
    return Bluebird.join(this._listAll());
  }

  // Ensures a folder for the seeds exist, dependent on the
  // seed config settings.
  _ensureFolder() {
    const dir = this._absoluteConfigDir();
    return Bluebird.promisify(fs.stat, { context: fs })(dir).catch(() =>
      Bluebird.promisify(mkdirp)(dir)
    );
  }

  // Run seed files, in sequence.
  _runSeeds(seeds) {
    return Bluebird.all(map(seeds, bind(this._validateSeedStructure, this)))
      .bind(this)
      .then(function(seeds) {
        return Bluebird.bind(this).then(function() {
          return this._waterfallBatch(seeds);
        });
      });
  }

  // Validates seed files by requiring and checking for a `seed` function.
  _validateSeedStructure(name) {
    const seed = require(path.join(this._absoluteConfigDir(), name));
    if (typeof seed.seed !== 'function') {
      throw new Error(`Invalid seed file: ${name} must have a seed function`);
    }
    return name;
  }

  _getStubPath() {
    return (
      this.config.stub ||
      path.join(__dirname, 'stub', this.config.extension + '.stub')
    );
  }

  // Generates the stub template for the current seed file, returning a compiled template.
  _generateStubTemplate() {
    const stubPath = this._getStubPath();
    return Bluebird.promisify(fs.readFile, { context: fs })(stubPath).then(
      (stub) => template(stub.toString(), { variable: 'd' })
    );
  }

  _getNewStubFileName(name) {
    if (name[0] === '-') name = name.slice(1);
    return name + '.' + this.config.extension;
  }

  _getNewStubFilePath(name) {
    return path.join(this._absoluteConfigDir(), this._getNewStubFileName(name));
  } 

  // Write a new seed to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.
  async _writeNewSeed(name) {
    const seedPath = this._getNewStubFilePath(name);
    await writeJsFileUsingTemplate(
      seedPath,
      this._getStubPath(),
      { variable: 'd' },
      this.config.variables || {}
    );
    return seedPath;
  }

  // Runs a batch of seed files.
  _waterfallBatch(seeds) {
    const { knex } = this;
    const seedDirectory = this._absoluteConfigDir();
    let current = Bluebird.bind({ failed: false, failedOn: 0 });
    const log = [];
    each(seeds, (seed) => {
      const name = path.join(seedDirectory, seed);
      seed = require(name);

      // Run each seed file.
      current = current.then(() =>
        // Nesting promise to prevent bubbling up of error on catch
        Promise.resolve()
          .then(() => seed.seed(knex))
          .then(() => log.push(name))
          .catch((originalError) => {
            const error = new Error(
              `Error while executing "${name}" seed: ${originalError.message}`
            );
            error.original = originalError;
            error.stack =
              error.stack
                .split('\n')
                .slice(0, 2)
                .join('\n') +
              '\n' +
              originalError.stack;
            throw error;
          })
      );
    });

    return current.then(() => [log]);
  }

  _absoluteConfigDir() {
    return path.resolve(process.cwd(), this.config.directory);
  }

  setConfig(config) {
    return extend(
      {
        extension: 'js',
        directory: './seeds',
        loadExtensions: [
          '.co',
          '.coffee',
          '.eg',
          '.iced',
          '.js',
          '.litcoffee',
          '.ls',
          '.ts',
        ],
      },
      this.config || {},
      config
    );
  }
}

module.exports = Seeder;

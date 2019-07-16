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
  flatten,
} = require('lodash');

// The new seeds we're performing, typically called from the `knex.seed`
// interface on the main `knex` object. Passes the `knex` instance performing
// the seeds.
function Seeder(knex) {
  this.knex = knex;
  this.config = this.setConfig(knex.client.config.seeds);
}

// Runs seed files for the given environment.
Seeder.prototype.run = async function(config) {
  this.config = this.setConfig(config);
  return this._seedData()
    .bind(this)
    .then(([all]) => {
      const files =
        config && config.specific
          ? all.filter((file) => file === config.specific)
          : all;

      return this._runSeeds(files);
    });
};

// Creates a new seed file, with a given name.
Seeder.prototype.make = function(name, config, subDirectory) {
  this.config = this.setConfig(config);
  if (!name)
    Bluebird.rejected(
      new Error('A name must be specified for the generated seed')
    );
  if (!subDirectory)
    ({ name, subDirectory } = this._extractSubDirectoryFromFilename(name));
  return this._ensureFolder(config)
    .bind(this)
    .then(this._generateStubTemplate)
    .then(this._writeNewSeed(name, subDirectory));
};

Seeder.prototype._extractSubDirectoryFromFilename = function(filename) {
  if (/\S+\/\S+/.test(filename)) {
    const matches = filename.match(/(.*)\/(.*)/);
    return { name: matches[2], subDirectory: matches[1] };
  }
  return { name: filename, subDirectory: this._getDefaultSeedDirectory() };
};

Seeder.prototype._getDefaultSeedDirectory = function() {
  if (this._absoluteConfigDirs().length > 1) {
    Bluebird.rejected('A subdirectory must be specified');
  } else if (this._absoluteConfigDirs().length === 1) {
    return this._absoluteConfigDirs()[0].replace(/.*\/(.*\/?)/, '$1');
  }
};

// Lists all available seed files as a sorted array.
Seeder.prototype._listAll = async function(config) {
  this.config = this.setConfig(config);
  const loadExtensions = this.config.loadExtensions;
  return Bluebird.all(this._absoluteConfigDirs()).then((dirs) => {
    return Bluebird.all(
      dirs.map((dir) => {
        return Bluebird.promisify(fs.readdir, { context: fs })(dir)
          .bind(this)
          .then((seeds) =>
            filter(seeds, function(value) {
              const extension = path.extname(value);
              return includes(loadExtensions, extension);
            }).sort()
          );
      })
    ).then((sortedLists) => {
      const allSeedFiles = flatten(sortedLists);
      if (this.config.sortDirsSeparately) {
        return allSeedFiles;
      }
      return flatten(sortedLists).sort();
    });
  });
};

// Gets the seed file list from the specified seed directory.
Seeder.prototype._seedData = function() {
  return Bluebird.join(this._listAll());
};

// Ensures a folder for the seeds exist, dependent on the
// seed config settings.
Seeder.prototype._ensureFolder = function() {
  const dirs = this._absoluteConfigDirs();
  return Bluebird.all(
    dirs.map((dir) => {
      return Bluebird.promisify(fs.stat, { context: fs })(String(dir)).catch(
        () => Bluebird.promisify(mkdirp)(dir)
      );
    })
  );
};

// Run seed files, in sequence.
Seeder.prototype._runSeeds = function(seeds) {
  return Bluebird.all(map(seeds, bind(this._validateSeedStructure, this)))
    .bind(this)
    .then(function(seeds) {
      return Bluebird.bind(this).then(function() {
        return this._waterfallBatch(seeds);
      });
    });
};

// Validates seed files by requiring and checking for a `seed` function.
Seeder.prototype._validateSeedStructure = function(name) {
  return Bluebird.all(
    this._absoluteConfigDirs().map((dir) => {
      return new Promise((resolve) => {
        fs.access(path.join(dir, name), fs.constants.F_OK, (err) => {
          err ? resolve(false) : resolve(path.join(dir, name));
        });
      });
    })
  )
    .filter(Boolean)
    .map((listOfOneName) => {
      const seedExport = require(listOfOneName);
      if (typeof seedExport.seed !== 'function') {
        throw new Error(`Invalid seed file: ${name} must have a seed function`);
      }
      return name;
    });
};

// Generates the stub template for the current seed file, returning a compiled template.
Seeder.prototype._generateStubTemplate = function() {
  const stubPath =
    this.config.stub ||
    path.join(__dirname, 'stub', this.config.extension + '.stub');
  return Bluebird.promisify(fs.readFile, { context: fs })(stubPath).then(
    (stub) => template(stub.toString(), { variable: 'd' })
  );
};

// Write a new seed to disk, using the config and generated filename,
// passing any `variables` given in the config to the template.
Seeder.prototype._writeNewSeed = function(name, subDirectory) {
  const { config } = this;
  let dir = this._absoluteConfigDirs();
  if (Array.isArray(dir)) {
    if (!subDirectory && dir.length > 1) {
      throw new Error(`--subdirectory must be specified when multiple seed folders exist.
      \tCurrent seed folders: ${this._absoluteConfigDirs()
        .map((d) => `"${d.replace(/.*\/(.*\/?)/, '$1')}"`)
        .join(', ')}`);
    }
    dir = dir.find((d) => new RegExp(`${subDirectory}$`).test(d));
  }
  return function(tmpl) {
    if (name[0] === '-') name = name.slice(1);
    const filename = name + '.' + config.extension;
    return Bluebird.promisify(fs.writeFile, { context: fs })(
      path.join(dir, filename),
      tmpl(config.variables || {})
    ).return(path.join(dir, filename));
  };
};

// Runs a batch of seed files.
Seeder.prototype._waterfallBatch = function(seeds) {
  const { knex } = this;
  const seedDirectories = this._absoluteConfigDirs();
  let current = Bluebird.bind({ failed: false, failedOn: 0 });
  const log = [];

  each(seedDirectories, (seedDirectory) => {
    each(seeds, (seed) => {
      const name = path.join(seedDirectory, String(seed));
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
  });

  return current.then(() => [log]);
};

Seeder.prototype._absoluteConfigDirs = function() {
  const list = Array.isArray(this.config.directory)
    ? this.config.directory
    : [this.config.directory];

  return list.map((dir) => path.resolve(process.cwd(), dir));
};

Seeder.prototype.setConfig = function(config) {
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
};

module.exports = Seeder;

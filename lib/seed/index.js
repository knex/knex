'use strict';

exports.__esModule = true;

var _extend2 = require('lodash/extend');

var _extend3 = _interopRequireDefault(_extend2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _template2 = require('lodash/template');

var _template3 = _interopRequireDefault(_template2);

var _bind2 = require('lodash/bind');

var _bind3 = _interopRequireDefault(_bind2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The new seeds we're performing, typically called from the `knex.seed`
// interface on the main `knex` object. Passes the `knex` instance performing
// the seeds.
// Seeder
// -------

function Seeder(knex) {
  this.knex = knex;
  this.config = this.setConfig(knex.client.config.seeds);
}

// Runs all seed files for the given environment.
Seeder.prototype.run = _bluebird2.default.method(function (config) {
  this.config = this.setConfig(config);
  return this._seedData().bind(this).spread(function (all) {
    return this._runSeeds(all);
  });
});

// Creates a new seed file, with a given name.
Seeder.prototype.make = function (name, config) {
  this.config = this.setConfig(config);
  if (!name) _bluebird2.default.rejected(new Error('A name must be specified for the generated seed'));
  return this._ensureFolder(config).bind(this).then(this._generateStubTemplate).then(this._writeNewSeed(name));
};

// Lists all available seed files as a sorted array.
Seeder.prototype._listAll = _bluebird2.default.method(function (config) {
  this.config = this.setConfig(config);
  return _bluebird2.default.promisify(_fs2.default.readdir, { context: _fs2.default })(this._absoluteConfigDir()).bind(this).then(function (seeds) {
    return (0, _filter3.default)(seeds, function (value) {
      var extension = _path2.default.extname(value);
      return (0, _includes3.default)(['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls', '.ts'], extension);
    }).sort();
  });
});

// Gets the seed file list from the specified seed directory.
Seeder.prototype._seedData = function () {
  return _bluebird2.default.join(this._listAll());
};

// Ensures a folder for the seeds exist, dependent on the
// seed config settings.
Seeder.prototype._ensureFolder = function () {
  var dir = this._absoluteConfigDir();
  return _bluebird2.default.promisify(_fs2.default.stat, { context: _fs2.default })(dir).catch(function () {
    return _bluebird2.default.promisify(_mkdirp2.default)(dir);
  });
};

// Run seed files, in sequence.
Seeder.prototype._runSeeds = function (seeds) {
  return _bluebird2.default.all((0, _map3.default)(seeds, (0, _bind3.default)(this._validateSeedStructure, this))).bind(this).then(function (seeds) {
    return _bluebird2.default.bind(this).then(function () {
      return this._waterfallBatch(seeds);
    });
  });
};

// Validates seed files by requiring and checking for a `seed` function.
Seeder.prototype._validateSeedStructure = function (name) {
  var seed = require(_path2.default.join(this._absoluteConfigDir(), name));
  if (typeof seed.seed !== 'function') {
    throw new Error('Invalid seed file: ' + name + ' must have a seed function');
  }
  return name;
};

// Generates the stub template for the current seed file, returning a compiled template.
Seeder.prototype._generateStubTemplate = function () {
  var stubPath = this.config.stub || _path2.default.join(__dirname, 'stub', this.config.extension + '.stub');
  return _bluebird2.default.promisify(_fs2.default.readFile, { context: _fs2.default })(stubPath).then(function (stub) {
    return (0, _template3.default)(stub.toString(), { variable: 'd' });
  });
};

// Write a new seed to disk, using the config and generated filename,
// passing any `variables` given in the config to the template.
Seeder.prototype._writeNewSeed = function (name) {
  var config = this.config;

  var dir = this._absoluteConfigDir();
  return function (tmpl) {
    if (name[0] === '-') name = name.slice(1);
    var filename = name + '.' + config.extension;
    return _bluebird2.default.promisify(_fs2.default.writeFile, { context: _fs2.default })(_path2.default.join(dir, filename), tmpl(config.variables || {})).return(_path2.default.join(dir, filename));
  };
};

// Runs a batch of seed files.
Seeder.prototype._waterfallBatch = function (seeds) {
  var knex = this.knex;

  var seedDirectory = this._absoluteConfigDir();
  var current = _bluebird2.default.bind({ failed: false, failedOn: 0 });
  var log = [];
  (0, _each3.default)(seeds, function (seed) {
    var name = _path2.default.join(seedDirectory, seed);
    seed = require(name);

    // Run each seed file.
    current = current.then(function () {
      return seed.seed(knex, _bluebird2.default);
    }).then(function () {
      log.push(name);
    });
  });

  return current.thenReturn([log]);
};

Seeder.prototype._absoluteConfigDir = function () {
  return _path2.default.resolve(process.cwd(), this.config.directory);
};

Seeder.prototype.setConfig = function (config) {
  return (0, _extend3.default)({
    extension: 'js',
    directory: './seeds'
  }, this.config || {}, config);
};

exports.default = Seeder;
module.exports = exports['default'];
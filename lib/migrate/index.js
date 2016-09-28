'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _template2 = require('lodash/template');

var _template3 = _interopRequireDefault(_template2);

var _max2 = require('lodash/max');

var _max3 = _interopRequireDefault(_max2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isBoolean2 = require('lodash/isBoolean');

var _isBoolean3 = _interopRequireDefault(_isBoolean2);

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _difference2 = require('lodash/difference');

var _difference3 = _interopRequireDefault(_difference2);

var _bind2 = require('lodash/bind');

var _bind3 = _interopRequireDefault(_bind2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Migrator
// -------
function LockError(msg) {
  this.name = 'MigrationLocked';
  this.message = msg;
}
(0, _inherits2.default)(LockError, Error);

var SUPPORTED_EXTENSIONS = (0, _freeze2.default)(['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls']);

var CONFIG_DEFAULT = (0, _freeze2.default)({
  extension: 'js',
  tableName: 'knex_migrations',
  directory: './migrations',
  disableTransactions: false
});

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.

var Migrator = function () {
  function Migrator(knex) {
    (0, _classCallCheck3.default)(this, Migrator);

    this.knex = knex;
    this.config = this.setConfig(knex.client.config.migrations);
  }

  // Migrators to the latest configuration.


  Migrator.prototype.latest = function latest(config) {
    var _this = this;

    this.config = this.setConfig(config);
    return this._migrationData().tap(validateMigrationList).spread(function (all, completed) {
      return _this._runBatch((0, _difference3.default)(all, completed), 'up');
    });
  };

  // Rollback the last "batch" of migrations that were run.


  Migrator.prototype.rollback = function rollback(config) {
    var _this2 = this;

    return _bluebird2.default.try(function () {
      _this2.config = _this2.setConfig(config);
      return _this2._migrationData().tap(validateMigrationList).then(function (val) {
        return _this2._getLastBatch(val);
      }).then(function (migrations) {
        return _this2._runBatch((0, _map3.default)(migrations, 'name'), 'down');
      });
    });
  };

  Migrator.prototype.status = function status(config) {
    this.config = this.setConfig(config);

    return _bluebird2.default.all([this.knex(this.config.tableName).select('*'), this._listAll()]).spread(function (db, code) {
      return db.length - code.length;
    });
  };

  // Retrieves and returns the current migration version we're on, as a promise.
  // If no migrations have been run yet, return "none".


  Migrator.prototype.currentVersion = function currentVersion(config) {
    this.config = this.setConfig(config);
    return this._listCompleted(config).then(function (completed) {
      var val = (0, _max3.default)((0, _map3.default)(completed, function (value) {
        return value.split('_')[0];
      }));
      return (0, _isUndefined3.default)(val) ? 'none' : val;
    });
  };

  Migrator.prototype.forceFreeMigrationsLock = function forceFreeMigrationsLock(config) {
    var _this3 = this;

    this.config = this.setConfig(config);
    var lockTable = this._getLockTableName();
    return this.knex.schema.hasTable(lockTable).then(function (exist) {
      return exist && _this3._freeLock();
    });
  };

  // Creates a new migration, with a given name.


  Migrator.prototype.make = function make(name, config) {
    var _this4 = this;

    this.config = this.setConfig(config);
    if (!name) _bluebird2.default.rejected(new Error('A name must be specified for the generated migration'));
    return this._ensureFolder(config).then(function (val) {
      return _this4._generateStubTemplate(val);
    }).then(function (val) {
      return _this4._writeNewMigration(name, val);
    });
  };

  // Lists all available migration versions, as a sorted array.


  Migrator.prototype._listAll = function _listAll(config) {
    this.config = this.setConfig(config);
    return _bluebird2.default.promisify(_fs2.default.readdir, { context: _fs2.default })(this._absoluteConfigDir()).then(function (migrations) {
      return (0, _filter3.default)(migrations, function (value) {
        var extension = _path2.default.extname(value);
        return (0, _includes3.default)(SUPPORTED_EXTENSIONS, extension);
      }).sort();
    });
  };

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.


  Migrator.prototype._ensureFolder = function _ensureFolder() {
    var dir = this._absoluteConfigDir();
    return _bluebird2.default.promisify(_fs2.default.stat, { context: _fs2.default })(dir).catch(function () {
      return _bluebird2.default.promisify(_mkdirp2.default)(dir);
    });
  };

  // Ensures that a proper table has been created, dependent on the migration
  // config settings.


  Migrator.prototype._ensureTable = function _ensureTable() {
    var _this5 = this;

    var table = this.config.tableName;
    var lockTable = this._getLockTableName();
    return this.knex.schema.hasTable(table).then(function (exists) {
      return !exists && _this5._createMigrationTable(table);
    }).then(function () {
      return _this5.knex.schema.hasTable(lockTable);
    }).then(function (exists) {
      return !exists && _this5._createMigrationLockTable(lockTable);
    }).then(function () {
      return _this5.knex(lockTable).select('*');
    }).then(function (data) {
      return !data.length && _this5.knex(lockTable).insert({ is_locked: 0 });
    });
  };

  // Create the migration table, if it doesn't already exist.


  Migrator.prototype._createMigrationTable = function _createMigrationTable(tableName) {
    return this.knex.schema.createTableIfNotExists(tableName, function (t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    });
  };

  Migrator.prototype._createMigrationLockTable = function _createMigrationLockTable(tableName) {
    return this.knex.schema.createTableIfNotExists(tableName, function (t) {
      t.integer('is_locked');
    });
  };

  Migrator.prototype._getLockTableName = function _getLockTableName() {
    return this.config.tableName + '_lock';
  };

  Migrator.prototype._isLocked = function _isLocked(trx) {
    var tableName = this._getLockTableName();
    return this.knex(tableName).transacting(trx).forUpdate().select('*').then(function (data) {
      return data[0].is_locked;
    });
  };

  Migrator.prototype._lockMigrations = function _lockMigrations(trx) {
    var tableName = this._getLockTableName();
    return this.knex(tableName).transacting(trx).update({ is_locked: 1 });
  };

  Migrator.prototype._getLock = function _getLock() {
    var _this6 = this;

    return this.knex.transaction(function (trx) {
      return _this6._isLocked(trx).then(function (isLocked) {
        if (isLocked) {
          throw new Error("Migration table is already locked");
        }
      }).then(function () {
        return _this6._lockMigrations(trx);
      });
    }).catch(function (err) {
      throw new LockError(err.message);
    });
  };

  Migrator.prototype._freeLock = function _freeLock() {
    var tableName = this._getLockTableName();
    return this.knex(tableName).update({ is_locked: 0 });
  };

  // Run a batch of current migrations, in sequence.


  Migrator.prototype._runBatch = function _runBatch(migrations, direction) {
    var _this7 = this;

    return this._getLock().then(function () {
      return _bluebird2.default.all((0, _map3.default)(migrations, (0, _bind3.default)(_this7._validateMigrationStructure, _this7)));
    }).then(function () {
      return _this7._latestBatchNumber();
    }).then(function (batchNo) {
      if (direction === 'up') batchNo++;
      return batchNo;
    }).then(function (batchNo) {
      return _this7._waterfallBatch(batchNo, migrations, direction);
    }).tap(function () {
      return _this7._freeLock();
    }).catch(function (error) {
      var cleanupReady = _bluebird2.default.resolve();

      if (error instanceof LockError) {
        // If locking error do not free the lock.
        helpers.warn('Can\'t take lock to run migrations: ' + error.message);
        helpers.warn('If you are sure migrations are not running you can release the ' + 'lock manually by deleting all the rows from migrations lock ' + 'table: ' + _this7._getLockTableName());
      } else {
        helpers.warn('migrations failed with error: ' + error.message);
        // If the error was not due to a locking issue, then remove the lock.
        cleanupReady = _this7._freeLock();
      }

      return cleanupReady.finally(function () {
        throw error;
      });
    });
  };

  // Validates some migrations by requiring and checking for an `up` and `down`
  // function.


  Migrator.prototype._validateMigrationStructure = function _validateMigrationStructure(name) {
    var migration = require(_path2.default.join(this._absoluteConfigDir(), name));
    if (typeof migration.up !== 'function' || typeof migration.down !== 'function') {
      throw new Error('Invalid migration: ' + name + ' must have both an up and down function');
    }
    return name;
  };

  // Lists all migrations that have been completed for the current db, as an
  // array.


  Migrator.prototype._listCompleted = function _listCompleted() {
    var _this8 = this;

    var tableName = this.config.tableName;

    return this._ensureTable(tableName).then(function () {
      return _this8.knex(tableName).orderBy('id').select('name');
    }).then(function (migrations) {
      return (0, _map3.default)(migrations, 'name');
    });
  };

  // Gets the migration list from the specified migration directory, as well as
  // the list of completed migrations to check what should be run.


  Migrator.prototype._migrationData = function _migrationData() {
    return _bluebird2.default.all([this._listAll(), this._listCompleted()]);
  };

  // Generates the stub template for the current migration, returning a compiled
  // template.


  Migrator.prototype._generateStubTemplate = function _generateStubTemplate() {
    var stubPath = this.config.stub || _path2.default.join(__dirname, 'stub', this.config.extension + '.stub');
    return _bluebird2.default.promisify(_fs2.default.readFile, { context: _fs2.default })(stubPath).then(function (stub) {
      return (0, _template3.default)(stub.toString(), { variable: 'd' });
    });
  };

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.


  Migrator.prototype._writeNewMigration = function _writeNewMigration(name, tmpl) {
    var config = this.config;

    var dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    var filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return _bluebird2.default.promisify(_fs2.default.writeFile, { context: _fs2.default })(_path2.default.join(dir, filename), tmpl(config.variables || {})).return(_path2.default.join(dir, filename));
  };

  // Get the last batch of migrations, by name, ordered by insert id in reverse
  // order.


  Migrator.prototype._getLastBatch = function _getLastBatch() {
    var tableName = this.config.tableName;

    return this.knex(tableName).where('batch', function (qb) {
      qb.max('batch').from(tableName);
    }).orderBy('id', 'desc');
  };

  // Returns the latest batch number.


  Migrator.prototype._latestBatchNumber = function _latestBatchNumber() {
    return this.knex(this.config.tableName).max('batch as max_batch').then(function (obj) {
      return obj[0].max_batch || 0;
    });
  };

  // If transaction config for a single migration is defined, use that.
  // Otherwise, rely on the common config. This allows enabling/disabling
  // transaction for a single migration at will, regardless of the common
  // config.


  Migrator.prototype._useTransaction = function _useTransaction(migration, allTransactionsDisabled) {
    var singleTransactionValue = (0, _get3.default)(migration, 'config.transaction');

    return (0, _isBoolean3.default)(singleTransactionValue) ? singleTransactionValue : !allTransactionsDisabled;
  };

  // Runs a batch of `migrations` in a specified `direction`, saving the
  // appropriate database information as the migrations are run.


  Migrator.prototype._waterfallBatch = function _waterfallBatch(batchNo, migrations, direction) {
    var _this9 = this;

    var knex = this.knex;
    var _config = this.config;
    var tableName = _config.tableName;
    var disableTransactions = _config.disableTransactions;

    var directory = this._absoluteConfigDir();
    var current = _bluebird2.default.bind({ failed: false, failedOn: 0 });
    var log = [];
    (0, _each3.default)(migrations, function (migration) {
      var name = migration;
      migration = require(directory + '/' + name);

      // We're going to run each of the migrations in the current "up".
      current = current.then(function () {
        if (_this9._useTransaction(migration, disableTransactions)) {
          return _this9._transaction(migration, direction, name);
        }
        return warnPromise(migration[direction](knex, _bluebird2.default), name);
      }).then(function () {
        log.push(_path2.default.join(directory, name));
        if (direction === 'up') {
          return knex(tableName).insert({
            name: name,
            batch: batchNo,
            migration_time: new Date()
          });
        }
        if (direction === 'down') {
          return knex(tableName).where({ name: name }).del();
        }
      });
    });

    return current.thenReturn([batchNo, log]);
  };

  Migrator.prototype._transaction = function _transaction(migration, direction, name) {
    return this.knex.transaction(function (trx) {
      return warnPromise(migration[direction](trx, _bluebird2.default), name, function () {
        trx.commit();
      });
    });
  };

  Migrator.prototype._absoluteConfigDir = function _absoluteConfigDir() {
    return _path2.default.resolve(process.cwd(), this.config.directory);
  };

  Migrator.prototype.setConfig = function setConfig(config) {
    return (0, _assign3.default)({}, CONFIG_DEFAULT, this.config || {}, config);
  };

  return Migrator;
}();

// Validates that migrations are present in the appropriate directories.


exports.default = Migrator;
function validateMigrationList(migrations) {
  var all = migrations[0];
  var completed = migrations[1];
  var diff = (0, _difference3.default)(completed, all);
  if (!(0, _isEmpty3.default)(diff)) {
    throw new Error('The migration directory is corrupt, the following files are missing: ' + diff.join(', '));
  }
}

function warnPromise(value, name, fn) {
  if (!value || typeof value.then !== 'function') {
    helpers.warn('migration ' + name + ' did not return a promise');
    if (fn && typeof fn === 'function') fn();
  }
  return value;
}

// Ensure that we have 2 places for each of the date segments.
function padDate(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
}

// Get a date object in the correct format, without requiring a full out library
// like "moment.js".
function yyyymmddhhmmss() {
  var d = new Date();
  return d.getFullYear().toString() + padDate(d.getMonth() + 1) + padDate(d.getDate()) + padDate(d.getHours()) + padDate(d.getMinutes()) + padDate(d.getSeconds());
}
module.exports = exports['default'];
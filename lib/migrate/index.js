// Migrator
// -------
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var Promise = require('../promise');
var helpers = require('../helpers');
var assign = require('lodash/object/assign');
var inherits = require('inherits');

function LockError(msg) {
  this.name = 'MigrationLocked';
  this.message = msg;
}
inherits(LockError, Error);

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.

var Migrator = (function () {
  function Migrator(knex) {
    _classCallCheck(this, Migrator);

    this.knex = knex;
    this.config = this.setConfig(knex.client.config.migrations);
  }

  // Validates that migrations are present in the appropriate directories.

  // Migrators to the latest configuration.

  Migrator.prototype.latest = function latest(config) {
    var _this = this;

    this.config = this.setConfig(config);
    return this._migrationData().tap(validateMigrationList).spread(function (all, completed) {
      return _this._runBatch(_.difference(all, completed), 'up');
    });
  };

  // Rollback the last "batch" of migrations that were run.

  Migrator.prototype.rollback = function rollback(config) {
    var _this2 = this;

    return Promise['try'](function () {
      _this2.config = _this2.setConfig(config);
      return _this2._migrationData().tap(validateMigrationList).then(function (val) {
        return _this2._getLastBatch(val);
      }).then(function (migrations) {
        return _this2._runBatch(_.pluck(migrations, 'name'), 'down');
      });
    });
  };

  Migrator.prototype.status = function status(config) {
    this.config = this.setConfig(config);

    return Promise.all([this.knex(this.config.tableName).select('*'), this._listAll()]).spread(function (db, code) {
      return db.length - code.length;
    });
  };

  // Retrieves and returns the current migration version
  // we're on, as a promise. If there aren't any migrations run yet,
  // return "none" as the value for the `currentVersion`.

  Migrator.prototype.currentVersion = function currentVersion(config) {
    this.config = this.setConfig(config);
    return this._listCompleted(config).then(function (completed) {
      var val = _.chain(completed).map(function (value) {
        return value.split('_')[0];
      }).max().value();
      return val === -Infinity ? 'none' : val;
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
    if (!name) Promise.rejected(new Error('A name must be specified for the generated migration'));
    return this._ensureFolder(config).then(function (val) {
      return _this4._generateStubTemplate(val);
    }).then(function (val) {
      return _this4._writeNewMigration(name, val);
    });
  };

  // Lists all available migration versions, as a sorted array.

  Migrator.prototype._listAll = function _listAll(config) {
    this.config = this.setConfig(config);
    return Promise.promisify(fs.readdir, fs)(this._absoluteConfigDir()).then(function (migrations) {
      return _.filter(migrations, function (value) {
        var extension = path.extname(value);
        return _.contains(['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls'], extension);
      }).sort();
    });
  };

  // Ensures a folder for the migrations exist, dependent on the
  // migration config settings.

  Migrator.prototype._ensureFolder = function _ensureFolder() {
    var dir = this._absoluteConfigDir();
    return Promise.promisify(fs.stat, fs)(dir)['catch'](function () {
      return Promise.promisify(mkdirp)(dir);
    });
  };

  // Ensures that the proper table has been created,
  // dependent on the migration config settings.

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
    return this.knex.schema.createTable(tableName, function (t) {
      t.increments();
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    });
  };

  Migrator.prototype._createMigrationLockTable = function _createMigrationLockTable(tableName) {
    return this.knex.schema.createTable(tableName, function (t) {
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
    })['catch'](function (err) {
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
      return Promise.all(_.map(migrations, _this7._validateMigrationStructure, _this7));
    }).then(function () {
      return _this7._latestBatchNumber();
    }).then(function (batchNo) {
      if (direction === 'up') batchNo++;
      return batchNo;
    }).then(function (batchNo) {
      return _this7._waterfallBatch(batchNo, migrations, direction);
    }).then(function () {
      return _this7._freeLock();
    })['catch'](function (error) {
      var cleanupReady = Promise.resolve();

      if (error instanceof LockError) {
        // if locking error do not free the lock
        helpers.warn('Cant take lock to run migrations: ' + error.message);
        helpers.warn('If you are sue migrations are not running you can release ' + 'lock manually by deleting all the rows from migrations lock table: ' + _this7._getLockTableName());
      } else {
        helpers.warn('migrations failed with error: ' + error.message);
        // If the error was not due to a locking issue, then
        // remove the lock.
        cleanupReady = _this7._freeLock();
      }

      return cleanupReady['finally'](function () {
        throw error;
      });
    });
  };

  // Validates some migrations by requiring and checking for an `up` and `down` function.

  Migrator.prototype._validateMigrationStructure = function _validateMigrationStructure(name) {
    var migration = require(path.join(this._absoluteConfigDir(), name));
    if (typeof migration.up !== 'function' || typeof migration.down !== 'function') {
      throw new Error('Invalid migration: ' + name + ' must have both an up and down function');
    }
    return name;
  };

  // Lists all migrations that have been completed for the current db, as an array.

  Migrator.prototype._listCompleted = function _listCompleted() {
    var _this8 = this;

    var tableName = this.config.tableName;
    return this._ensureTable(tableName).then(function () {
      return _this8.knex(tableName).orderBy('id').select('name');
    }).then(function (migrations) {
      return _.pluck(migrations, 'name');
    });
  };

  // Gets the migration list from the specified migration directory,
  // as well as the list of completed migrations to check what
  // should be run.

  Migrator.prototype._migrationData = function _migrationData() {
    return Promise.all([this._listAll(), this._listCompleted()]);
  };

  // Generates the stub template for the current migration, returning a compiled template.

  Migrator.prototype._generateStubTemplate = function _generateStubTemplate() {
    var stubPath = this.config.stub || path.join(__dirname, 'stub', this.config.extension + '.stub');
    return Promise.promisify(fs.readFile, fs)(stubPath).then(function (stub) {
      return _.template(stub.toString(), null, { variable: 'd' });
    });
  };

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.

  Migrator.prototype._writeNewMigration = function _writeNewMigration(name, tmpl) {
    var config = this.config;
    var dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    var filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return Promise.promisify(fs.writeFile, fs)(path.join(dir, filename), tmpl(config.variables || {}))['return'](path.join(dir, filename));
  };

  // Get the last batch of migrations, by name, ordered by insert id
  // in reverse order.

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

  // If transaction conf for a single migration is defined, use that.
  // Otherwise, rely on the common config. This allows enabling/disabling
  // transaction for a single migration by will, regardless of the common
  // config.

  Migrator.prototype._useTransaction = function _useTransaction(migration, allTransactionsDisabled) {
    var singleTransactionValue = _.get(migration, 'config.transaction');

    return _.isBoolean(singleTransactionValue) ? singleTransactionValue : !allTransactionsDisabled;
  };

  // Runs a batch of `migrations` in a specified `direction`,
  // saving the appropriate database information as the migrations are run.

  Migrator.prototype._waterfallBatch = function _waterfallBatch(batchNo, migrations, direction) {
    var _this9 = this;

    var knex = this.knex;
    var _config = this.config;
    var tableName = _config.tableName;
    var disableTransactions = _config.disableTransactions;

    var directory = this._absoluteConfigDir();
    var current = Promise.bind({ failed: false, failedOn: 0 });
    var log = [];
    _.each(migrations, function (migration) {
      var name = migration;
      migration = require(directory + '/' + name);

      // We're going to run each of the migrations in the current "up"
      current = current.then(function () {
        if (_this9._useTransaction(migration, disableTransactions)) {
          return _this9._transaction(migration, direction, name);
        }
        return warnPromise(migration[direction](knex, Promise), name);
      }).then(function () {
        log.push(path.join(directory, name));
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
      return warnPromise(migration[direction](trx, Promise), name, function () {
        trx.commit();
      });
    });
  };

  Migrator.prototype._absoluteConfigDir = function _absoluteConfigDir() {
    return path.resolve(process.cwd(), this.config.directory);
  };

  Migrator.prototype.setConfig = function setConfig(config) {
    return assign({
      extension: 'js',
      tableName: 'knex_migrations',
      directory: './migrations'
    }, this.config || {}, config);
  };

  return Migrator;
})();

exports['default'] = Migrator;
function validateMigrationList(migrations) {
  var all = migrations[0];
  var completed = migrations[1];
  var diff = _.difference(completed, all);
  if (!_.isEmpty(diff)) {
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

// Ensure that we have 2 places for each of the date segments
function padDate(segment) {
  segment = segment.toString();
  return segment[1] ? segment : '0' + segment;
}

// Get a date object in the correct format, without requiring
// a full out library like "moment.js".
function yyyymmddhhmmss() {
  var d = new Date();
  return d.getFullYear().toString() + padDate(d.getMonth() + 1) + padDate(d.getDate()) + padDate(d.getHours()) + padDate(d.getMinutes()) + padDate(d.getSeconds());
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9taWdyYXRlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsWUFBWSxDQUFDOzs7Ozs7QUFFYixJQUFJLEVBQUUsR0FBUyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0IsSUFBSSxJQUFJLEdBQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLElBQUksQ0FBQyxHQUFVLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxJQUFJLE1BQU0sR0FBSyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsSUFBSSxPQUFPLEdBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3JDLElBQUksT0FBTyxHQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNyQyxJQUFJLE1BQU0sR0FBSyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUMvQyxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRW5DLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTtBQUN0QixNQUFJLENBQUMsSUFBSSxHQUFHLGlCQUFpQixDQUFDO0FBQzlCLE1BQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO0NBQ3BCO0FBQ0QsUUFBUSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQzs7Ozs7O0lBS04sUUFBUTtBQUVoQixXQUZRLFFBQVEsQ0FFZixJQUFJLEVBQUU7MEJBRkMsUUFBUTs7QUFHekIsUUFBSSxDQUFDLElBQUksR0FBSyxJQUFJLENBQUE7QUFDbEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0dBQzdEOzs7Ozs7QUFMa0IsVUFBUSxXQVEzQixNQUFNLEdBQUEsZ0JBQUMsTUFBTSxFQUFFOzs7QUFDYixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFT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OlsiLy8gTWlncmF0b3Jcbi8vIC0tLS0tLS1cblwidXNlIHN0cmljdFwiO1xuXG52YXIgZnMgICAgICAgPSByZXF1aXJlKCdmcycpO1xudmFyIHBhdGggICAgID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIF8gICAgICAgID0gcmVxdWlyZSgnbG9kYXNoJyk7XG52YXIgbWtkaXJwICAgPSByZXF1aXJlKCdta2RpcnAnKTtcbnZhciBQcm9taXNlICA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKTtcbnZhciBoZWxwZXJzICA9IHJlcXVpcmUoJy4uL2hlbHBlcnMnKTtcbnZhciBhc3NpZ24gICA9IHJlcXVpcmUoJ2xvZGFzaC9vYmplY3QvYXNzaWduJyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5mdW5jdGlvbiBMb2NrRXJyb3IobXNnKSB7XG4gIHRoaXMubmFtZSA9ICdNaWdyYXRpb25Mb2NrZWQnO1xuICB0aGlzLm1lc3NhZ2UgPSBtc2c7XG59XG5pbmhlcml0cyhMb2NrRXJyb3IsIEVycm9yKTtcblxuLy8gVGhlIG5ldyBtaWdyYXRpb24gd2UncmUgcGVyZm9ybWluZywgdHlwaWNhbGx5IGNhbGxlZCBmcm9tIHRoZSBga25leC5taWdyYXRlYFxuLy8gaW50ZXJmYWNlIG9uIHRoZSBtYWluIGBrbmV4YCBvYmplY3QuIFBhc3NlcyB0aGUgYGtuZXhgIGluc3RhbmNlIHBlcmZvcm1pbmdcbi8vIHRoZSBtaWdyYXRpb24uXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNaWdyYXRvciB7XG5cbiAgY29uc3RydWN0b3Ioa25leCkge1xuICAgIHRoaXMua25leCAgID0ga25leFxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoa25leC5jbGllbnQuY29uZmlnLm1pZ3JhdGlvbnMpO1xuICB9XG5cbiAgLy8gTWlncmF0b3JzIHRvIHRoZSBsYXRlc3QgY29uZmlndXJhdGlvbi5cbiAgbGF0ZXN0KGNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5fbWlncmF0aW9uRGF0YSgpXG4gICAgICAudGFwKHZhbGlkYXRlTWlncmF0aW9uTGlzdClcbiAgICAgIC5zcHJlYWQoKGFsbCwgY29tcGxldGVkKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ydW5CYXRjaChfLmRpZmZlcmVuY2UoYWxsLCBjb21wbGV0ZWQpLCAndXAnKTtcbiAgICAgIH0pXG4gIH1cblxuICAvLyBSb2xsYmFjayB0aGUgbGFzdCBcImJhdGNoXCIgb2YgbWlncmF0aW9ucyB0aGF0IHdlcmUgcnVuLlxuICByb2xsYmFjayhjb25maWcpIHtcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoKCkgPT4ge1xuICAgICAgdGhpcy5jb25maWcgPSB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICAgICAgcmV0dXJuIHRoaXMuX21pZ3JhdGlvbkRhdGEoKVxuICAgICAgICAudGFwKHZhbGlkYXRlTWlncmF0aW9uTGlzdClcbiAgICAgICAgLnRoZW4oKHZhbCkgPT4gdGhpcy5fZ2V0TGFzdEJhdGNoKHZhbCkpXG4gICAgICAgIC50aGVuKChtaWdyYXRpb25zKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX3J1bkJhdGNoKF8ucGx1Y2sobWlncmF0aW9ucywgJ25hbWUnKSwgJ2Rvd24nKTtcbiAgICAgICAgfSk7XG4gICAgfSlcbiAgfVxuXG4gIHN0YXR1cyhjb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMuc2V0Q29uZmlnKGNvbmZpZyk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5rbmV4KHRoaXMuY29uZmlnLnRhYmxlTmFtZSkuc2VsZWN0KCcqJyksXG4gICAgICB0aGlzLl9saXN0QWxsKClcbiAgICBdKVxuICAgIC5zcHJlYWQoZnVuY3Rpb24oZGIsIGNvZGUpIHtcbiAgICAgIHJldHVybiBkYi5sZW5ndGggLSBjb2RlLmxlbmd0aDtcbiAgICB9KTtcblxuICB9XG5cbiAgLy8gUmV0cmlldmVzIGFuZCByZXR1cm5zIHRoZSBjdXJyZW50IG1pZ3JhdGlvbiB2ZXJzaW9uXG4gIC8vIHdlJ3JlIG9uLCBhcyBhIHByb21pc2UuIElmIHRoZXJlIGFyZW4ndCBhbnkgbWlncmF0aW9ucyBydW4geWV0LFxuICAvLyByZXR1cm4gXCJub25lXCIgYXMgdGhlIHZhbHVlIGZvciB0aGUgYGN1cnJlbnRWZXJzaW9uYC5cbiAgY3VycmVudFZlcnNpb24oY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLl9saXN0Q29tcGxldGVkKGNvbmZpZylcbiAgICAgIC50aGVuKChjb21wbGV0ZWQpID0+IHtcbiAgICAgICAgdmFyIHZhbCA9IF8uY2hhaW4oY29tcGxldGVkKS5tYXAoZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWUuc3BsaXQoJ18nKVswXTtcbiAgICAgICAgfSkubWF4KCkudmFsdWUoKTtcbiAgICAgICAgcmV0dXJuICh2YWwgPT09IC1JbmZpbml0eSA/ICdub25lJyA6IHZhbCk7XG4gICAgICB9KVxuICB9XG5cbiAgZm9yY2VGcmVlTWlncmF0aW9uc0xvY2soY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICAgIHZhciBsb2NrVGFibGUgPSB0aGlzLl9nZXRMb2NrVGFibGVOYW1lKCk7XG4gICAgcmV0dXJuIHRoaXMua25leC5zY2hlbWEuaGFzVGFibGUobG9ja1RhYmxlKVxuICAgICAgICAudGhlbihleGlzdCA9PiBleGlzdCAmJiB0aGlzLl9mcmVlTG9jaygpKTtcbiAgfVxuXG4gIC8vIENyZWF0ZXMgYSBuZXcgbWlncmF0aW9uLCB3aXRoIGEgZ2l2ZW4gbmFtZS5cbiAgbWFrZShuYW1lLCBjb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMuc2V0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKCFuYW1lKSBQcm9taXNlLnJlamVjdGVkKG5ldyBFcnJvcignQSBuYW1lIG11c3QgYmUgc3BlY2lmaWVkIGZvciB0aGUgZ2VuZXJhdGVkIG1pZ3JhdGlvbicpKTtcbiAgICByZXR1cm4gdGhpcy5fZW5zdXJlRm9sZGVyKGNvbmZpZylcbiAgICAgIC50aGVuKCh2YWwpID0+IHRoaXMuX2dlbmVyYXRlU3R1YlRlbXBsYXRlKHZhbCkpXG4gICAgICAudGhlbigodmFsKSA9PiB0aGlzLl93cml0ZU5ld01pZ3JhdGlvbihuYW1lLCB2YWwpKTtcbiAgfVxuXG4gIC8vIExpc3RzIGFsbCBhdmFpbGFibGUgbWlncmF0aW9uIHZlcnNpb25zLCBhcyBhIHNvcnRlZCBhcnJheS5cbiAgX2xpc3RBbGwoY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiBQcm9taXNlLnByb21pc2lmeShmcy5yZWFkZGlyLCBmcykodGhpcy5fYWJzb2x1dGVDb25maWdEaXIoKSlcbiAgICAgIC50aGVuKChtaWdyYXRpb25zKSA9PiB7XG4gICAgICAgIHJldHVybiBfLmZpbHRlcihtaWdyYXRpb25zLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIHZhciBleHRlbnNpb24gPSBwYXRoLmV4dG5hbWUodmFsdWUpO1xuICAgICAgICAgIHJldHVybiBfLmNvbnRhaW5zKFsnLmNvJywgJy5jb2ZmZWUnLCAnLmVnJywgJy5pY2VkJywgJy5qcycsICcubGl0Y29mZmVlJywgJy5scyddLCBleHRlbnNpb24pO1xuICAgICAgICB9KS5zb3J0KCk7XG4gICAgICB9KVxuICB9XG5cbiAgLy8gRW5zdXJlcyBhIGZvbGRlciBmb3IgdGhlIG1pZ3JhdGlvbnMgZXhpc3QsIGRlcGVuZGVudCBvbiB0aGVcbiAgLy8gbWlncmF0aW9uIGNvbmZpZyBzZXR0aW5ncy5cbiAgX2Vuc3VyZUZvbGRlcigpIHtcbiAgICB2YXIgZGlyID0gdGhpcy5fYWJzb2x1dGVDb25maWdEaXIoKTtcbiAgICByZXR1cm4gUHJvbWlzZS5wcm9taXNpZnkoZnMuc3RhdCwgZnMpKGRpcilcbiAgICAgIC5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucHJvbWlzaWZ5KG1rZGlycCkoZGlyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLy8gRW5zdXJlcyB0aGF0IHRoZSBwcm9wZXIgdGFibGUgaGFzIGJlZW4gY3JlYXRlZCxcbiAgLy8gZGVwZW5kZW50IG9uIHRoZSBtaWdyYXRpb24gY29uZmlnIHNldHRpbmdzLlxuICBfZW5zdXJlVGFibGUoKSB7XG4gICAgdmFyIHRhYmxlID0gdGhpcy5jb25maWcudGFibGVOYW1lO1xuICAgIHZhciBsb2NrVGFibGUgPSB0aGlzLl9nZXRMb2NrVGFibGVOYW1lKCk7XG4gICAgcmV0dXJuIHRoaXMua25leC5zY2hlbWEuaGFzVGFibGUodGFibGUpXG4gICAgICAudGhlbihleGlzdHMgPT4gIWV4aXN0cyAmJiB0aGlzLl9jcmVhdGVNaWdyYXRpb25UYWJsZSh0YWJsZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmtuZXguc2NoZW1hLmhhc1RhYmxlKGxvY2tUYWJsZSkpXG4gICAgICAudGhlbihleGlzdHMgPT4gIWV4aXN0cyAmJiB0aGlzLl9jcmVhdGVNaWdyYXRpb25Mb2NrVGFibGUobG9ja1RhYmxlKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMua25leChsb2NrVGFibGUpLnNlbGVjdCgnKicpKVxuICAgICAgLnRoZW4oZGF0YSA9PiAhZGF0YS5sZW5ndGggJiYgdGhpcy5rbmV4KGxvY2tUYWJsZSkuaW5zZXJ0KHsgaXNfbG9ja2VkOiAwIH0pKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgbWlncmF0aW9uIHRhYmxlLCBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gIF9jcmVhdGVNaWdyYXRpb25UYWJsZSh0YWJsZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5rbmV4LnNjaGVtYS5jcmVhdGVUYWJsZSh0YWJsZU5hbWUsIGZ1bmN0aW9uKHQpIHtcbiAgICAgIHQuaW5jcmVtZW50cygpO1xuICAgICAgdC5zdHJpbmcoJ25hbWUnKTtcbiAgICAgIHQuaW50ZWdlcignYmF0Y2gnKTtcbiAgICAgIHQudGltZXN0YW1wKCdtaWdyYXRpb25fdGltZScpO1xuICAgIH0pO1xuICB9XG5cbiAgX2NyZWF0ZU1pZ3JhdGlvbkxvY2tUYWJsZSh0YWJsZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5rbmV4LnNjaGVtYS5jcmVhdGVUYWJsZSh0YWJsZU5hbWUsIGZ1bmN0aW9uKHQpIHtcbiAgICAgIHQuaW50ZWdlcignaXNfbG9ja2VkJyk7XG4gICAgfSk7XG4gIH1cblxuICBfZ2V0TG9ja1RhYmxlTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcudGFibGVOYW1lICsgJ19sb2NrJztcbiAgfVxuXG4gIF9pc0xvY2tlZCh0cngpIHtcbiAgICB2YXIgdGFibGVOYW1lID0gdGhpcy5fZ2V0TG9ja1RhYmxlTmFtZSgpO1xuICAgIHJldHVybiB0aGlzLmtuZXgodGFibGVOYW1lKVxuICAgICAgLnRyYW5zYWN0aW5nKHRyeClcbiAgICAgIC5mb3JVcGRhdGUoKVxuICAgICAgLnNlbGVjdCgnKicpXG4gICAgICAudGhlbihkYXRhID0+IGRhdGFbMF0uaXNfbG9ja2VkKTtcbiAgfVxuXG4gIF9sb2NrTWlncmF0aW9ucyh0cngpIHtcbiAgICB2YXIgdGFibGVOYW1lID0gdGhpcy5fZ2V0TG9ja1RhYmxlTmFtZSgpO1xuICAgIHJldHVybiB0aGlzLmtuZXgodGFibGVOYW1lKVxuICAgICAgLnRyYW5zYWN0aW5nKHRyeClcbiAgICAgIC51cGRhdGUoeyBpc19sb2NrZWQ6IDEgfSk7XG4gIH1cblxuICBfZ2V0TG9jaygpIHtcbiAgICByZXR1cm4gdGhpcy5rbmV4LnRyYW5zYWN0aW9uKHRyeCA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5faXNMb2NrZWQodHJ4KVxuICAgICAgICAudGhlbihpc0xvY2tlZCA9PiB7XG4gICAgICAgICAgaWYgKGlzTG9ja2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaWdyYXRpb24gdGFibGUgaXMgYWxyZWFkeSBsb2NrZWRcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB0aGlzLl9sb2NrTWlncmF0aW9ucyh0cngpKTtcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgdGhyb3cgbmV3IExvY2tFcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfSk7XG4gIH1cblxuICBfZnJlZUxvY2soKSB7XG4gICAgdmFyIHRhYmxlTmFtZSA9IHRoaXMuX2dldExvY2tUYWJsZU5hbWUoKTtcbiAgICByZXR1cm4gdGhpcy5rbmV4KHRhYmxlTmFtZSlcbiAgICAgIC51cGRhdGUoeyBpc19sb2NrZWQ6IDAgfSk7XG4gIH1cblxuICAvLyBSdW4gYSBiYXRjaCBvZiBjdXJyZW50IG1pZ3JhdGlvbnMsIGluIHNlcXVlbmNlLlxuICBfcnVuQmF0Y2gobWlncmF0aW9ucywgZGlyZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldExvY2soKVxuICAgIC50aGVuKCgpID0+IFByb21pc2UuYWxsKF8ubWFwKG1pZ3JhdGlvbnMsIHRoaXMuX3ZhbGlkYXRlTWlncmF0aW9uU3RydWN0dXJlLCB0aGlzKSkpXG4gICAgLnRoZW4oKCkgPT4gdGhpcy5fbGF0ZXN0QmF0Y2hOdW1iZXIoKSlcbiAgICAudGhlbihiYXRjaE5vID0+IHtcbiAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd1cCcpIGJhdGNoTm8rKztcbiAgICAgIHJldHVybiBiYXRjaE5vO1xuICAgIH0pXG4gICAgLnRoZW4oYmF0Y2hObyA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5fd2F0ZXJmYWxsQmF0Y2goYmF0Y2hObywgbWlncmF0aW9ucywgZGlyZWN0aW9uKVxuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4gdGhpcy5fZnJlZUxvY2soKSlcbiAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgdmFyIGNsZWFudXBSZWFkeSA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBMb2NrRXJyb3IpIHtcbiAgICAgICAgLy8gaWYgbG9ja2luZyBlcnJvciBkbyBub3QgZnJlZSB0aGUgbG9ja1xuICAgICAgICBoZWxwZXJzLndhcm4oJ0NhbnQgdGFrZSBsb2NrIHRvIHJ1biBtaWdyYXRpb25zOiAnICsgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIGhlbHBlcnMud2FybihcbiAgICAgICAgICAnSWYgeW91IGFyZSBzdWUgbWlncmF0aW9ucyBhcmUgbm90IHJ1bm5pbmcgeW91IGNhbiByZWxlYXNlICcgK1xuICAgICAgICAgICdsb2NrIG1hbnVhbGx5IGJ5IGRlbGV0aW5nIGFsbCB0aGUgcm93cyBmcm9tIG1pZ3JhdGlvbnMgbG9jayB0YWJsZTogJyArXG4gICAgICAgICAgdGhpcy5fZ2V0TG9ja1RhYmxlTmFtZSgpXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoZWxwZXJzLndhcm4oJ21pZ3JhdGlvbnMgZmFpbGVkIHdpdGggZXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlKVxuICAgICAgICAvLyBJZiB0aGUgZXJyb3Igd2FzIG5vdCBkdWUgdG8gYSBsb2NraW5nIGlzc3VlLCB0aGVuXG4gICAgICAgIC8vIHJlbW92ZSB0aGUgbG9jay5cbiAgICAgICAgY2xlYW51cFJlYWR5ID0gdGhpcy5fZnJlZUxvY2soKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNsZWFudXBSZWFkeS5maW5hbGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4gIC8vIFZhbGlkYXRlcyBzb21lIG1pZ3JhdGlvbnMgYnkgcmVxdWlyaW5nIGFuZCBjaGVja2luZyBmb3IgYW4gYHVwYCBhbmQgYGRvd25gIGZ1bmN0aW9uLlxuICBfdmFsaWRhdGVNaWdyYXRpb25TdHJ1Y3R1cmUobmFtZSkge1xuICAgIHZhciBtaWdyYXRpb24gPSByZXF1aXJlKHBhdGguam9pbih0aGlzLl9hYnNvbHV0ZUNvbmZpZ0RpcigpLCBuYW1lKSk7XG4gICAgaWYgKHR5cGVvZiBtaWdyYXRpb24udXAgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIG1pZ3JhdGlvbi5kb3duICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbWlncmF0aW9uOiAnICsgbmFtZSArICcgbXVzdCBoYXZlIGJvdGggYW4gdXAgYW5kIGRvd24gZnVuY3Rpb24nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICAvLyBMaXN0cyBhbGwgbWlncmF0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb21wbGV0ZWQgZm9yIHRoZSBjdXJyZW50IGRiLCBhcyBhbiBhcnJheS5cbiAgX2xpc3RDb21wbGV0ZWQoKSB7XG4gICAgdmFyIHRhYmxlTmFtZSA9IHRoaXMuY29uZmlnLnRhYmxlTmFtZVxuICAgIHJldHVybiB0aGlzLl9lbnN1cmVUYWJsZSh0YWJsZU5hbWUpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmtuZXgodGFibGVOYW1lKS5vcmRlckJ5KCdpZCcpLnNlbGVjdCgnbmFtZScpKVxuICAgICAgLnRoZW4oKG1pZ3JhdGlvbnMpID0+IF8ucGx1Y2sobWlncmF0aW9ucywgJ25hbWUnKSlcbiAgfVxuXG4gIC8vIEdldHMgdGhlIG1pZ3JhdGlvbiBsaXN0IGZyb20gdGhlIHNwZWNpZmllZCBtaWdyYXRpb24gZGlyZWN0b3J5LFxuICAvLyBhcyB3ZWxsIGFzIHRoZSBsaXN0IG9mIGNvbXBsZXRlZCBtaWdyYXRpb25zIHRvIGNoZWNrIHdoYXRcbiAgLy8gc2hvdWxkIGJlIHJ1bi5cbiAgX21pZ3JhdGlvbkRhdGEoKSB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuX2xpc3RBbGwoKSxcbiAgICAgIHRoaXMuX2xpc3RDb21wbGV0ZWQoKVxuICAgIF0pO1xuICB9XG5cbiAgLy8gR2VuZXJhdGVzIHRoZSBzdHViIHRlbXBsYXRlIGZvciB0aGUgY3VycmVudCBtaWdyYXRpb24sIHJldHVybmluZyBhIGNvbXBpbGVkIHRlbXBsYXRlLlxuICBfZ2VuZXJhdGVTdHViVGVtcGxhdGUoKSB7XG4gICAgdmFyIHN0dWJQYXRoID0gdGhpcy5jb25maWcuc3R1YiB8fCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc3R1YicsIHRoaXMuY29uZmlnLmV4dGVuc2lvbiArICcuc3R1YicpO1xuICAgIHJldHVybiBQcm9taXNlLnByb21pc2lmeShmcy5yZWFkRmlsZSwgZnMpKHN0dWJQYXRoKS50aGVuKGZ1bmN0aW9uKHN0dWIpIHtcbiAgICAgIHJldHVybiBfLnRlbXBsYXRlKHN0dWIudG9TdHJpbmcoKSwgbnVsbCwge3ZhcmlhYmxlOiAnZCd9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFdyaXRlIGEgbmV3IG1pZ3JhdGlvbiB0byBkaXNrLCB1c2luZyB0aGUgY29uZmlnIGFuZCBnZW5lcmF0ZWQgZmlsZW5hbWUsXG4gIC8vIHBhc3NpbmcgYW55IGB2YXJpYWJsZXNgIGdpdmVuIGluIHRoZSBjb25maWcgdG8gdGhlIHRlbXBsYXRlLlxuICBfd3JpdGVOZXdNaWdyYXRpb24obmFtZSwgdG1wbCkge1xuICAgIHZhciBjb25maWcgPSB0aGlzLmNvbmZpZztcbiAgICB2YXIgZGlyID0gdGhpcy5fYWJzb2x1dGVDb25maWdEaXIoKTtcbiAgICBpZiAobmFtZVswXSA9PT0gJy0nKSBuYW1lID0gbmFtZS5zbGljZSgxKTtcbiAgICB2YXIgZmlsZW5hbWUgID0geXl5eW1tZGRoaG1tc3MoKSArICdfJyArIG5hbWUgKyAnLicgKyBjb25maWcuZXh0ZW5zaW9uO1xuICAgIHJldHVybiBQcm9taXNlLnByb21pc2lmeShmcy53cml0ZUZpbGUsIGZzKShcbiAgICAgIHBhdGguam9pbihkaXIsIGZpbGVuYW1lKSxcbiAgICAgIHRtcGwoY29uZmlnLnZhcmlhYmxlcyB8fCB7fSlcbiAgICApLnJldHVybihwYXRoLmpvaW4oZGlyLCBmaWxlbmFtZSkpO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBsYXN0IGJhdGNoIG9mIG1pZ3JhdGlvbnMsIGJ5IG5hbWUsIG9yZGVyZWQgYnkgaW5zZXJ0IGlkXG4gIC8vIGluIHJldmVyc2Ugb3JkZXIuXG4gIF9nZXRMYXN0QmF0Y2goKSB7XG4gICAgdmFyIHRhYmxlTmFtZSA9IHRoaXMuY29uZmlnLnRhYmxlTmFtZTtcbiAgICByZXR1cm4gdGhpcy5rbmV4KHRhYmxlTmFtZSlcbiAgICAgIC53aGVyZSgnYmF0Y2gnLCBmdW5jdGlvbihxYikge1xuICAgICAgICBxYi5tYXgoJ2JhdGNoJykuZnJvbSh0YWJsZU5hbWUpXG4gICAgICB9KVxuICAgICAgLm9yZGVyQnkoJ2lkJywgJ2Rlc2MnKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGxhdGVzdCBiYXRjaCBudW1iZXIuXG4gIF9sYXRlc3RCYXRjaE51bWJlcigpIHtcbiAgICByZXR1cm4gdGhpcy5rbmV4KHRoaXMuY29uZmlnLnRhYmxlTmFtZSlcbiAgICAgIC5tYXgoJ2JhdGNoIGFzIG1heF9iYXRjaCcpLnRoZW4oZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiAob2JqWzBdLm1heF9iYXRjaCB8fCAwKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLy8gSWYgdHJhbnNhY3Rpb24gY29uZiBmb3IgYSBzaW5nbGUgbWlncmF0aW9uIGlzIGRlZmluZWQsIHVzZSB0aGF0LlxuICAvLyBPdGhlcndpc2UsIHJlbHkgb24gdGhlIGNvbW1vbiBjb25maWcuIFRoaXMgYWxsb3dzIGVuYWJsaW5nL2Rpc2FibGluZ1xuICAvLyB0cmFuc2FjdGlvbiBmb3IgYSBzaW5nbGUgbWlncmF0aW9uIGJ5IHdpbGwsIHJlZ2FyZGxlc3Mgb2YgdGhlIGNvbW1vblxuICAvLyBjb25maWcuXG4gIF91c2VUcmFuc2FjdGlvbihtaWdyYXRpb24sIGFsbFRyYW5zYWN0aW9uc0Rpc2FibGVkKSB7XG4gICAgdmFyIHNpbmdsZVRyYW5zYWN0aW9uVmFsdWUgPSBfLmdldChtaWdyYXRpb24sICdjb25maWcudHJhbnNhY3Rpb24nKTtcblxuICAgIHJldHVybiBfLmlzQm9vbGVhbihzaW5nbGVUcmFuc2FjdGlvblZhbHVlKSA/XG4gICAgICBzaW5nbGVUcmFuc2FjdGlvblZhbHVlIDpcbiAgICAgICFhbGxUcmFuc2FjdGlvbnNEaXNhYmxlZDtcbiAgfVxuXG4gIC8vIFJ1bnMgYSBiYXRjaCBvZiBgbWlncmF0aW9uc2AgaW4gYSBzcGVjaWZpZWQgYGRpcmVjdGlvbmAsXG4gIC8vIHNhdmluZyB0aGUgYXBwcm9wcmlhdGUgZGF0YWJhc2UgaW5mb3JtYXRpb24gYXMgdGhlIG1pZ3JhdGlvbnMgYXJlIHJ1bi5cbiAgX3dhdGVyZmFsbEJhdGNoKGJhdGNoTm8sIG1pZ3JhdGlvbnMsIGRpcmVjdGlvbikge1xuICAgIHZhciBrbmV4ID0gdGhpcy5rbmV4O1xuICAgIHZhciB7dGFibGVOYW1lLCBkaXNhYmxlVHJhbnNhY3Rpb25zfSA9IHRoaXMuY29uZmlnXG4gICAgdmFyIGRpcmVjdG9yeSA9IHRoaXMuX2Fic29sdXRlQ29uZmlnRGlyKClcbiAgICB2YXIgY3VycmVudCAgID0gUHJvbWlzZS5iaW5kKHtmYWlsZWQ6IGZhbHNlLCBmYWlsZWRPbjogMH0pO1xuICAgIHZhciBsb2cgICAgICAgPSBbXTtcbiAgICBfLmVhY2gobWlncmF0aW9ucywgKG1pZ3JhdGlvbikgPT4ge1xuICAgICAgdmFyIG5hbWUgID0gbWlncmF0aW9uO1xuICAgICAgbWlncmF0aW9uID0gcmVxdWlyZShkaXJlY3RvcnkgKyAnLycgKyBuYW1lKTtcblxuICAgICAgLy8gV2UncmUgZ29pbmcgdG8gcnVuIGVhY2ggb2YgdGhlIG1pZ3JhdGlvbnMgaW4gdGhlIGN1cnJlbnQgXCJ1cFwiXG4gICAgICBjdXJyZW50ID0gY3VycmVudC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX3VzZVRyYW5zYWN0aW9uKG1pZ3JhdGlvbiwgZGlzYWJsZVRyYW5zYWN0aW9ucykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnNhY3Rpb24obWlncmF0aW9uLCBkaXJlY3Rpb24sIG5hbWUpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdhcm5Qcm9taXNlKG1pZ3JhdGlvbltkaXJlY3Rpb25dKGtuZXgsIFByb21pc2UpLCBuYW1lKVxuICAgICAgfSlcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgbG9nLnB1c2gocGF0aC5qb2luKGRpcmVjdG9yeSwgbmFtZSkpO1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAndXAnKSB7XG4gICAgICAgICAgcmV0dXJuIGtuZXgodGFibGVOYW1lKS5pbnNlcnQoe1xuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGJhdGNoOiBiYXRjaE5vLFxuICAgICAgICAgICAgbWlncmF0aW9uX3RpbWU6IG5ldyBEYXRlKClcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcbiAgICAgICAgICByZXR1cm4ga25leCh0YWJsZU5hbWUpLndoZXJlKHtuYW1lOiBuYW1lfSkuZGVsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pXG5cbiAgICByZXR1cm4gY3VycmVudC50aGVuUmV0dXJuKFtiYXRjaE5vLCBsb2ddKTtcbiAgfVxuXG4gIF90cmFuc2FjdGlvbihtaWdyYXRpb24sIGRpcmVjdGlvbiwgbmFtZSkge1xuICAgIHJldHVybiB0aGlzLmtuZXgudHJhbnNhY3Rpb24oKHRyeCkgPT4ge1xuICAgICAgcmV0dXJuIHdhcm5Qcm9taXNlKG1pZ3JhdGlvbltkaXJlY3Rpb25dKHRyeCwgUHJvbWlzZSksIG5hbWUsICgpID0+IHtcbiAgICAgICAgdHJ4LmNvbW1pdCgpXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICBfYWJzb2x1dGVDb25maWdEaXIoKSB7XG4gICAgcmV0dXJuIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCB0aGlzLmNvbmZpZy5kaXJlY3RvcnkpO1xuICB9XG5cbiAgc2V0Q29uZmlnKGNvbmZpZykge1xuICAgIHJldHVybiBhc3NpZ24oe1xuICAgICAgZXh0ZW5zaW9uOiAnanMnLFxuICAgICAgdGFibGVOYW1lOiAna25leF9taWdyYXRpb25zJyxcbiAgICAgIGRpcmVjdG9yeTogJy4vbWlncmF0aW9ucydcbiAgICB9LCB0aGlzLmNvbmZpZyB8fCB7fSwgY29uZmlnKTtcbiAgfVxuXG59XG5cbi8vIFZhbGlkYXRlcyB0aGF0IG1pZ3JhdGlvbnMgYXJlIHByZXNlbnQgaW4gdGhlIGFwcHJvcHJpYXRlIGRpcmVjdG9yaWVzLlxuZnVuY3Rpb24gdmFsaWRhdGVNaWdyYXRpb25MaXN0KG1pZ3JhdGlvbnMpIHtcbiAgdmFyIGFsbCA9IG1pZ3JhdGlvbnNbMF07XG4gIHZhciBjb21wbGV0ZWQgPSBtaWdyYXRpb25zWzFdO1xuICB2YXIgZGlmZiA9IF8uZGlmZmVyZW5jZShjb21wbGV0ZWQsIGFsbCk7XG4gIGlmICghXy5pc0VtcHR5KGRpZmYpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ1RoZSBtaWdyYXRpb24gZGlyZWN0b3J5IGlzIGNvcnJ1cHQsIHRoZSBmb2xsb3dpbmcgZmlsZXMgYXJlIG1pc3Npbmc6ICcgKyBkaWZmLmpvaW4oJywgJylcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdhcm5Qcm9taXNlKHZhbHVlLCBuYW1lLCBmbikge1xuICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZS50aGVuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgaGVscGVycy53YXJuKGBtaWdyYXRpb24gJHtuYW1lfSBkaWQgbm90IHJldHVybiBhIHByb21pc2VgKTtcbiAgICBpZiAoZm4gJiYgdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSBmbigpXG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vLyBFbnN1cmUgdGhhdCB3ZSBoYXZlIDIgcGxhY2VzIGZvciBlYWNoIG9mIHRoZSBkYXRlIHNlZ21lbnRzXG5mdW5jdGlvbiBwYWREYXRlKHNlZ21lbnQpIHtcbiAgc2VnbWVudCA9IHNlZ21lbnQudG9TdHJpbmcoKTtcbiAgcmV0dXJuIHNlZ21lbnRbMV0gPyBzZWdtZW50IDogJzAnICsgc2VnbWVudDtcbn1cblxuLy8gR2V0IGEgZGF0ZSBvYmplY3QgaW4gdGhlIGNvcnJlY3QgZm9ybWF0LCB3aXRob3V0IHJlcXVpcmluZ1xuLy8gYSBmdWxsIG91dCBsaWJyYXJ5IGxpa2UgXCJtb21lbnQuanNcIi5cbmZ1bmN0aW9uIHl5eXltbWRkaGhtbXNzKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHJldHVybiBkLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKSArXG4gICAgICBwYWREYXRlKGQuZ2V0TW9udGgoKSArIDEpICtcbiAgICAgIHBhZERhdGUoZC5nZXREYXRlKCkpICtcbiAgICAgIHBhZERhdGUoZC5nZXRIb3VycygpKSArXG4gICAgICBwYWREYXRlKGQuZ2V0TWludXRlcygpKSArXG4gICAgICBwYWREYXRlKGQuZ2V0U2Vjb25kcygpKTtcbn1cbiJdfQ==
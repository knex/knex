// Migrator
// -------
'use strict';

exports.__esModule = true;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _promise = require('../promise');

var _promise2 = _interopRequireDefault(_promise);

var _helpers = require('../helpers');

var helpers = _interopRequireWildcard(_helpers);

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

function LockError(msg) {
  this.name = 'MigrationLocked';
  this.message = msg;
}
_inherits2['default'](LockError, Error);

var SUPPORTED_EXTENSIONS = Object.freeze(['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls']);

var CONFIG_DEFAULT = Object.freeze({
  extension: 'js',
  tableName: 'knex_migrations',
  directory: './migrations',
  disableTransactions: false
});

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
      return _this._runBatch(_lodash.difference(all, completed), 'up');
    });
  };

  // Rollback the last "batch" of migrations that were run.

  Migrator.prototype.rollback = function rollback(config) {
    var _this2 = this;

    return _promise2['default']['try'](function () {
      _this2.config = _this2.setConfig(config);
      return _this2._migrationData().tap(validateMigrationList).then(function (val) {
        return _this2._getLastBatch(val);
      }).then(function (migrations) {
        return _this2._runBatch(_lodash.map(migrations, 'name'), 'down');
      });
    });
  };

  Migrator.prototype.status = function status(config) {
    this.config = this.setConfig(config);

    return _promise2['default'].all([this.knex(this.config.tableName).select('*'), this._listAll()]).spread(function (db, code) {
      return db.length - code.length;
    });
  };

  // Retrieves and returns the current migration version we're on, as a promise.
  // If no migrations have been run yet, return "none".

  Migrator.prototype.currentVersion = function currentVersion(config) {
    this.config = this.setConfig(config);
    return this._listCompleted(config).then(function (completed) {
      var val = _lodash.chain(completed).map(function (value) {
        return value.split('_')[0];
      }).max().value();
      return _lodash.isUndefined(val) ? 'none' : val;
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
    if (!name) _promise2['default'].rejected(new Error('A name must be specified for the generated migration'));
    return this._ensureFolder(config).then(function (val) {
      return _this4._generateStubTemplate(val);
    }).then(function (val) {
      return _this4._writeNewMigration(name, val);
    });
  };

  // Lists all available migration versions, as a sorted array.

  Migrator.prototype._listAll = function _listAll(config) {
    this.config = this.setConfig(config);
    return _promise2['default'].promisify(_fs2['default'].readdir, { context: _fs2['default'] })(this._absoluteConfigDir()).then(function (migrations) {
      return _lodash.filter(migrations, function (value) {
        var extension = _path2['default'].extname(value);
        return _lodash.includes(SUPPORTED_EXTENSIONS, extension);
      }).sort();
    });
  };

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.

  Migrator.prototype._ensureFolder = function _ensureFolder() {
    var dir = this._absoluteConfigDir();
    return _promise2['default'].promisify(_fs2['default'].stat, { context: _fs2['default'] })(dir)['catch'](function () {
      return _promise2['default'].promisify(_mkdirp2['default'])(dir);
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
      return _promise2['default'].all(_lodash.map(migrations, _lodash.bind(_this7._validateMigrationStructure, _this7)));
    }).then(function () {
      return _this7._latestBatchNumber();
    }).then(function (batchNo) {
      if (direction === 'up') batchNo++;
      return batchNo;
    }).then(function (batchNo) {
      return _this7._waterfallBatch(batchNo, migrations, direction);
    }).tap(function () {
      return _this7._freeLock();
    })['catch'](function (error) {
      var cleanupReady = _promise2['default'].resolve();

      if (error instanceof LockError) {
        // If locking error do not free the lock.
        helpers.warn('Can\'t take lock to run migrations: ' + error.message);
        helpers.warn('If you are sure migrations are not running you can release the ' + 'lock manually by deleting all the rows from migrations lock ' + 'table: ' + _this7._getLockTableName());
      } else {
        helpers.warn('migrations failed with error: ' + error.message);
        // If the error was not due to a locking issue, then remove the lock.
        cleanupReady = _this7._freeLock();
      }

      return cleanupReady['finally'](function () {
        throw error;
      });
    });
  };

  // Validates some migrations by requiring and checking for an `up` and `down`
  // function.

  Migrator.prototype._validateMigrationStructure = function _validateMigrationStructure(name) {
    var migration = require(_path2['default'].join(this._absoluteConfigDir(), name));
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
      return _lodash.map(migrations, 'name');
    });
  };

  // Gets the migration list from the specified migration directory, as well as
  // the list of completed migrations to check what should be run.

  Migrator.prototype._migrationData = function _migrationData() {
    return _promise2['default'].all([this._listAll(), this._listCompleted()]);
  };

  // Generates the stub template for the current migration, returning a compiled
  // template.

  Migrator.prototype._generateStubTemplate = function _generateStubTemplate() {
    var stubPath = this.config.stub || _path2['default'].join(__dirname, 'stub', this.config.extension + '.stub');
    return _promise2['default'].promisify(_fs2['default'].readFile, { context: _fs2['default'] })(stubPath).then(function (stub) {
      return _lodash.template(stub.toString(), { variable: 'd' });
    });
  };

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.

  Migrator.prototype._writeNewMigration = function _writeNewMigration(name, tmpl) {
    var config = this.config;

    var dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    var filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return _promise2['default'].promisify(_fs2['default'].writeFile, { context: _fs2['default'] })(_path2['default'].join(dir, filename), tmpl(config.variables || {}))['return'](_path2['default'].join(dir, filename));
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
    var singleTransactionValue = _lodash.get(migration, 'config.transaction');

    return _lodash.isBoolean(singleTransactionValue) ? singleTransactionValue : !allTransactionsDisabled;
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
    var current = _promise2['default'].bind({ failed: false, failedOn: 0 });
    var log = [];
    _lodash.each(migrations, function (migration) {
      var name = migration;
      migration = require(directory + '/' + name);

      // We're going to run each of the migrations in the current "up".
      current = current.then(function () {
        if (_this9._useTransaction(migration, disableTransactions)) {
          return _this9._transaction(migration, direction, name);
        }
        return warnPromise(migration[direction](knex, _promise2['default']), name);
      }).then(function () {
        log.push(_path2['default'].join(directory, name));
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
      return warnPromise(migration[direction](trx, _promise2['default']), name, function () {
        trx.commit();
      });
    });
  };

  Migrator.prototype._absoluteConfigDir = function _absoluteConfigDir() {
    return _path2['default'].resolve(process.cwd(), this.config.directory);
  };

  Migrator.prototype.setConfig = function setConfig(config) {
    return _lodash.assign({}, CONFIG_DEFAULT, this.config || {}, config);
  };

  return Migrator;
})();

exports['default'] = Migrator;
function validateMigrationList(migrations) {
  var all = migrations[0];
  var completed = migrations[1];
  var diff = _lodash.difference(completed, all);
  if (!_lodash.isEmpty(diff)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9taWdyYXRlL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztrQkFFZSxJQUFJOzs7O29CQUNGLE1BQU07Ozs7c0JBQ0osUUFBUTs7Ozt1QkFDUCxZQUFZOzs7O3VCQUNQLFlBQVk7O0lBQXpCLE9BQU87O3NCQUlaLFFBQVE7O3dCQUNNLFVBQVU7Ozs7QUFFL0IsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQ3RCLE1BQUksQ0FBQyxJQUFJLEdBQUcsaUJBQWlCLENBQUM7QUFDOUIsTUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7Q0FDcEI7QUFDRCxzQkFBUyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7O0FBRTNCLElBQU0sb0JBQW9CLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUN6QyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQzdELENBQUMsQ0FBQzs7QUFFSCxJQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ25DLFdBQVMsRUFBRSxJQUFJO0FBQ2YsV0FBUyxFQUFFLGlCQUFpQjtBQUM1QixXQUFTLEVBQUUsY0FBYztBQUN6QixxQkFBbUIsRUFBRSxLQUFLO0NBQzNCLENBQUMsQ0FBQzs7Ozs7O0lBS2tCLFFBQVE7QUFFaEIsV0FGUSxRQUFRLENBRWYsSUFBSSxFQUFFOzBCQUZDLFFBQVE7O0FBR3pCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0FBQ2hCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztHQUM3RDs7Ozs7O0FBTGtCLFVBQVEsV0FRM0IsTUFBTSxHQUFBLGdCQUFDLE1BQU0sRUFBRTs7O0FBQ2IsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxD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QUlELFNBQVMsY0FBYyxHQUFHO0FBQ3hCLE1BQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7QUFDckIsU0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQzdCLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQ3pCLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsR0FDcEIsT0FBTyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUNyQixPQUFPLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQ3ZCLE9BQU8sQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztDQUM3QiIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIE1pZ3JhdG9yXG4vLyAtLS0tLS0tXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbWtkaXJwIGZyb20gJ21rZGlycCc7XG5pbXBvcnQgUHJvbWlzZSBmcm9tICcuLi9wcm9taXNlJztcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi4vaGVscGVycyc7XG5pbXBvcnQge1xuICBhc3NpZ24sIGJpbmQsIGNoYWluLCBkaWZmZXJlbmNlLCBlYWNoLCBmaWx0ZXIsIGdldCwgaW5jbHVkZXMsIGlzQm9vbGVhbixcbiAgaXNFbXB0eSwgaXNVbmRlZmluZWQsIG1hcCwgdGVtcGxhdGVcbn0gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcblxuZnVuY3Rpb24gTG9ja0Vycm9yKG1zZykge1xuICB0aGlzLm5hbWUgPSAnTWlncmF0aW9uTG9ja2VkJztcbiAgdGhpcy5tZXNzYWdlID0gbXNnO1xufVxuaW5oZXJpdHMoTG9ja0Vycm9yLCBFcnJvcik7XG5cbmNvbnN0IFNVUFBPUlRFRF9FWFRFTlNJT05TID0gT2JqZWN0LmZyZWV6ZShbXG4gICcuY28nLCAnLmNvZmZlZScsICcuZWcnLCAnLmljZWQnLCAnLmpzJywgJy5saXRjb2ZmZWUnLCAnLmxzJ1xuXSk7XG5cbmNvbnN0IENPTkZJR19ERUZBVUxUID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGV4dGVuc2lvbjogJ2pzJyxcbiAgdGFibGVOYW1lOiAna25leF9taWdyYXRpb25zJyxcbiAgZGlyZWN0b3J5OiAnLi9taWdyYXRpb25zJyxcbiAgZGlzYWJsZVRyYW5zYWN0aW9uczogZmFsc2Vcbn0pO1xuXG4vLyBUaGUgbmV3IG1pZ3JhdGlvbiB3ZSdyZSBwZXJmb3JtaW5nLCB0eXBpY2FsbHkgY2FsbGVkIGZyb20gdGhlIGBrbmV4Lm1pZ3JhdGVgXG4vLyBpbnRlcmZhY2Ugb24gdGhlIG1haW4gYGtuZXhgIG9iamVjdC4gUGFzc2VzIHRoZSBga25leGAgaW5zdGFuY2UgcGVyZm9ybWluZ1xuLy8gdGhlIG1pZ3JhdGlvbi5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1pZ3JhdG9yIHtcblxuICBjb25zdHJ1Y3RvcihrbmV4KSB7XG4gICAgdGhpcy5rbmV4ID0ga25leFxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoa25leC5jbGllbnQuY29uZmlnLm1pZ3JhdGlvbnMpO1xuICB9XG5cbiAgLy8gTWlncmF0b3JzIHRvIHRoZSBsYXRlc3QgY29uZmlndXJhdGlvbi5cbiAgbGF0ZXN0KGNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5fbWlncmF0aW9uRGF0YSgpXG4gICAgICAudGFwKHZhbGlkYXRlTWlncmF0aW9uTGlzdClcbiAgICAgIC5zcHJlYWQoKGFsbCwgY29tcGxldGVkKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ydW5CYXRjaChkaWZmZXJlbmNlKGFsbCwgY29tcGxldGVkKSwgJ3VwJyk7XG4gICAgICB9KVxuICB9XG5cbiAgLy8gUm9sbGJhY2sgdGhlIGxhc3QgXCJiYXRjaFwiIG9mIG1pZ3JhdGlvbnMgdGhhdCB3ZXJlIHJ1bi5cbiAgcm9sbGJhY2soY29uZmlnKSB7XG4gICAgcmV0dXJuIFByb21pc2UudHJ5KCgpID0+IHtcbiAgICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgICAgIHJldHVybiB0aGlzLl9taWdyYXRpb25EYXRhKClcbiAgICAgICAgLnRhcCh2YWxpZGF0ZU1pZ3JhdGlvbkxpc3QpXG4gICAgICAgIC50aGVuKCh2YWwpID0+IHRoaXMuX2dldExhc3RCYXRjaCh2YWwpKVxuICAgICAgICAudGhlbigobWlncmF0aW9ucykgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLl9ydW5CYXRjaChtYXAobWlncmF0aW9ucywgJ25hbWUnKSwgJ2Rvd24nKTtcbiAgICAgICAgfSk7XG4gICAgfSlcbiAgfVxuXG4gIHN0YXR1cyhjb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMuc2V0Q29uZmlnKGNvbmZpZyk7XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5rbmV4KHRoaXMuY29uZmlnLnRhYmxlTmFtZSkuc2VsZWN0KCcqJyksXG4gICAgICB0aGlzLl9saXN0QWxsKClcbiAgICBdKVxuICAgIC5zcHJlYWQoKGRiLCBjb2RlKSA9PiBkYi5sZW5ndGggLSBjb2RlLmxlbmd0aCk7XG5cbiAgfVxuXG4gIC8vIFJldHJpZXZlcyBhbmQgcmV0dXJucyB0aGUgY3VycmVudCBtaWdyYXRpb24gdmVyc2lvbiB3ZSdyZSBvbiwgYXMgYSBwcm9taXNlLlxuICAvLyBJZiBubyBtaWdyYXRpb25zIGhhdmUgYmVlbiBydW4geWV0LCByZXR1cm4gXCJub25lXCIuXG4gIGN1cnJlbnRWZXJzaW9uKGNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5fbGlzdENvbXBsZXRlZChjb25maWcpXG4gICAgICAudGhlbigoY29tcGxldGVkKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbCA9IGNoYWluKGNvbXBsZXRlZCkubWFwKHZhbHVlID0+IHZhbHVlLnNwbGl0KCdfJylbMF0pLm1heCgpLnZhbHVlKCk7XG4gICAgICAgIHJldHVybiAoaXNVbmRlZmluZWQodmFsKSA/ICdub25lJyA6IHZhbCk7XG4gICAgICB9KVxuICB9XG5cbiAgZm9yY2VGcmVlTWlncmF0aW9uc0xvY2soY29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSB0aGlzLnNldENvbmZpZyhjb25maWcpO1xuICAgIGNvbnN0IGxvY2tUYWJsZSA9IHRoaXMuX2dldExvY2tUYWJsZU5hbWUoKTtcbiAgICByZXR1cm4gdGhpcy5rbmV4LnNjaGVtYS5oYXNUYWJsZShsb2NrVGFibGUpXG4gICAgICAgIC50aGVuKGV4aXN0ID0+IGV4aXN0ICYmIHRoaXMuX2ZyZWVMb2NrKCkpO1xuICB9XG5cbiAgLy8gQ3JlYXRlcyBhIG5ldyBtaWdyYXRpb24sIHdpdGggYSBnaXZlbiBuYW1lLlxuICBtYWtlKG5hbWUsIGNvbmZpZykge1xuICAgIHRoaXMuY29uZmlnID0gdGhpcy5zZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoIW5hbWUpIFByb21pc2UucmVqZWN0ZWQobmV3IEVycm9yKCdBIG5hbWUgbXVzdCBiZSBzcGVjaWZpZWQgZm9yIHRoZSBnZW5lcmF0ZWQgbWlncmF0aW9uJykpO1xuICAgIHJldHVybiB0aGlzLl9lbnN1cmVGb2xkZXIoY29uZmlnKVxuICAgICAgLnRoZW4oKHZhbCkgPT4gdGhpcy5fZ2VuZXJhdGVTdHViVGVtcGxhdGUodmFsKSlcbiAgICAgIC50aGVuKCh2YWwpID0+IHRoaXMuX3dyaXRlTmV3TWlncmF0aW9uKG5hbWUsIHZhbCkpO1xuICB9XG5cbiAgLy8gTGlzdHMgYWxsIGF2YWlsYWJsZSBtaWdyYXRpb24gdmVyc2lvbnMsIGFzIGEgc29ydGVkIGFycmF5LlxuICBfbGlzdEFsbChjb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHRoaXMuc2V0Q29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIFByb21pc2UucHJvbWlzaWZ5KGZzLnJlYWRkaXIsIHtjb250ZXh0OiBmc30pKHRoaXMuX2Fic29sdXRlQ29uZmlnRGlyKCkpXG4gICAgICAudGhlbihtaWdyYXRpb25zID0+IHtcbiAgICAgICAgcmV0dXJuIGZpbHRlcihtaWdyYXRpb25zLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IHBhdGguZXh0bmFtZSh2YWx1ZSk7XG4gICAgICAgICAgcmV0dXJuIGluY2x1ZGVzKFNVUFBPUlRFRF9FWFRFTlNJT05TLCBleHRlbnNpb24pO1xuICAgICAgICB9KS5zb3J0KCk7XG4gICAgICB9KVxuICB9XG5cbiAgLy8gRW5zdXJlcyBhIGZvbGRlciBmb3IgdGhlIG1pZ3JhdGlvbnMgZXhpc3QsIGRlcGVuZGVudCBvbiB0aGUgbWlncmF0aW9uXG4gIC8vIGNvbmZpZyBzZXR0aW5ncy5cbiAgX2Vuc3VyZUZvbGRlcigpIHtcbiAgICBjb25zdCBkaXIgPSB0aGlzLl9hYnNvbHV0ZUNvbmZpZ0RpcigpO1xuICAgIHJldHVybiBQcm9taXNlLnByb21pc2lmeShmcy5zdGF0LCB7Y29udGV4dDogZnN9KShkaXIpXG4gICAgICAuY2F0Y2goKCkgPT4gUHJvbWlzZS5wcm9taXNpZnkobWtkaXJwKShkaXIpKTtcbiAgfVxuXG4gIC8vIEVuc3VyZXMgdGhhdCBhIHByb3BlciB0YWJsZSBoYXMgYmVlbiBjcmVhdGVkLCBkZXBlbmRlbnQgb24gdGhlIG1pZ3JhdGlvblxuICAvLyBjb25maWcgc2V0dGluZ3MuXG4gIF9lbnN1cmVUYWJsZSgpIHtcbiAgICBjb25zdCB0YWJsZSA9IHRoaXMuY29uZmlnLnRhYmxlTmFtZTtcbiAgICBjb25zdCBsb2NrVGFibGUgPSB0aGlzLl9nZXRMb2NrVGFibGVOYW1lKCk7XG4gICAgcmV0dXJuIHRoaXMua25leC5zY2hlbWEuaGFzVGFibGUodGFibGUpXG4gICAgICAudGhlbihleGlzdHMgPT4gIWV4aXN0cyAmJiB0aGlzLl9jcmVhdGVNaWdyYXRpb25UYWJsZSh0YWJsZSkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmtuZXguc2NoZW1hLmhhc1RhYmxlKGxvY2tUYWJsZSkpXG4gICAgICAudGhlbihleGlzdHMgPT4gIWV4aXN0cyAmJiB0aGlzLl9jcmVhdGVNaWdyYXRpb25Mb2NrVGFibGUobG9ja1RhYmxlKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMua25leChsb2NrVGFibGUpLnNlbGVjdCgnKicpKVxuICAgICAgLnRoZW4oZGF0YSA9PiAhZGF0YS5sZW5ndGggJiYgdGhpcy5rbmV4KGxvY2tUYWJsZSkuaW5zZXJ0KHsgaXNfbG9ja2VkOiAwIH0pKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgbWlncmF0aW9uIHRhYmxlLCBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gIF9jcmVhdGVNaWdyYXRpb25UYWJsZSh0YWJsZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5rbmV4LnNjaGVtYS5jcmVhdGVUYWJsZUlmTm90RXhpc3RzKHRhYmxlTmFtZSwgZnVuY3Rpb24odCkge1xuICAgICAgdC5pbmNyZW1lbnRzKCk7XG4gICAgICB0LnN0cmluZygnbmFtZScpO1xuICAgICAgdC5pbnRlZ2VyKCdiYXRjaCcpO1xuICAgICAgdC50aW1lc3RhbXAoJ21pZ3JhdGlvbl90aW1lJyk7XG4gICAgfSk7XG4gIH1cblxuICBfY3JlYXRlTWlncmF0aW9uTG9ja1RhYmxlKHRhYmxlTmFtZSkge1xuICAgIHJldHVybiB0aGlzLmtuZXguc2NoZW1hLmNyZWF0ZVRhYmxlSWZOb3RFeGlzdHModGFibGVOYW1lLCBmdW5jdGlvbih0KSB7XG4gICAgICB0LmludGVnZXIoJ2lzX2xvY2tlZCcpO1xuICAgIH0pO1xuICB9XG5cbiAgX2dldExvY2tUYWJsZU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLnRhYmxlTmFtZSArICdfbG9jayc7XG4gIH1cblxuICBfaXNMb2NrZWQodHJ4KSB7XG4gICAgY29uc3QgdGFibGVOYW1lID0gdGhpcy5fZ2V0TG9ja1RhYmxlTmFtZSgpO1xuICAgIHJldHVybiB0aGlzLmtuZXgodGFibGVOYW1lKVxuICAgICAgLnRyYW5zYWN0aW5nKHRyeClcbiAgICAgIC5mb3JVcGRhdGUoKVxuICAgICAgLnNlbGVjdCgnKicpXG4gICAgICAudGhlbihkYXRhID0+IGRhdGFbMF0uaXNfbG9ja2VkKTtcbiAgfVxuXG4gIF9sb2NrTWlncmF0aW9ucyh0cngpIHtcbiAgICBjb25zdCB0YWJsZU5hbWUgPSB0aGlzLl9nZXRMb2NrVGFibGVOYW1lKCk7XG4gICAgcmV0dXJuIHRoaXMua25leCh0YWJsZU5hbWUpXG4gICAgICAudHJhbnNhY3RpbmcodHJ4KVxuICAgICAgLnVwZGF0ZSh7IGlzX2xvY2tlZDogMSB9KTtcbiAgfVxuXG4gIF9nZXRMb2NrKCkge1xuICAgIHJldHVybiB0aGlzLmtuZXgudHJhbnNhY3Rpb24odHJ4ID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9pc0xvY2tlZCh0cngpXG4gICAgICAgIC50aGVuKGlzTG9ja2VkID0+IHtcbiAgICAgICAgICBpZiAoaXNMb2NrZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pZ3JhdGlvbiB0YWJsZSBpcyBhbHJlYWR5IGxvY2tlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHRoaXMuX2xvY2tNaWdyYXRpb25zKHRyeCkpO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aHJvdyBuZXcgTG9ja0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9KTtcbiAgfVxuXG4gIF9mcmVlTG9jaygpIHtcbiAgICBjb25zdCB0YWJsZU5hbWUgPSB0aGlzLl9nZXRMb2NrVGFibGVOYW1lKCk7XG4gICAgcmV0dXJuIHRoaXMua25leCh0YWJsZU5hbWUpXG4gICAgICAudXBkYXRlKHsgaXNfbG9ja2VkOiAwIH0pO1xuICB9XG5cbiAgLy8gUnVuIGEgYmF0Y2ggb2YgY3VycmVudCBtaWdyYXRpb25zLCBpbiBzZXF1ZW5jZS5cbiAgX3J1bkJhdGNoKG1pZ3JhdGlvbnMsIGRpcmVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLl9nZXRMb2NrKClcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLmFsbChtYXAobWlncmF0aW9ucywgYmluZCh0aGlzLl92YWxpZGF0ZU1pZ3JhdGlvblN0cnVjdHVyZSwgdGhpcykpKSlcbiAgICAudGhlbigoKSA9PiB0aGlzLl9sYXRlc3RCYXRjaE51bWJlcigpKVxuICAgIC50aGVuKGJhdGNoTm8gPT4ge1xuICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3VwJykgYmF0Y2hObysrO1xuICAgICAgcmV0dXJuIGJhdGNoTm87XG4gICAgfSlcbiAgICAudGhlbihiYXRjaE5vID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl93YXRlcmZhbGxCYXRjaChiYXRjaE5vLCBtaWdyYXRpb25zLCBkaXJlY3Rpb24pXG4gICAgfSlcbiAgICAudGFwKCgpID0+IHRoaXMuX2ZyZWVMb2NrKCkpXG4gICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgIGxldCBjbGVhbnVwUmVhZHkgPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgTG9ja0Vycm9yKSB7XG4gICAgICAgIC8vIElmIGxvY2tpbmcgZXJyb3IgZG8gbm90IGZyZWUgdGhlIGxvY2suXG4gICAgICAgIGhlbHBlcnMud2FybihgQ2FuJ3QgdGFrZSBsb2NrIHRvIHJ1biBtaWdyYXRpb25zOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIGhlbHBlcnMud2FybihcbiAgICAgICAgICAnSWYgeW91IGFyZSBzdXJlIG1pZ3JhdGlvbnMgYXJlIG5vdCBydW5uaW5nIHlvdSBjYW4gcmVsZWFzZSB0aGUgJyArXG4gICAgICAgICAgJ2xvY2sgbWFudWFsbHkgYnkgZGVsZXRpbmcgYWxsIHRoZSByb3dzIGZyb20gbWlncmF0aW9ucyBsb2NrICcgK1xuICAgICAgICAgICd0YWJsZTogJyArIHRoaXMuX2dldExvY2tUYWJsZU5hbWUoKVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaGVscGVycy53YXJuKGBtaWdyYXRpb25zIGZhaWxlZCB3aXRoIGVycm9yOiAke2Vycm9yLm1lc3NhZ2V9YClcbiAgICAgICAgLy8gSWYgdGhlIGVycm9yIHdhcyBub3QgZHVlIHRvIGEgbG9ja2luZyBpc3N1ZSwgdGhlbiByZW1vdmUgdGhlIGxvY2suXG4gICAgICAgIGNsZWFudXBSZWFkeSA9IHRoaXMuX2ZyZWVMb2NrKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBjbGVhbnVwUmVhZHkuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlcyBzb21lIG1pZ3JhdGlvbnMgYnkgcmVxdWlyaW5nIGFuZCBjaGVja2luZyBmb3IgYW4gYHVwYCBhbmQgYGRvd25gXG4gIC8vIGZ1bmN0aW9uLlxuICBfdmFsaWRhdGVNaWdyYXRpb25TdHJ1Y3R1cmUobmFtZSkge1xuICAgIGNvbnN0IG1pZ3JhdGlvbiA9IHJlcXVpcmUocGF0aC5qb2luKHRoaXMuX2Fic29sdXRlQ29uZmlnRGlyKCksIG5hbWUpKTtcbiAgICBpZiAodHlwZW9mIG1pZ3JhdGlvbi51cCAhPT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgbWlncmF0aW9uLmRvd24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBtaWdyYXRpb246ICR7bmFtZX0gbXVzdCBoYXZlIGJvdGggYW4gdXAgYW5kIGRvd24gZnVuY3Rpb25gKTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICAvLyBMaXN0cyBhbGwgbWlncmF0aW9ucyB0aGF0IGhhdmUgYmVlbiBjb21wbGV0ZWQgZm9yIHRoZSBjdXJyZW50IGRiLCBhcyBhblxuICAvLyBhcnJheS5cbiAgX2xpc3RDb21wbGV0ZWQoKSB7XG4gICAgY29uc3QgeyB0YWJsZU5hbWUgfSA9IHRoaXMuY29uZmlnXG4gICAgcmV0dXJuIHRoaXMuX2Vuc3VyZVRhYmxlKHRhYmxlTmFtZSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMua25leCh0YWJsZU5hbWUpLm9yZGVyQnkoJ2lkJykuc2VsZWN0KCduYW1lJykpXG4gICAgICAudGhlbigobWlncmF0aW9ucykgPT4gbWFwKG1pZ3JhdGlvbnMsICduYW1lJykpXG4gIH1cblxuICAvLyBHZXRzIHRoZSBtaWdyYXRpb24gbGlzdCBmcm9tIHRoZSBzcGVjaWZpZWQgbWlncmF0aW9uIGRpcmVjdG9yeSwgYXMgd2VsbCBhc1xuICAvLyB0aGUgbGlzdCBvZiBjb21wbGV0ZWQgbWlncmF0aW9ucyB0byBjaGVjayB3aGF0IHNob3VsZCBiZSBydW4uXG4gIF9taWdyYXRpb25EYXRhKCkge1xuICAgIHJldHVybiBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLl9saXN0QWxsKCksXG4gICAgICB0aGlzLl9saXN0Q29tcGxldGVkKClcbiAgICBdKTtcbiAgfVxuXG4gIC8vIEdlbmVyYXRlcyB0aGUgc3R1YiB0ZW1wbGF0ZSBmb3IgdGhlIGN1cnJlbnQgbWlncmF0aW9uLCByZXR1cm5pbmcgYSBjb21waWxlZFxuICAvLyB0ZW1wbGF0ZS5cbiAgX2dlbmVyYXRlU3R1YlRlbXBsYXRlKCkge1xuICAgIGNvbnN0IHN0dWJQYXRoID0gdGhpcy5jb25maWcuc3R1YiB8fFxuICAgICAgcGF0aC5qb2luKF9fZGlybmFtZSwgJ3N0dWInLCB0aGlzLmNvbmZpZy5leHRlbnNpb24gKyAnLnN0dWInKTtcbiAgICByZXR1cm4gUHJvbWlzZS5wcm9taXNpZnkoZnMucmVhZEZpbGUsIHtjb250ZXh0OiBmc30pKHN0dWJQYXRoKS50aGVuKHN0dWIgPT5cbiAgICAgIHRlbXBsYXRlKHN0dWIudG9TdHJpbmcoKSwge3ZhcmlhYmxlOiAnZCd9KVxuICAgICk7XG4gIH1cblxuICAvLyBXcml0ZSBhIG5ldyBtaWdyYXRpb24gdG8gZGlzaywgdXNpbmcgdGhlIGNvbmZpZyBhbmQgZ2VuZXJhdGVkIGZpbGVuYW1lLFxuICAvLyBwYXNzaW5nIGFueSBgdmFyaWFibGVzYCBnaXZlbiBpbiB0aGUgY29uZmlnIHRvIHRoZSB0ZW1wbGF0ZS5cbiAgX3dyaXRlTmV3TWlncmF0aW9uKG5hbWUsIHRtcGwpIHtcbiAgICBjb25zdCB7IGNvbmZpZyB9ID0gdGhpcztcbiAgICBjb25zdCBkaXIgPSB0aGlzLl9hYnNvbHV0ZUNvbmZpZ0RpcigpO1xuICAgIGlmIChuYW1lWzBdID09PSAnLScpIG5hbWUgPSBuYW1lLnNsaWNlKDEpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0geXl5eW1tZGRoaG1tc3MoKSArICdfJyArIG5hbWUgKyAnLicgKyBjb25maWcuZXh0ZW5zaW9uO1xuICAgIHJldHVybiBQcm9taXNlLnByb21pc2lmeShmcy53cml0ZUZpbGUsIHtjb250ZXh0OiBmc30pKFxuICAgICAgcGF0aC5qb2luKGRpciwgZmlsZW5hbWUpLFxuICAgICAgdG1wbChjb25maWcudmFyaWFibGVzIHx8IHt9KVxuICAgICkucmV0dXJuKHBhdGguam9pbihkaXIsIGZpbGVuYW1lKSk7XG4gIH1cblxuICAvLyBHZXQgdGhlIGxhc3QgYmF0Y2ggb2YgbWlncmF0aW9ucywgYnkgbmFtZSwgb3JkZXJlZCBieSBpbnNlcnQgaWQgaW4gcmV2ZXJzZVxuICAvLyBvcmRlci5cbiAgX2dldExhc3RCYXRjaCgpIHtcbiAgICBjb25zdCB7IHRhYmxlTmFtZSB9ID0gdGhpcy5jb25maWc7XG4gICAgcmV0dXJuIHRoaXMua25leCh0YWJsZU5hbWUpXG4gICAgICAud2hlcmUoJ2JhdGNoJywgZnVuY3Rpb24ocWIpIHtcbiAgICAgICAgcWIubWF4KCdiYXRjaCcpLmZyb20odGFibGVOYW1lKVxuICAgICAgfSlcbiAgICAgIC5vcmRlckJ5KCdpZCcsICdkZXNjJyk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBsYXRlc3QgYmF0Y2ggbnVtYmVyLlxuICBfbGF0ZXN0QmF0Y2hOdW1iZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMua25leCh0aGlzLmNvbmZpZy50YWJsZU5hbWUpXG4gICAgICAubWF4KCdiYXRjaCBhcyBtYXhfYmF0Y2gnKS50aGVuKG9iaiA9PiBvYmpbMF0ubWF4X2JhdGNoIHx8IDApO1xuICB9XG5cbiAgLy8gSWYgdHJhbnNhY3Rpb24gY29uZmlnIGZvciBhIHNpbmdsZSBtaWdyYXRpb24gaXMgZGVmaW5lZCwgdXNlIHRoYXQuXG4gIC8vIE90aGVyd2lzZSwgcmVseSBvbiB0aGUgY29tbW9uIGNvbmZpZy4gVGhpcyBhbGxvd3MgZW5hYmxpbmcvZGlzYWJsaW5nXG4gIC8vIHRyYW5zYWN0aW9uIGZvciBhIHNpbmdsZSBtaWdyYXRpb24gYXQgd2lsbCwgcmVnYXJkbGVzcyBvZiB0aGUgY29tbW9uXG4gIC8vIGNvbmZpZy5cbiAgX3VzZVRyYW5zYWN0aW9uKG1pZ3JhdGlvbiwgYWxsVHJhbnNhY3Rpb25zRGlzYWJsZWQpIHtcbiAgICBjb25zdCBzaW5nbGVUcmFuc2FjdGlvblZhbHVlID0gZ2V0KG1pZ3JhdGlvbiwgJ2NvbmZpZy50cmFuc2FjdGlvbicpO1xuXG4gICAgcmV0dXJuIGlzQm9vbGVhbihzaW5nbGVUcmFuc2FjdGlvblZhbHVlKSA/XG4gICAgICBzaW5nbGVUcmFuc2FjdGlvblZhbHVlIDpcbiAgICAgICFhbGxUcmFuc2FjdGlvbnNEaXNhYmxlZDtcbiAgfVxuXG4gIC8vIFJ1bnMgYSBiYXRjaCBvZiBgbWlncmF0aW9uc2AgaW4gYSBzcGVjaWZpZWQgYGRpcmVjdGlvbmAsIHNhdmluZyB0aGVcbiAgLy8gYXBwcm9wcmlhdGUgZGF0YWJhc2UgaW5mb3JtYXRpb24gYXMgdGhlIG1pZ3JhdGlvbnMgYXJlIHJ1bi5cbiAgX3dhdGVyZmFsbEJhdGNoKGJhdGNoTm8sIG1pZ3JhdGlvbnMsIGRpcmVjdGlvbikge1xuICAgIGNvbnN0IHsga25leCB9ID0gdGhpcztcbiAgICBjb25zdCB7dGFibGVOYW1lLCBkaXNhYmxlVHJhbnNhY3Rpb25zfSA9IHRoaXMuY29uZmlnXG4gICAgY29uc3QgZGlyZWN0b3J5ID0gdGhpcy5fYWJzb2x1dGVDb25maWdEaXIoKVxuICAgIGxldCBjdXJyZW50ID0gUHJvbWlzZS5iaW5kKHtmYWlsZWQ6IGZhbHNlLCBmYWlsZWRPbjogMH0pO1xuICAgIGNvbnN0IGxvZyA9IFtdO1xuICAgIGVhY2gobWlncmF0aW9ucywgKG1pZ3JhdGlvbikgPT4ge1xuICAgICAgY29uc3QgbmFtZSA9IG1pZ3JhdGlvbjtcbiAgICAgIG1pZ3JhdGlvbiA9IHJlcXVpcmUoZGlyZWN0b3J5ICsgJy8nICsgbmFtZSk7XG5cbiAgICAgIC8vIFdlJ3JlIGdvaW5nIHRvIHJ1biBlYWNoIG9mIHRoZSBtaWdyYXRpb25zIGluIHRoZSBjdXJyZW50IFwidXBcIi5cbiAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fdXNlVHJhbnNhY3Rpb24obWlncmF0aW9uLCBkaXNhYmxlVHJhbnNhY3Rpb25zKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLl90cmFuc2FjdGlvbihtaWdyYXRpb24sIGRpcmVjdGlvbiwgbmFtZSlcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2FyblByb21pc2UobWlncmF0aW9uW2RpcmVjdGlvbl0oa25leCwgUHJvbWlzZSksIG5hbWUpXG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBsb2cucHVzaChwYXRoLmpvaW4oZGlyZWN0b3J5LCBuYW1lKSk7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd1cCcpIHtcbiAgICAgICAgICByZXR1cm4ga25leCh0YWJsZU5hbWUpLmluc2VydCh7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgYmF0Y2g6IGJhdGNoTm8sXG4gICAgICAgICAgICBtaWdyYXRpb25fdGltZTogbmV3IERhdGUoKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICdkb3duJykge1xuICAgICAgICAgIHJldHVybiBrbmV4KHRhYmxlTmFtZSkud2hlcmUoe25hbWV9KS5kZWwoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSlcblxuICAgIHJldHVybiBjdXJyZW50LnRoZW5SZXR1cm4oW2JhdGNoTm8sIGxvZ10pO1xuICB9XG5cbiAgX3RyYW5zYWN0aW9uKG1pZ3JhdGlvbiwgZGlyZWN0aW9uLCBuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMua25leC50cmFuc2FjdGlvbigodHJ4KSA9PiB7XG4gICAgICByZXR1cm4gd2FyblByb21pc2UobWlncmF0aW9uW2RpcmVjdGlvbl0odHJ4LCBQcm9taXNlKSwgbmFtZSwgKCkgPT4ge1xuICAgICAgICB0cnguY29tbWl0KClcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIF9hYnNvbHV0ZUNvbmZpZ0RpcigpIHtcbiAgICByZXR1cm4gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksIHRoaXMuY29uZmlnLmRpcmVjdG9yeSk7XG4gIH1cblxuICBzZXRDb25maWcoY29uZmlnKSB7XG4gICAgcmV0dXJuIGFzc2lnbih7fSwgQ09ORklHX0RFRkFVTFQsIHRoaXMuY29uZmlnIHx8IHt9LCBjb25maWcpO1xuICB9XG5cbn1cblxuLy8gVmFsaWRhdGVzIHRoYXQgbWlncmF0aW9ucyBhcmUgcHJlc2VudCBpbiB0aGUgYXBwcm9wcmlhdGUgZGlyZWN0b3JpZXMuXG5mdW5jdGlvbiB2YWxpZGF0ZU1pZ3JhdGlvbkxpc3QobWlncmF0aW9ucykge1xuICBjb25zdCBhbGwgPSBtaWdyYXRpb25zWzBdO1xuICBjb25zdCBjb21wbGV0ZWQgPSBtaWdyYXRpb25zWzFdO1xuICBjb25zdCBkaWZmID0gZGlmZmVyZW5jZShjb21wbGV0ZWQsIGFsbCk7XG4gIGlmICghaXNFbXB0eShkaWZmKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBUaGUgbWlncmF0aW9uIGRpcmVjdG9yeSBpcyBjb3JydXB0LCB0aGUgZm9sbG93aW5nIGZpbGVzIGFyZSBtaXNzaW5nOiAke2RpZmYuam9pbignLCAnKX1gXG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3YXJuUHJvbWlzZSh2YWx1ZSwgbmFtZSwgZm4pIHtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUudGhlbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGhlbHBlcnMud2FybihgbWlncmF0aW9uICR7bmFtZX0gZGlkIG5vdCByZXR1cm4gYSBwcm9taXNlYCk7XG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgZm4oKVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSAyIHBsYWNlcyBmb3IgZWFjaCBvZiB0aGUgZGF0ZSBzZWdtZW50cy5cbmZ1bmN0aW9uIHBhZERhdGUoc2VnbWVudCkge1xuICBzZWdtZW50ID0gc2VnbWVudC50b1N0cmluZygpO1xuICByZXR1cm4gc2VnbWVudFsxXSA/IHNlZ21lbnQgOiBgMCR7c2VnbWVudH1gO1xufVxuXG4vLyBHZXQgYSBkYXRlIG9iamVjdCBpbiB0aGUgY29ycmVjdCBmb3JtYXQsIHdpdGhvdXQgcmVxdWlyaW5nIGEgZnVsbCBvdXQgbGlicmFyeVxuLy8gbGlrZSBcIm1vbWVudC5qc1wiLlxuZnVuY3Rpb24geXl5eW1tZGRoaG1tc3MoKSB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZSgpO1xuICByZXR1cm4gZC5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCkgK1xuICAgICAgcGFkRGF0ZShkLmdldE1vbnRoKCkgKyAxKSArXG4gICAgICBwYWREYXRlKGQuZ2V0RGF0ZSgpKSArXG4gICAgICBwYWREYXRlKGQuZ2V0SG91cnMoKSkgK1xuICAgICAgcGFkRGF0ZShkLmdldE1pbnV0ZXMoKSkgK1xuICAgICAgcGFkRGF0ZShkLmdldFNlY29uZHMoKSk7XG59XG4iXX0=
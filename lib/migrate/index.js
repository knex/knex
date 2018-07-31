'use strict';

exports.__esModule = true;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _tableResolver = require('./table-resolver');

var _tableCreator = require('./table-creator');

var _migrationListResolver = require('./migration-list-resolver');

var migrationListResolver = _interopRequireWildcard(_migrationListResolver);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
          newObj[key] = obj[key];
      }
    }
    newObj.default = obj;
    return newObj;
  }
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function LockError(msg) {
  this.name = 'MigrationLocked';
  this.message = msg;
} // Migrator
// -------

(0, _inherits2.default)(LockError, Error);

var CONFIG_DEFAULT = (0, _freeze2.default)({
  extension: 'js',
  loadExtensions: migrationListResolver.DEFAULT_LOAD_EXTENSIONS,
  tableName: 'knex_migrations',
  schemaName: null,
  directory: './migrations',
  disableTransactions: false,
});

// The new migration we're performing, typically called from the `knex.migrate`
// interface on the main `knex` object. Passes the `knex` instance performing
// the migration.

var Migrator = (function() {
  function Migrator(knex) {
    (0, _classCallCheck3.default)(this, Migrator);

    this.knex = knex;
    this.config = this.setConfig(knex.client.config.migrations);

    this._activeMigration = {
      fileName: null,
    };
  }

  // Migrators to the latest configuration.

  Migrator.prototype.latest = function latest(config) {
    var _this = this;

    this.config = this.setConfig(config);
    return migrationListResolver
      .listAllAndCompleted(this.config, this.knex, this._absoluteConfigDir())
      .tap(validateMigrationList)
      .spread(function(all, completed) {
        var migrations = (0, _lodash.difference)(all, completed);

        var transactionForAll =
          !_this.config.disableTransactions &&
          (0, _lodash.isEmpty)(
            (0, _lodash.filter)(migrations, function(name) {
              var migration = require(_path2.default.join(
                _this._absoluteConfigDir(),
                name
              ));
              return !_this._useTransaction(migration);
            })
          );

        if (transactionForAll) {
          return _this.knex.transaction(function(trx) {
            return _this._runBatch(migrations, 'up', trx);
          });
        } else {
          return _this._runBatch(migrations, 'up');
        }
      });
  };

  // Rollback the last "batch" of migrations that were run.

  Migrator.prototype.rollback = function rollback(config) {
    var _this2 = this;

    return _bluebird2.default.try(function() {
      _this2.config = _this2.setConfig(config);
      return migrationListResolver
        .listAllAndCompleted(
          _this2.config,
          _this2.knex,
          _this2._absoluteConfigDir()
        )
        .tap(validateMigrationList)
        .then(function(val) {
          return _this2._getLastBatch(val);
        })
        .then(function(migrations) {
          return _this2._runBatch((0, _lodash.map)(migrations, 'name'), 'down');
        });
    });
  };

  Migrator.prototype.status = function status(config) {
    this.config = this.setConfig(config);

    return _bluebird2.default
      .all([
        (0, _tableResolver.getTable)(
          this.knex,
          this.config.tableName,
          this.config.schemaName
        ).select('*'),
        migrationListResolver.listAll(
          this._absoluteConfigDir(),
          this.config.loadExtensions
        ),
      ])
      .spread(function(db, code) {
        return db.length - code.length;
      });
  };

  // Retrieves and returns the current migration version we're on, as a promise.
  // If no migrations have been run yet, return "none".

  Migrator.prototype.currentVersion = function currentVersion(config) {
    this.config = this.setConfig(config);
    return migrationListResolver
      .listCompleted(this.config.tableName, this.config.schemaName, this.knex)
      .then(function(completed) {
        var val = (0, _lodash.max)(
          (0, _lodash.map)(completed, function(value) {
            return value.split('_')[0];
          })
        );
        return (0, _lodash.isUndefined)(val) ? 'none' : val;
      });
  };

  Migrator.prototype.forceFreeMigrationsLock = function forceFreeMigrationsLock(
    config
  ) {
    var _this3 = this;

    this.config = this.setConfig(config);
    var lockTable = (0, _tableResolver.getLockTableName)(this.config.tableName);
    return (0, _tableCreator.getSchemaBuilder)(
      this.knex,
      this.config.schemaName
    )
      .hasTable(lockTable)
      .then(function(exist) {
        return exist && _this3._freeLock();
      });
  };

  // Creates a new migration, with a given name.

  Migrator.prototype.make = function make(name, config) {
    var _this4 = this;

    this.config = this.setConfig(config);
    if (!name) {
      return _bluebird2.default.reject(
        new Error('A name must be specified for the generated migration')
      );
    }

    return this._ensureFolder(config)
      .then(function(val) {
        return _this4._generateStubTemplate(val);
      })
      .then(function(val) {
        return _this4._writeNewMigration(name, val);
      });
  };

  // Ensures a folder for the migrations exist, dependent on the migration
  // config settings.

  Migrator.prototype._ensureFolder = function _ensureFolder() {
    var dir = this._absoluteConfigDir();
    return _bluebird2.default
      .promisify(_fs2.default.stat, { context: _fs2.default })(dir)
      .catch(function() {
        return _bluebird2.default.promisify(_mkdirp2.default)(dir);
      });
  };

  Migrator.prototype._isLocked = function _isLocked(trx) {
    var tableName = (0, _tableResolver.getLockTableName)(this.config.tableName);
    return (0, _tableResolver.getTable)(
      this.knex,
      tableName,
      this.config.schemaName
    )
      .transacting(trx)
      .forUpdate()
      .select('*')
      .then(function(data) {
        return data[0].is_locked;
      });
  };

  Migrator.prototype._lockMigrations = function _lockMigrations(trx) {
    var tableName = (0, _tableResolver.getLockTableName)(this.config.tableName);
    return (0, _tableResolver.getTable)(
      this.knex,
      tableName,
      this.config.schemaName
    )
      .transacting(trx)
      .update({ is_locked: 1 });
  };

  Migrator.prototype._getLock = function _getLock(trx) {
    var _this5 = this;

    var transact = trx
      ? function(fn) {
          return fn(trx);
        }
      : function(fn) {
          return _this5.knex.transaction(fn);
        };
    return transact(function(trx) {
      return _this5
        ._isLocked(trx)
        .then(function(isLocked) {
          if (isLocked) {
            throw new Error('Migration table is already locked');
          }
        })
        .then(function() {
          return _this5._lockMigrations(trx);
        });
    }).catch(function(err) {
      throw new LockError(err.message);
    });
  };

  Migrator.prototype._freeLock = function _freeLock() {
    var trx =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : this.knex;

    var tableName = (0, _tableResolver.getLockTableName)(this.config.tableName);
    return (0, _tableResolver.getTable)(
      trx,
      tableName,
      this.config.schemaName
    ).update({
      is_locked: 0,
    });
  };

  // Run a batch of current migrations, in sequence.

  Migrator.prototype._runBatch = function _runBatch(
    migrations,
    direction,
    trx
  ) {
    var _this6 = this;

    return (
      this._getLock(trx)
        // When there is a wrapping transaction, some migrations
        // could have been done while waiting for the lock:
        .then(function() {
          return trx
            ? migrationListResolver.listCompleted(
                _this6.config.tableName,
                _this6.config.schemaName,
                trx
              )
            : [];
        })
        .then(function(completed) {
          return (migrations = (0, _lodash.difference)(migrations, completed));
        })
        .then(function() {
          return _bluebird2.default.all(
            (0, _lodash.map)(
              migrations,
              (0, _lodash.bind)(_this6._validateMigrationStructure, _this6)
            )
          );
        })
        .then(function() {
          return _this6._latestBatchNumber(trx);
        })
        .then(function(batchNo) {
          if (direction === 'up') batchNo++;
          return batchNo;
        })
        .then(function(batchNo) {
          return _this6._waterfallBatch(batchNo, migrations, direction, trx);
        })
        .tap(function() {
          return _this6._freeLock(trx);
        })
        .catch(function(error) {
          var cleanupReady = _bluebird2.default.resolve();

          if (error instanceof LockError) {
            // If locking error do not free the lock.
            _this6.knex.client.logger.warn(
              "Can't take lock to run migrations: " + error.message
            );
            _this6.knex.client.logger.warn(
              'If you are sure migrations are not running you can release the ' +
                'lock manually by deleting all the rows from migrations lock ' +
                'table: ' +
                (0, _tableResolver.getLockTableNameWithSchema)(
                  _this6.config.tableName,
                  _this6.config.schemaName
                )
            );
          } else {
            if (_this6._activeMigration.fileName) {
              _this6.knex.client.logger.warn(
                'migration file "' +
                  _this6._activeMigration.fileName +
                  '" failed'
              );
            }
            _this6.knex.client.logger.warn(
              'migration failed with error: ' + error.message
            );
            // If the error was not due to a locking issue, then remove the lock.
            cleanupReady = _this6._freeLock(trx);
          }

          return cleanupReady.finally(function() {
            throw error;
          });
        })
    );
  };

  // Validates some migrations by requiring and checking for an `up` and `down`
  // function.

  Migrator.prototype._validateMigrationStructure = function _validateMigrationStructure(
    name
  ) {
    var migration = require(_path2.default.join(
      this._absoluteConfigDir(),
      name
    ));
    if (
      typeof migration.up !== 'function' ||
      typeof migration.down !== 'function'
    ) {
      throw new Error(
        'Invalid migration: ' + name + ' must have both an up and down function'
      );
    }
    return name;
  };

  // Generates the stub template for the current migration, returning a compiled
  // template.

  Migrator.prototype._generateStubTemplate = function _generateStubTemplate() {
    var stubPath =
      this.config.stub ||
      _path2.default.join(__dirname, 'stub', this.config.extension + '.stub');
    return _bluebird2.default
      .promisify(_fs2.default.readFile, { context: _fs2.default })(stubPath)
      .then(function(stub) {
        return (0, _lodash.template)(stub.toString(), { variable: 'd' });
      });
  };

  // Write a new migration to disk, using the config and generated filename,
  // passing any `variables` given in the config to the template.

  Migrator.prototype._writeNewMigration = function _writeNewMigration(
    name,
    tmpl
  ) {
    var config = this.config;

    var dir = this._absoluteConfigDir();
    if (name[0] === '-') name = name.slice(1);
    var filename = yyyymmddhhmmss() + '_' + name + '.' + config.extension;
    return _bluebird2.default
      .promisify(_fs2.default.writeFile, { context: _fs2.default })(
        _path2.default.join(dir, filename),
        tmpl(config.variables || {})
      )
      .return(_path2.default.join(dir, filename));
  };

  // Get the last batch of migrations, by name, ordered by insert id in reverse
  // order.

  Migrator.prototype._getLastBatch = function _getLastBatch() {
    var _config = this.config,
      tableName = _config.tableName,
      schemaName = _config.schemaName;

    return (0, _tableResolver.getTable)(this.knex, tableName, schemaName)
      .where('batch', function(qb) {
        qb.max('batch').from(
          (0, _tableResolver.getTableName)(tableName, schemaName)
        );
      })
      .orderBy('id', 'desc');
  };

  // Returns the latest batch number.

  Migrator.prototype._latestBatchNumber = function _latestBatchNumber() {
    var trx =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : this.knex;

    return trx
      .from(
        (0, _tableResolver.getTableName)(
          this.config.tableName,
          this.config.schemaName
        )
      )
      .max('batch as max_batch')
      .then(function(obj) {
        return obj[0].max_batch || 0;
      });
  };

  // If transaction config for a single migration is defined, use that.
  // Otherwise, rely on the common config. This allows enabling/disabling
  // transaction for a single migration at will, regardless of the common
  // config.

  Migrator.prototype._useTransaction = function _useTransaction(
    migration,
    allTransactionsDisabled
  ) {
    var singleTransactionValue = (0, _lodash.get)(
      migration,
      'config.transaction'
    );

    return (0, _lodash.isBoolean)(singleTransactionValue)
      ? singleTransactionValue
      : !allTransactionsDisabled;
  };

  // Runs a batch of `migrations` in a specified `direction`, saving the
  // appropriate database information as the migrations are run.

  Migrator.prototype._waterfallBatch = function _waterfallBatch(
    batchNo,
    migrations,
    direction,
    trx
  ) {
    var _this7 = this;

    var trxOrKnex = trx || this.knex;
    var _config2 = this.config,
      tableName = _config2.tableName,
      schemaName = _config2.schemaName,
      disableTransactions = _config2.disableTransactions;

    var directory = this._absoluteConfigDir();
    var current = _bluebird2.default.bind({ failed: false, failedOn: 0 });
    var log = [];
    (0, _lodash.each)(migrations, function(migration) {
      var name = migration;
      _this7._activeMigration.fileName = name;
      migration = require(directory + '/' + name);

      // We're going to run each of the migrations in the current "up".
      current = current
        .then(function() {
          if (!trx && _this7._useTransaction(migration, disableTransactions)) {
            return _this7._transaction(migration, direction, name);
          }
          return warnPromise(
            _this7.knex,
            migration[direction](trxOrKnex, _bluebird2.default),
            name
          );
        })
        .then(function() {
          log.push(_path2.default.join(directory, name));
          if (direction === 'up') {
            return trxOrKnex
              .into((0, _tableResolver.getTableName)(tableName, schemaName))
              .insert({
                name: name,
                batch: batchNo,
                migration_time: new Date(),
              });
          }
          if (direction === 'down') {
            return trxOrKnex
              .from((0, _tableResolver.getTableName)(tableName, schemaName))
              .where({ name: name })
              .del();
          }
        });
    });

    return current.thenReturn([batchNo, log]);
  };

  Migrator.prototype._transaction = function _transaction(
    migration,
    direction,
    name
  ) {
    var _this8 = this;

    return this.knex.transaction(function(trx) {
      return warnPromise(
        _this8.knex,
        migration[direction](trx, _bluebird2.default),
        name,
        function() {
          trx.commit();
        }
      );
    });
  };

  Migrator.prototype._absoluteConfigDir = function _absoluteConfigDir() {
    return _path2.default.resolve(process.cwd(), this.config.directory);
  };

  Migrator.prototype.setConfig = function setConfig(config) {
    return (0, _lodash.assign)({}, CONFIG_DEFAULT, this.config || {}, config);
  };

  return Migrator;
})();

// Validates that migrations are present in the appropriate directories.

exports.default = Migrator;
function validateMigrationList(migrations) {
  var all = migrations[0];
  var completed = migrations[1];
  var diff = (0, _lodash.difference)(completed, all);
  if (!(0, _lodash.isEmpty)(diff)) {
    throw new Error(
      'The migration directory is corrupt, the following files are missing: ' +
        diff.join(', ')
    );
  }
}

function warnPromise(knex, value, name, fn) {
  if (!value || typeof value.then !== 'function') {
    knex.client.logger.warn('migration ' + name + ' did not return a promise');
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
  return (
    d.getFullYear().toString() +
    padDate(d.getMonth() + 1) +
    padDate(d.getDate()) +
    padDate(d.getHours()) +
    padDate(d.getMinutes()) +
    padDate(d.getSeconds())
  );
}
module.exports = exports['default'];

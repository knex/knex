'use strict';

exports.__esModule = true;
exports.DEFAULT_LOAD_EXTENSIONS = undefined;

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

exports.listAll = listAll;
exports.listCompleted = listCompleted;
exports.listAllAndCompleted = listAllAndCompleted;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _tableResolver = require('./table-resolver');

var _tableCreator = require('./table-creator');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var DEFAULT_LOAD_EXTENSIONS = (exports.DEFAULT_LOAD_EXTENSIONS = (0,
_freeze2.default)([
  '.co',
  '.coffee',
  '.eg',
  '.iced',
  '.js',
  '.litcoffee',
  '.ls',
  '.ts',
]));

// Lists all available migration versions, as a sorted array.
function listAll(absoluteConfigDir) {
  var loadExtensions =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : DEFAULT_LOAD_EXTENSIONS;

  return _bluebird2.default
    .promisify(_fs2.default.readdir, { context: _fs2.default })(
      absoluteConfigDir
    )
    .then(function(migrations) {
      return (0, _lodash.filter)(migrations, function(value) {
        var extension = _path2.default.extname(value);
        return loadExtensions.includes(extension);
      }).sort();
    });
}

// Lists all migrations that have been completed for the current db, as an
// array.
function listCompleted(tableName, schemaName, trxOrKnex) {
  return (0, _tableCreator.ensureTable)(tableName, schemaName, trxOrKnex)
    .then(function() {
      return trxOrKnex
        .from((0, _tableResolver.getTableName)(tableName, schemaName))
        .orderBy('id')
        .select('name');
    })
    .then(function(migrations) {
      return (0, _lodash.map)(migrations, 'name');
    });
}

// Gets the migration list from the migration directory specified in config, as well as
// the list of completed migrations to check what should be run.
function listAllAndCompleted(config, trxOrKnex, absoluteConfigDir) {
  return _bluebird2.default.all([
    listAll(absoluteConfigDir, config.loadExtensions),
    listCompleted(config.tableName, config.schemaName, trxOrKnex),
  ]);
}

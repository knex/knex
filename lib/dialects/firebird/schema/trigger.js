'use strict';

exports.__esModule = true;

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

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

var trigger = {
  createAutoIncrementSequence: function createAutoIncrementSequence(
    logger,
    tableName
  ) {
    var sequenceName = utils
      .generateCombinedName(logger, 'seq', tableName)
      .toUpperCase();
    return '\n      CREATE SEQUENCE ' + sequenceName + ';\n    ';
  },
  createAutoIncrementTrigger: function createAutoIncrementTrigger(
    logger,
    tableName,
    autoIncrementColumnName
  ) {
    autoIncrementColumnName = (autoIncrementColumnName || 'id').toUpperCase();
    var triggerName = utils.generateCombinedName(logger, 'incr', tableName);
    var sequenceName = utils
      .generateCombinedName(logger, 'seq', tableName)
      .toUpperCase();
    return (
      '\n      CREATE OR ALTER TRIGGER ' +
      triggerName +
      ' FOR ' +
      tableName +
      '\n      ACTIVE BEFORE INSERT POSITION 0\n      AS\n      BEGIN\n        IF (NEW."' +
      autoIncrementColumnName +
      '" IS NULL) THEN\n        BEGIN\n          NEW."' +
      autoIncrementColumnName +
      '" = NEXT VALUE FOR ' +
      sequenceName +
      ';\n        END;\n      END;\n    '
    );
  },
};

exports.default = trigger;
module.exports = exports['default'];

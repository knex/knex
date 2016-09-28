'use strict';

exports.__esModule = true;
exports.ReturningHelper = exports.wrapSqlWithCatch = exports.generateCombinedName = undefined;

var _helpers = require('../../helpers');

var helpers = _interopRequireWildcard(_helpers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function generateCombinedName(postfix, name, subNames) {
  var crypto = require('crypto');
  var limit = 30;
  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
  var table = name.replace(/\.|-/g, '_');
  var subNamesPart = subNames.join('_');
  var result = (table + '_' + (subNamesPart.length ? subNamesPart + '_' : '') + postfix).toLowerCase();
  if (result.length > limit) {
    helpers.warn('Automatically generated name "' + result + '" exceeds ' + limit + ' character ' + 'limit for Oracle. Using base64 encoded sha1 of that name instead.');
    // generates the sha1 of the name and encode it with base64
    result = crypto.createHash('sha1').update(result).digest('base64').replace('=', '');
  }
  return result;
}

function wrapSqlWithCatch(sql, errorNumberToCatch) {
  return 'begin execute immediate \'' + sql.replace(/'/g, "''") + '\'; ' + ('exception when others then if sqlcode != ' + errorNumberToCatch + ' then raise; ') + 'end if; ' + 'end;';
}

function ReturningHelper(columnName) {
  this.columnName = columnName;
}

ReturningHelper.prototype.toString = function () {
  return '[object ReturningHelper:' + this.columnName + ']';
};

exports.generateCombinedName = generateCombinedName;
exports.wrapSqlWithCatch = wrapSqlWithCatch;
exports.ReturningHelper = ReturningHelper;
'use strict';

var crypto = require('crypto');
var _ = require('lodash');

var helpers  = require('../../helpers');

function generateCombinedName(postfix, name, subNames) {
  var limit = 30;
  if (!_.isArray(subNames)) subNames = subNames ? [subNames] : [];
  var table = name.replace(/\.|-/g, '_');
  var subNamesPart = subNames.join('_');
  var result = (table + '_' + (subNamesPart.length ? subNamesPart + '_': '') + postfix).toLowerCase();
  if (result.length > limit) {
    helpers.warn('Automatically generated name "' + result + '" exceeds ' + limit + ' character limit for Oracle. Using base64 encoded sha1 of that name instead.');
    // generates the sha1 of the name and encode it with base64
    result = crypto.createHash('sha1')
      .update(result)
      .digest('base64')
      .replace('=', '');
  }
  return result;
}

function wrapSqlWithCatch(sql, errorNumberToCatch) {
  return "begin execute immediate '" + sql.replace(/'/g, "''") + "'; exception when others then if sqlcode != " + errorNumberToCatch + " then raise; end if; end;";
}

function ReturningHelper(columnName) {
  this.columnName = columnName;
}

ReturningHelper.prototype.toString = function () {
  return '[object ReturningHelper:' + this.columnName + ']';
};

function convertQueryResultCase(response) {
  if (Array.isArray(response) && response.length) {
    return response.map(function (row) {
      return Object.keys(row).reduce(function (res, columnName) {
        // if the name is all uppercase convert it to lower case
        if (/^[A-Z0-9_\*\(\)]+$/.test(columnName)) {
          res[columnName.toLowerCase()] = row[columnName];
        } else {
          res[columnName] = columnName;
        }
        return res;
      }, {});
    });
  }

  return response;
}

module.exports = {
  generateCombinedName: generateCombinedName,
  wrapSqlWithCatch: wrapSqlWithCatch,
  ReturningHelper: ReturningHelper,
  convertQueryResultCase: convertQueryResultCase
};

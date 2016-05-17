
var helpers = require('../../helpers');

function generateCombinedName(postfix, name, subNames) {
  var crypto = require('crypto');
  var limit  = 128;
  if (!Array.isArray(subNames)) subNames = subNames ? [subNames] : [];
  var table = name.replace(/\.|-/g, '_');
  var subNamesPart = subNames.join('_');
  var result = (table + '_' + (subNamesPart.length ? subNamesPart + '_': '') + postfix).toLowerCase();
  if (result.length > limit) {
    helpers.warn('Automatically generated name "' + result + '" exceeds ' + limit + ' character limit for Sqlanywhere. Using base64 encoded sha1 of that name instead.');
    // generates the sha1 of the name and encode it with base64
    result = crypto.createHash('sha1')
      .update(result)
      .digest('base64')
      .replace('=', '');
  }
  return result;
}

function ReturningHelper(columnName) {
  this.columnName = columnName;
}

ReturningHelper.prototype.toString = function () {
  return '[object ReturningHelper:' + this.columnName + ']';
}

function dateToString(date) {
  function pad(number, digits) {
    number = number.toString();
    while (number.length < digits) {
      number = "0" + number;
    }
    return number;
  }

  var offset = -date.getTimezoneOffset();
  var ret = pad(date.getFullYear(), 4) + '-' +
    pad(date.getMonth() + 1, 2) + '-' +
    pad(date.getDate(), 2) + 'T' +
    pad(date.getHours(), 2) + ':' +
    pad(date.getMinutes(), 2) + ':' +
    pad(date.getSeconds(), 2) + '.' +
    pad(date.getMilliseconds(), 3);

  if (offset < 0) {
    ret += "-";
    offset *= -1;
  } else {
    ret += "+";
  }

  return ret + pad(Math.floor(offset / 60), 2) + ":" + pad(offset % 60, 2);
}

// converts values from javascript types
// to their 'raw' counterparts for use as a postgres parameter
// note: you can override this function to provide your own conversion mechanism
// for complex types, etc...
var prepareValue = function (val/*, seen , valueForUndefined*/) {
  if (val instanceof Buffer) {
    return val;
  }
  if (val instanceof Date) {
    return dateToString(val);
  }
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
/*
  if (Array.isArray(val)) {
    return arrayString(val);
  }
  if (val === null) {
    return null;
  }
  if (typeof val === 'object') {
    return prepareObject(val, seen);
  }
*/
  return val;
};

module.exports = {
  generateCombinedName: generateCombinedName,
  ReturningHelper: ReturningHelper,
  prepareValue: prepareValue
};

'use strict';

exports.__esModule = true;
exports.charsMap = exports.charsRegex = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.makeEscape = makeEscape;
exports.escapeObject = escapeObject;
exports.arrayToList = arrayToList;
exports.bufferToString = bufferToString;
exports.escapeString = escapeString;
exports.dateToString = dateToString;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint max-len: 0, no-var:0 */

var charsRegex = exports.charsRegex = /[\0\b\t\n\r\x1a"'\\]/g; // eslint-disable-line no-control-regex
var charsMap = exports.charsMap = {
  '\0': '\\0',
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\r': '\\r',
  '\x1a': '\\Z',
  '"': '\\"',
  '\'': '\\\'',
  '\\': '\\\\'
};

function wrapEscape(escapeFn) {
  return function finalEscape(val) {
    var ctx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return escapeFn(val, finalEscape, ctx);
  };
}

function makeEscape() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var finalEscapeDate = config.escapeDate || dateToString;
  var finalEscapeArray = config.escapeArray || arrayToList;
  var finalEscapeBuffer = config.escapeBuffer || bufferToString;
  var finalEscapeString = config.escapeString || escapeString;
  var finalEscapeObject = config.escapeObject || escapeObject;
  var finalWrap = config.wrap || wrapEscape;

  function escapeFn(val, finalEscape, ctx) {
    if (val === undefined || val === null) {
      return 'NULL';
    }
    switch (typeof val === 'undefined' ? 'undefined' : (0, _typeof3.default)(val)) {
      case 'boolean':
        return val ? 'true' : 'false';
      case 'number':
        return val + '';
      case 'object':
        if (val instanceof Date) {
          val = finalEscapeDate(val, finalEscape, ctx);
        } else if (Array.isArray(val)) {
          return finalEscapeArray(val, finalEscape, ctx);
        } else if (Buffer.isBuffer(val)) {
          return finalEscapeBuffer(val, finalEscape, ctx);
        } else {
          return finalEscapeObject(val, finalEscape, ctx);
        }
    }
    return finalEscapeString(val, finalEscape, ctx);
  }

  return finalWrap ? finalWrap(escapeFn) : escapeFn;
}

function escapeObject(val, finalEscape, ctx) {
  if (typeof val.toSQL === 'function') {
    return val.toSQL(ctx);
  } else {
    return (0, _stringify2.default)(val);
  }
}

function arrayToList(array, finalEscape, ctx) {
  var sql = '';
  for (var i = 0; i < array.length; i++) {
    var val = array[i];
    if (Array.isArray(val)) {
      sql += (i === 0 ? '' : ', ') + '(' + arrayToList(val, finalEscape, ctx) + ')';
    } else {
      sql += (i === 0 ? '' : ', ') + finalEscape(val, ctx);
    }
  }
  return sql;
}

function bufferToString(buffer) {
  return "X" + escapeString(buffer.toString('hex'));
}

function escapeString(val, finalEscape, ctx) {
  var chunkIndex = charsRegex.lastIndex = 0;
  var escapedVal = '';
  var match;

  while (match = charsRegex.exec(val)) {
    escapedVal += val.slice(chunkIndex, match.index) + charsMap[match[0]];
    chunkIndex = charsRegex.lastIndex;
  }

  if (chunkIndex === 0) {
    // Nothing was escaped
    return "'" + val + "'";
  }

  if (chunkIndex < val.length) {
    return "'" + escapedVal + val.slice(chunkIndex) + "'";
  }

  return "'" + escapedVal + "'";
}

function dateToString(date, finalEscape, ctx) {
  var timeZone = ctx.timeZone || 'local';

  var dt = new Date(date);
  var year;
  var month;
  var day;
  var hour;
  var minute;
  var second;
  var millisecond;

  if (timeZone === 'local') {
    year = dt.getFullYear();
    month = dt.getMonth() + 1;
    day = dt.getDate();
    hour = dt.getHours();
    minute = dt.getMinutes();
    second = dt.getSeconds();
    millisecond = dt.getMilliseconds();
  } else {
    var tz = convertTimezone(timeZone);

    if (tz !== false && tz !== 0) {
      dt.setTime(dt.getTime() + tz * 60000);
    }

    year = dt.getUTCFullYear();
    month = dt.getUTCMonth() + 1;
    day = dt.getUTCDate();
    hour = dt.getUTCHours();
    minute = dt.getUTCMinutes();
    second = dt.getUTCSeconds();
    millisecond = dt.getUTCMilliseconds();
  }

  // YYYY-MM-DD HH:mm:ss.mmm
  return zeroPad(year, 4) + '-' + zeroPad(month, 2) + '-' + zeroPad(day, 2) + ' ' + zeroPad(hour, 2) + ':' + zeroPad(minute, 2) + ':' + zeroPad(second, 2) + '.' + zeroPad(millisecond, 3);
}

function zeroPad(number, length) {
  number = number.toString();
  while (number.length < length) {
    number = '0' + number;
  }
  return number;
}

function convertTimezone(tz) {
  if (tz === 'Z') {
    return 0;
  }
  var m = tz.match(/([+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + (m[3] ? parseInt(m[3], 10) : 0) / 60) * 60;
  }
  return false;
}
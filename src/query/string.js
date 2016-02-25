'use strict'

var SqlString = exports;
var helpers   = require('../helpers')

SqlString.escape = function(val, timeZone) {
  // Cant do require on top of file beacuse Raw is not yet initialized when this file is
  // executed for the first time
  var Raw = require('../raw')

  if (val === null || val === undefined) {
    return 'NULL';
  }

  switch (typeof val) {
    case 'boolean': return (val) ? 'true' : 'false';
    case 'number': return val+'';
  }

  if (val instanceof Date) {
    val = SqlString.dateToString(val, timeZone || 'local');
  }

  if (Buffer.isBuffer(val)) {
    return SqlString.bufferToString(val);
  }

  if (Array.isArray(val)) {
    return SqlString.arrayToList(val, timeZone);
  }

  if (val instanceof Raw) {
    return val;
  }

  if (typeof val === 'object') {
    try {
      val = JSON.stringify(val)
    } catch (e) {
      helpers.warn(e)
      val = val + ''
    }
  }

  val = val.replace(/(\\\?)|[\0\n\r\b\t\\\'\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      case "\\?": return "?";
      case "\'": return "''";
      default: return "\\"+s;
    }
  });
  return "'"+val+"'";
};

SqlString.arrayToList = function(array, timeZone) {
  var self = this;
  return array.map(function(v) {
    if (Array.isArray(v)) return '(' + SqlString.arrayToList(v, timeZone) + ')';
    return self.escape(v, timeZone);
  }).join(', ');
};

SqlString.format = function(sql, values, timeZone) {
  var self = this;
  values = values == null ? [] : [].concat(values);
  var index = 0;
  return sql.replace(/\\?\?/g, function(match) {
    if (match === '\\?') return match;
    if (index === values.length) {
      return match;
    }
    var value = values[index++];
    return self.escape(value, timeZone)
  }).replace('\\?', '?');
};

SqlString.dateToString = function(date, timeZone) {
  var dt = new Date(date);

  if (timeZone !== 'local') {
    var tz = convertTimezone(timeZone);

    dt.setTime(dt.getTime() + (dt.getTimezoneOffset() * 60000));
    if (tz !== false) {
      dt.setTime(dt.getTime() + (tz * 60000));
    }
  }

  var year   = dt.getFullYear();
  var month  = zeroPad(dt.getMonth() + 1, 2);
  var day    = zeroPad(dt.getDate(), 2);
  var hour   = zeroPad(dt.getHours(), 2);
  var minute = zeroPad(dt.getMinutes(), 2);
  var second = zeroPad(dt.getSeconds(), 2);
  var millisecond = zeroPad(dt.getMilliseconds(), 3);

  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + millisecond;
};

SqlString.bufferToString = function bufferToString(buffer) {
  return "X'" + buffer.toString('hex') + "'";
}

function zeroPad(number, length) {
  number = number.toString();
  while (number.length < length) {
    number = '0' + number;
  }

  return number;
}

function convertTimezone(tz) {
  if (tz === "Z") return 0;

  var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
  }
  return false;
}

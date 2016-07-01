import * as helpers from '../helpers';

const SqlString = {};
export { SqlString as default };

SqlString.escape = function(val, timeZone) {
  // Can't do require on top of file because Raw has not yet been initialized
  // when this file is executed for the first time.
  const Raw = require('../raw')

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
      default: return `\\${s}`;
    }
  });
  return `'${val}'`;
};

SqlString.arrayToList = function(array, timeZone) {
  const self = this;
  return array.map(function(v) {
    if (Array.isArray(v)) return `(${SqlString.arrayToList(v, timeZone)})`;
    return self.escape(v, timeZone);
  }).join(', ');
};

SqlString.format = function(sql, values, timeZone) {
  const self = this;
  values = values == null ? [] : [].concat(values);
  let index = 0;
  return sql.replace(/\\?\?/g, function(match) {
    if (match === '\\?') return match;
    if (index === values.length) {
      return match;
    }
    const value = values[index++];
    return self.escape(value, timeZone)
  }).replace('\\?', '?');
};

SqlString.dateToString = function(date, timeZone) {
  const dt = new Date(date);

  if (timeZone !== 'local') {
    const tz = convertTimezone(timeZone);

    dt.setTime(dt.getTime() + (dt.getTimezoneOffset() * 60000));
    if (tz !== false) {
      dt.setTime(dt.getTime() + (tz * 60000));
    }
  }

  const year = dt.getFullYear();
  const month = zeroPad(dt.getMonth() + 1, 2);
  const day = zeroPad(dt.getDate(), 2);
  const hour = zeroPad(dt.getHours(), 2);
  const minute = zeroPad(dt.getMinutes(), 2);
  const second = zeroPad(dt.getSeconds(), 2);
  const millisecond = zeroPad(dt.getMilliseconds(), 3);

  return (
    year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' +
    second + '.' + millisecond
  );
};

SqlString.bufferToString = function bufferToString(buffer) {
  return `X'${buffer.toString('hex')}'`;
}

function zeroPad(number, length) {
  number = number.toString();
  while (number.length < length) {
    number = `0${number}`;
  }

  return number;
}

function convertTimezone(tz) {
  if (tz === "Z") return 0;

  const m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
  if (m) {
    return (
      (m[1] === '-' ? -1 : 1) *
      (parseInt(m[2], 10) +
      ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60
    );
  }
  return false;
}

'use strict';

function dateToString(date) {
  function pad(number, digits) {
    number = number.toString();
    while (number.length < digits) {
      number = "0" + number;
    }
    return number;
  }

  var offset = -date.getTimezoneOffset();
  var ret = pad(date.getFullYear(), 4) + '-' + pad(date.getMonth() + 1, 2) + '-' + pad(date.getDate(), 2) + 'T' + pad(date.getHours(), 2) + ':' + pad(date.getMinutes(), 2) + ':' + pad(date.getSeconds(), 2) + '.' + pad(date.getMilliseconds(), 3);

  if (offset < 0) {
    ret += "-";
    offset *= -1;
  } else {
    ret += "+";
  }

  return ret + pad(Math.floor(offset / 60), 2) + ":" + pad(offset % 60, 2);
}

var prepareObject;
var arrayString;

// converts values from javascript types
// to their 'raw' counterparts for use as a postgres parameter
// note: you can override this function to provide your own conversion mechanism
// for complex types, etc...
var prepareValue = function prepareValue(val, seen, valueForUndefined) {
  if (val instanceof Buffer) {
    return val;
  }
  if (val instanceof Date) {
    return dateToString(val);
  }
  if (Array.isArray(val)) {
    return arrayString(val);
  }
  if (val === null) {
    return null;
  }
  if (val === undefined) {
    return valueForUndefined;
  }
  if (typeof val === 'object') {
    return prepareObject(val, seen);
  }
  return val.toString();
};

prepareObject = function prepareObject(val, seen) {
  if (val && typeof val.toPostgres === 'function') {
    seen = seen || [];
    if (seen.indexOf(val) !== -1) {
      throw new Error('circular reference detected while preparing "' + val + '" for query');
    }
    seen.push(val);

    return prepareValue(val.toPostgres(prepareValue), seen);
  }
  return JSON.stringify(val);
};

// convert a JS array to a postgres array literal
// uses comma separator so won't work for types like box that use
// a different array separator.
arrayString = function arrayString(val) {
  return '{' + val.map(function (elem) {
    if (elem === null || elem === undefined) {
      return 'NULL';
    }
    if (Array.isArray(elem)) {
      return arrayString(elem);
    }
    return JSON.stringify(prepareValue(elem));
  }).join(',') + '}';
};

function normalizeQueryConfig(config, values, callback) {
  //can take in strings or config objects
  config = typeof config === 'string' ? { text: config } : config;
  if (values) {
    if (typeof values === 'function') {
      config.callback = values;
    } else {
      config.values = values;
    }
  }
  if (callback) {
    config.callback = callback;
  }
  return config;
}

module.exports = {
  prepareValue: prepareValue,
  normalizeQueryConfig: normalizeQueryConfig
};
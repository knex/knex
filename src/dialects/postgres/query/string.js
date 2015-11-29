'use strict'

var _ = require('lodash');
var helpers = require('../../../helpers');
var SqlString = _.extend(exports, require('../../../query/string'));

SqlString.escape = function(val, timeZone) {
  if (val == null) {
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

  if (typeof val === 'object') {
    try {
      val = JSON.stringify(val)
    } catch (e) {
      helpers.warn(e)
      val = val + ''
    }
  }

  val = val.replace(/[\0\n\r\b\t\\\'\x1a]/g, function(s) {
    switch(s) {
      case "\0": return "\\0";
      case "\n": return "\\n";
      case "\r": return "\\r";
      case "\b": return "\\b";
      case "\t": return "\\t";
      case "\x1a": return "\\Z";
      case "\'": return "''";
      default: return "\\"+s;
    }
  });
  return "'"+val+"'";
};

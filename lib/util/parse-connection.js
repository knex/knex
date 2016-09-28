'use strict';

exports.__esModule = true;
exports.default = parseConnectionString;

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _pgConnectionString = require('pg-connection-string');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function parseConnectionString(str) {
  var parsed = _url2.default.parse(str);
  var protocol = parsed.protocol;

  if (protocol && protocol.indexOf('maria') === 0) {
    protocol = 'maria';
  }
  if (protocol === null) {
    return {
      client: 'sqlite3',
      connection: {
        filename: str
      }
    };
  }
  if (protocol.slice(-1) === ':') {
    protocol = protocol.slice(0, -1);
  }
  return {
    client: protocol,
    connection: protocol === 'postgres' ? (0, _pgConnectionString.parse)(str) : connectionObject(parsed)
  };
}

function connectionObject(parsed) {
  var connection = {};
  var db = parsed.pathname;
  if (db[0] === '/') {
    db = db.slice(1);
  }
  if (parsed.protocol.indexOf('maria') === 0) {
    connection.db = db;
  } else {
    connection.database = db;
  }
  if (parsed.hostname) {
    if (parsed.protocol.indexOf('mssql') === 0) {
      connection.server = parsed.hostname;
    } else {
      connection.host = parsed.hostname;
    }
  }
  if (parsed.port) {
    connection.port = parsed.port;
  }
  if (parsed.auth) {
    var idx = parsed.auth.indexOf(':');
    if (idx !== -1) {
      connection.user = parsed.auth.slice(0, idx);
      if (idx < parsed.auth.length - 1) {
        connection.password = parsed.auth.slice(idx + 1);
      }
    } else {
      connection.user = parsed.auth;
    }
  }
  return connection;
}
module.exports = exports['default'];
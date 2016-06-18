'use strict';

exports.__esModule = true;
exports['default'] = parseConnectionString;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _pgConnectionString = require('pg-connection-string');

function parseConnectionString(str) {
  var parsed = _url2['default'].parse(str);
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
    connection: protocol === 'postgres' ? _pgConnectionString.parse(str) : connectionObject(parsed)
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
    connection.host = parsed.hostname;
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
    }
  }
  return connection;
}
module.exports = exports['default'];
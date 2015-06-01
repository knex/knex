'use strict';

var url = require('url')
var qs  = require('qs')

module.exports = parseConnectionString;

function parseConnectionString(str) {
  var parsed = url.parse(str);
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
    connection: connectionObject(parsed)
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
  if (parsed.query) {
    var query = qs.parse(parsed.query)
    for (var key in query) {
      connection[key] = cast(query[key])
    }
  }
  return connection;
}

function cast(val) {
  if (val === 'true') return true
  if (val === 'false') return false
  return val
}


import url from 'url'
import { parse as parsePG } from 'pg-connection-string'

export default function parseConnectionString(str) {
  const parsed = url.parse(str)
  let { protocol } = parsed
  if (protocol && protocol.indexOf('maria') === 0) {
    protocol = 'maria'
  }
  if (protocol === null) {
    return {
      client: 'sqlite3',
      connection: {
        filename: str
      }
    }
  }
  if (protocol.slice(-1) === ':') {
    protocol = protocol.slice(0, -1);
  }
  return {
    client: protocol,
    connection: protocol === 'postgres' ? parsePG(str) : connectionObject(parsed)
  }
}

function connectionObject(parsed) {
  const connection = {};
  let db = parsed.pathname;
  if (db[0] === '/') {
    db = db.slice(1)
  }
  if (parsed.protocol.indexOf('maria') === 0) {
    connection.db = db
  } else {
    connection.database = db
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
    const idx = parsed.auth.indexOf(':');
    if (idx !== -1) {
      connection.user = parsed.auth.slice(0, idx);
      if (idx < parsed.auth.length - 1) {
        connection.password = parsed.auth.slice(idx + 1);
      }
    }
  }
  return connection
}

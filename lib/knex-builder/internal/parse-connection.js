const { parse } = require('pg-connection-string');
const parsePG = parse;
const isWindows = process && process.platform && process.platform === 'win32';

/**
 * @param str
 * @returns {URL}
 */
function tryParse(str) {
  try {
    return new URL(str);
  } catch (e) {
    return null;
  }
}

module.exports = function parseConnectionString(str) {
  const parsed = tryParse(str);
  const isDriveLetter = isWindows && parsed && parsed.protocol.length === 2;
  if (!parsed || isDriveLetter) {
    return {
      client: 'sqlite3',
      connection: {
        filename: str,
      },
    };
  }
  let { protocol } = parsed;
  if (protocol.slice(-1) === ':') {
    protocol = protocol.slice(0, -1);
  }

  const isPG = ['postgresql', 'postgres'].includes(protocol);

  return {
    client: protocol,
    connection: isPG ? parsePG(str) : connectionObject(parsed),
  };
};

/**
 * @param {URL} parsed
 * @returns {{}}
 */
function connectionObject(parsed) {
  const connection = {};
  let db = parsed.pathname;
  if (db[0] === '/') {
    db = db.slice(1);
  }

  connection.database = db;

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
  if (parsed.username || parsed.password) {
    connection.user = decodeURIComponent(parsed.username);
  }
  if (parsed.password) {
    connection.password = decodeURIComponent(parsed.password);
  }
  if (parsed.searchParams) {
    for (const [key, value] of parsed.searchParams.entries()) {
      const isMySQLLike = ['mysql:', 'mariadb:'].includes(parsed.protocol);
      if (isMySQLLike) {
        try {
          connection[key] = JSON.parse(value);
        } catch (err) {
          connection[key] = value;
        }
      } else {
        connection[key] = value;
      }
    }
  }
  return connection;
}

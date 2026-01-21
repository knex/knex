const _debugQuery = require('debug')('knex:query');
const debugBindings = require('debug')('knex:bindings');
const debugQuery = (sql, txId) => _debugQuery(sql.replace(/%/g, '%%'), txId);
const { isString } = require('../../util/is');
const { tracker } = require('../../util/connection-tracker');

function formatQuery(sql, bindings, timeZone, client) {
  bindings = bindings == null ? [] : [].concat(bindings);
  let index = 0;
  return sql.replace(/\\?\?/g, (match) => {
    if (match === '\\?') {
      return '?';
    }
    if (index === bindings.length) {
      return match;
    }
    const value = bindings[index++];
    return client._escapeBinding(value, { timeZone });
  });
}

function enrichQueryObject(connection, queryParam, client) {
  const queryObject = isString(queryParam) ? { sql: queryParam } : queryParam;

  queryObject.bindings = client.prepBindings(queryObject.bindings);
  queryObject.sql = client.positionBindings(queryObject.sql);

  const taggedObj = tracker.withIds(connection, queryObject);

  client.emit('query', taggedObj);
  debugQuery(queryObject.sql, taggedObj.__knexTxId);
  debugBindings(queryObject.bindings, taggedObj.__knexTxId);

  return queryObject;
}

function executeQuery(connection, queryObject, client) {
  return client._query(connection, queryObject).catch((err) => {
    if (client.config && client.config.compileSqlOnError === false) {
      err.message = queryObject.sql + ' - ' + err.message;
    } else {
      err.message =
        formatQuery(queryObject.sql, queryObject.bindings, undefined, client) +
        ' - ' +
        err.message;
    }
    const taggedObj = tracker.withIds(connection, queryObject);
    client.emit('query-error', err, taggedObj);
    throw err;
  });
}

module.exports = {
  enrichQueryObject,
  executeQuery,
  formatQuery,
};

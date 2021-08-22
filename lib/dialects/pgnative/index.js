// PostgreSQL Native Driver (pg-native)
// -------
const Client_PG = require('../postgres');

class Client_PgNative extends Client_PG {
  _driver() {
    return require('pg').native;
  }

  _stream(connection, obj, stream, options) {
    if (!obj.sql) throw new Error('The query is empty');

    const client = this;
    return new Promise((resolver, rejecter) => {
      stream.on('error', rejecter);
      stream.on('end', resolver);

      return client
        ._query(connection, obj)
        .then((obj) => obj.response)
        .then(({ rows }) => rows.forEach((row) => stream.write(row)))
        .catch(function (err) {
          stream.emit('error', err);
        })
        .then(function () {
          stream.end();
        });
    });
  }
}

Object.assign(Client_PgNative.prototype, {
  driverName: 'pgnative',
  canCancelQuery: true,
});

module.exports = Client_PgNative;

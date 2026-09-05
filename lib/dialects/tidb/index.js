// TiDB Client
// -------
const Client_MySQL2 = require('../mysql2');

class Client_TiDB extends Client_MySQL2 {
  // No overrides — inherits all behavior from mysql2
}

Object.assign(Client_TiDB.prototype, {
  driverName: 'tidb',
});

module.exports = Client_TiDB;

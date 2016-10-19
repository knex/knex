
// MySQL2 Client
// -------
import inherits from 'inherits';
import Client_MySQL from '../mysql';
import Promise from 'bluebird';
import { pick, assign } from 'lodash'

const configOptions = [
  'isServer',
  'stream',
  'host',
  'port',
  'localAddress',
  'socketPath',
  'user',
  'password',
  'passwordSha1',
  'database',
  'connectTimeout',
  'insecureAuth',
  'supportBigNumbers',
  'bigNumberStrings',
  'decimalNumbers',
  'dateStrings',
  'debug',
  'trace',
  'stringifyObjects',
  'timezone',
  'flags',
  'queryFormat',
  'pool',
  'ssl',
  'multipleStatements',
  'namedPlaceholders',
  'typeCast',
  'charsetNumber',
  'compress'
];

// Always initialize with the "QueryBuilder" and "QueryCompiler"
// objects, which extend the base 'lib/query/builder' and
// 'lib/query/compiler', respectively.
function Client_MySQL2(config) {
  Client_MySQL.call(this, config)
}
inherits(Client_MySQL2, Client_MySQL)

assign(Client_MySQL2.prototype, {

  // The "dialect", for reference elsewhere.
  driverName: 'mysql2',

  _driver() {
    return require('mysql2')
  },

  validateConnection() {
    return true
  },

  _isTransactionError(err) {
    return err.code === 'ER_SP_DOES_NOT_EXIST'
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const connection = this.driver.createConnection(pick(this.connectionSettings, configOptions))
    return new Promise((resolver, rejecter) => {
      connection.connect((err) => {
        if (err) {
          return rejecter(err)
        }
        connection.on('error', err => {
          connection.__knex__disposed = err
        })
        resolver(connection)
      })
    })
  }

})

export default Client_MySQL2;

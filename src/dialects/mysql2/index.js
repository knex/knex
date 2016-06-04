
// MySQL2 Client
// -------
import inherits from 'inherits';
import Client_MySQL from '../mysql';
import Promise from '../../promise';
import * as helpers from '../../helpers';
import { pick, map, assign } from 'lodash'
import Transaction from './transaction';

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

  Transaction,

  _driver() {
    return require('mysql2')
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const client = this;
    const connection = this.driver.createConnection(pick(this.connectionSettings, configOptions))
    return new Promise(function(resolver, rejecter) {
      connection.connect(function(err) {
        if (err) return rejecter(err)
        connection.on('error', client._connectionErrorHandler.bind(null, client, connection))
        resolver(connection)
      })
    })
  },

  processResponse(obj, runner) {
    const { response } = obj
    const { method } = obj
    const rows = response[0]
    const fields = response[1]
    if (obj.output) return obj.output.call(runner, rows, fields)
    switch (method) {
      case 'select':
      case 'pluck':
      case 'first': {
        const resp = helpers.skim(rows)
        if (method === 'pluck') return map(resp, obj.pluck)
        return method === 'first' ? resp[0] : resp
      }
      case 'insert':
        return [rows.insertId]
      case 'del':
      case 'update':
      case 'counter':
        return rows.affectedRows
      default:
        return response
    }
  },

  ping(resource, callback) {
    resource.query('SELECT 1', callback);
  }

})

export default Client_MySQL2;

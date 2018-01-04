
// MySQL2 Client
// -------
import inherits from 'inherits';
import Client_MySQL from '../mysql';
import Promise from 'bluebird';
import * as helpers from '../../helpers';
import { map, assign } from 'lodash'
import Transaction from './transaction';

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

  transaction() {
    return new Transaction(this, ...arguments)
  },

  _driver() {
    return require('mysql2')
  },

  validateConnection(connection) {
    if(connection._fatalError) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  },

  // Get a raw connection, called by the `pool` whenever a new
  // connection needs to be added to the pool.
  acquireRawConnection() {
    const connection = this.driver.createConnection(this.connectionSettings)
    connection.on('error', err => {
      connection.__knex__disposed = err
    })
    return new Promise((resolver, rejecter) => {
      connection.connect((err) => {
        if (err) {
          return rejecter(err)
        }
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
  }

})

export default Client_MySQL2;

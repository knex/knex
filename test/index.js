/*eslint-env mocha*/
/*eslint no-var:0, max-len:0 */

'use strict';

require('babel-register')
require('source-map-support').install();

process.on('unhandledRejection', function (err) {
  console.log('Unhandled: \n' + err.stack)
})

global.d = new Date();

var Promise = require('bluebird');
Promise.longStackTraces();

describe('Query Building Tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  require('./unit/query/builder')
  require('./unit/schema/mysql')('mysql')
  require('./unit/schema/mysql')('maria')
  require('./unit/schema/mysql')('mysql2')
  require('./unit/schema/postgres')
  require('./unit/schema/sqlite3')
  require('./unit/schema/oracle')
  require('./unit/schema/mssql')
  require('./unit/schema/oracledb')
})

describe('Integration Tests', function() {
  this.timeout(process.env.KNEX_TEST_TIMEOUT || 5000);
  require('./integration')
})

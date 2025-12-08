/*eslint no-var:0*/
'use strict';
require('../util/chai-setup');
const tape = require('tape');
const makeKnex = require('../../knex');
const knexfile = require('../knexfile');
const { prepDB } = require('../prep-db');

require('./parse-connection');
require('./raw');
require('./query-builder');
require('./seed');
require('./migrate');
require('./pool');
require('./knex');
require('./invalid-db-setup')(knexfile);

(async () => {
  for (const key of Object.keys(knexfile)) {
    const knex = makeKnex(knexfile[key]);

    await prepDB(knex);

    require('./transactions')(knex);
    require('./stream')(knex);
    require('./crossdb-compatibility')(knex);

    // Tear down the knex connection
    tape(knex.client.driverName + ' - transactions: after', function (t) {
      knex.destroy(function () {
        t.pass('Knex client destroyed');
        t.end();
      });
    });
  }
})();

'use strict';

const { getAllDbs } = require('../../integration2/util/knex-instance-provider');
const bigintTests = require('./bigint');

getAllDbs().forEach((db) => {
  describe(`${db} - Bigint`, () => {
    bigintTests(db);
  });
});

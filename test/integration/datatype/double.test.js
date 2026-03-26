'use strict';

const { getAllDbs } = require('../../integration2/util/knex-instance-provider');
const doubleTests = require('./double');

getAllDbs().forEach((db) => {
  describe(`${db} - Double`, () => {
    doubleTests(db);
  });
});

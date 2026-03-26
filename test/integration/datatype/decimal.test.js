'use strict';

const { getAllDbs } = require('../../integration2/util/knex-instance-provider');
const decimalTests = require('./decimal');

getAllDbs().forEach((db) => {
  describe(`${db} - Decimal`, () => {
    decimalTests(db);
  });
});

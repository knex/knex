#!/usr/bin/env jake
'use strict';
/* eslint-disable no-undef */

const path = require('path');
const {
  assertExecError,
  test,
} = require('../../jake-util/helpers/migration-test-helper');
const { assert } = require('chai');

const KNEX = path.normalize(__dirname + '/../../../bin/cli.js');

const taskList = [];
/* * * TESTS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

test(taskList, 'Handles seeding errors correctly', (temp) => {
  return assertExecError(
    `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-error-knexfile.js --knexpath=../knex.js`
  ).then((err) => {
    assert.include(err, 'Error while executing');
    assert.include(err, 'seeds.js');
    assert.include(err, 'Boom');
  });
});

module.exports = {
  taskList,
};

#!/usr/bin/env jake
'use strict';
/* eslint-disable no-undef */

const path = require('path');
const {
  assertExec,
  assertExecError,
  test,
} = require('../../jake-util/helpers/migration-test-helper');
const { assert } = require('chai');

const KNEX = path.normalize(__dirname + '/../../../bin/cli.js');

const taskList = [];
/* * * TESTS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

test(taskList, 'seed:run prints non verbose logs', (temp) => {
  return assertExec(
    `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --knexpath=../knex.js`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Ran 2 seed files');
    assert.notInclude(stdout, 'first.js');
    assert.notInclude(stdout, 'second.js');
  });
});

test(taskList, 'seed:run prints verbose logs', (temp) => {
  return assertExec(
    `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --knexpath=../knex.js --verbose`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Ran 2 seed files');
    assert.include(stdout, 'first.js');
    assert.include(stdout, 'second.js');
  });
});

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

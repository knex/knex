#!/usr/bin/env jake
'use strict';
/* eslint-disable no-undef */
/* eslint-disable no-console */

const path = require('path');
const {
  assertExec,
  test,
} = require('../jake-util/helpers/migrationtesthelper');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

const taskList = [];
/* * * TESTS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

test(taskList, 'Run migrations with knexfile passed', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:latest --knexfile=../test/jake-util/knexfile/knexfile.js`
  );
});

task('default', taskList);

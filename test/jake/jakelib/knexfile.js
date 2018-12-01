#!/usr/bin/env jake
'use strict';
/* eslint-disable no-undef */
/* eslint-disable no-console */

const path = require('path');
const {
  assertExec,
  test,
} = require('../../jake-util/helpers/migrationtesthelper');

const KNEX = path.normalize(__dirname + '/../../../bin/cli.js');

const taskList = [];
/* * * TESTS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

test(taskList, 'Run migrations with knexfile passed', (temp) => {
  console.log(`process ${process.cwd()} dir ${__dirname}`);
  return assertExec(
    `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`
  );
});

test(taskList, 'resolves knexfile correctly with cwd specified', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile --knexfile=knexfile.js`
  );
});

//task('default', taskList);

module.exports = {
  taskList,
};

#!/usr/bin/env jake
'use strict';
/* eslint-disable no-undef */
/* eslint-disable no-console */

const path = require('path');
const {
  assertExec,
  assertExecError,
  test,
} = require('../../jake-util/helpers/migration-test-helper');
const { assert } = require('chai');
const fs = require('fs');
const rimraf = require('rimraf');

const KNEX = path.normalize(__dirname + '/../../../bin/cli.js');

const taskList = [];
/* * * TESTS * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

test(taskList, 'Run migrations with knexfile passed', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`
  );
});

test(taskList, 'Resolves migrations relatively to knexfile', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-relative/knexfile.js --knexpath=../knex.js`
  );
});

test(taskList, 'Throws informative error when no knexfile is found', (temp) => {
  return assertExecError(
    `node ${KNEX} migrate:latest --knexpath=../knex.js`
  ).then((err) => {
    assert.include(err, 'No default configuration file');
  });
});

test(
  taskList,
  'Resolves default knexfile in working directory correctly',
  (temp) => {
    const path = process.cwd() + '/knexfile.js';
    let error;
    fs.writeFileSync(
      path,
      `
module.exports = {
  client: 'sqlite3',
  connection: {
    filename: __dirname + '/test/jake-util/test.sqlite3',
  },
  migrations: {
    directory: __dirname + '/test//jake-util/knexfile_migrations',
  },
};    
    `
    );
    return assertExec(`node ${KNEX} migrate:latest --knexpath=../knex.js`)
      .catch((err) => {
        error = err;
      })
      .then(() => {
        rimraf.sync(path);
        if (error) {
          throw error;
        }
      });
  }
);

test(taskList, 'resolves knexfile correctly with cwd specified', (temp) => {
  return assertExec(
    `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile --knexfile=knexfile.js`
  );
});

module.exports = {
  taskList,
};

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

test(
  taskList,
  "seed:make's --subdirectory specifies the destination directory",
  (temp) => {
    return assertExec(
      `node ${KNEX} seed:make --subdirectory=test --knexfile=test/jake-util/seeds-knexfile-multiple-seeds.js --knexpath=../knex.js a-new-seed-file`
    )
      .then(({ stdout }) => {
        assert.include(
          stdout,
          `Created seed file: ${process.cwd()}/test/jake-util/seeds-in-subdirs/test/a-new-seed-file`
        );
      })
      .then(() => {
        return assertExec(
          `ls ${process.cwd()}/test/jake-util/seeds-in-subdirs/test/a-new-seed-file.js`
        ).then(({ stdout }) => {
          assert.include(stdout, 'a-new-seed-file.js');
        });
      });
  }
);

test(
  taskList,
  "seed:make's subdirectory may be bundled with the seed name",
  (temp) => {
    return assertExec(
      `node ${KNEX} seed:make --knexfile=test/jake-util/seeds-knexfile-multiple-seeds.js --knexpath=../knex.js test/an-interesting-new-seed-file`
    )
      .then(({ stdout }) => {
        assert.include(
          stdout,
          `Created seed file: ${process.cwd()}/test/jake-util/seeds-in-subdirs/test/an-interesting-new-seed-file`
        );
      })
      .then(() => {
        return assertExec(
          `ls ${process.cwd()}/test/jake-util/seeds-in-subdirs/test/an-interesting-new-seed-file.js`
        ).then(({ stdout }) => {
          assert.include(stdout, 'an-interesting-new-seed-file.js');
        });
      });
  }
);

test(
  taskList,
  "seed:make's --subdirectory is optional when config.directory is a list with one item",
  (temp) => {
    return assertExec(
      `node ${KNEX} seed:make --knexfile=test/jake-util/seeds-knexfile-list-with-one-directory.js --knexpath=../knex.js a-new-seed-file`
    )
      .then(({ stdout }) => {
        assert.include(
          stdout,
          `Created seed file: ${process.cwd()}/test/jake-util/seeds-in-subdirs/production/a-new-seed-file`
        );
      })
      .then(() => {
        return assertExec(
          `ls ${process.cwd()}/test/jake-util/seeds-in-subdirs/production/a-new-seed-file.js`
        ).then(({ stdout }) => {
          assert.include(stdout, 'a-new-seed-file.js');
        });
      });
  }
);

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

test(taskList, 'seed:run runs specific file', () => {
  return assertExec(
    `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --knexpath=../knex.js --specific=second.js`
  ).then(({ stdout }) => {
    assert.include(stdout, 'Ran 1 seed files');
    assert.notInclude(stdout, 'first.js');
    assert.notInclude(stdout, 'second.js');
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

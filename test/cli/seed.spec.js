'use strict';

const path = require('path');
const { execCommand } = require('cli-testlab');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('seed:run', () => {
  before(() => {
    process.env.KNEX_PATH = '../knex.js';
  });

  it('prints non verbose logs', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js`,
      {
        expectedOutput: 'Ran 2 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('find files not recursively by default', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-directories.js`,
      {
        expectedOutput: 'Ran 2 seed files',
        notExpectedOutput: ['before-second.js', 'second.js'],
      }
    );
  });

  it('find files recursively if option is set', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-directories-recursive.js`,
      {
        expectedOutput: 'Ran 3 seed files',
        notExpectedOutput: ['first.js', 'second.js', 'before-second.js'],
      }
    );
  });

  it('find files not recursively by default and print verbose logs', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-directories.js --verbose`,
      {
        expectedOutput: ['Ran 2 seed files', 'before-second.js', 'second.js'],
      }
    );
  });

  it('find recursively files if option recursive is set and print verbose logs', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-directories-recursive.js --verbose`,
      {
        expectedOutput: [
          'Ran 3 seed files',
          'first.js',
          'second.js',
          'before-second.js',
        ],
      }
    );
  });

  it('supports async configuration', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-async.js`,
      {
        expectedOutput: 'Ran 2 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('prints verbose logs', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --verbose`,
      {
        expectedOutput: ['Ran 2 seed files', 'first.js', 'second.js'],
      }
    );
  });

  it('runs specific file', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile.js --specific=second.js`,
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('runs specific file in a recursive folder', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-knexfile-directories.js --specific=second.js`,
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('handles seeding errors correctly', () => {
    return execCommand(
      `node ${KNEX} seed:run --knexfile=test/jake-util/seeds-error-knexfile.js`,
      {
        expectedErrorMessage: ['Error while executing', 'seeds.js', 'Boom'],
      }
    );
  });

  it('runs "esm" files', async () => {
    const cwd = path.resolve(__dirname, '../jake-util/knexfile-esm');
    const { Database } = new require('sqlite3');
    const db = new Database(path.resolve(cwd, 'test.sqlite3'));
    await new Promise((resolve, reject) =>
      db.exec(`create TABLE if not exists xyz (name TEXT);`, (err) => {
        if (err) reject(err);
        else resolve();
      })
    );
    await new Promise((resolve) => db.close(() => resolve()));
    return execCommand(
      [
        `node ${KNEX}`,
        'seed:run',
        '--esm',
        `--cwd=${cwd}`,
        `--knexfile=./knexfile.js`,
      ].join(' '),
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('runs "esm" files from "module"', async () => {
    const cwd = path.resolve(__dirname, '../jake-util/knexfile-esm-module');
    const { Database } = new require('sqlite3');
    const db = new Database(path.resolve(cwd, 'test.sqlite3'));
    await new Promise((resolve, reject) =>
      db.exec(`create TABLE if not exists xyz (name TEXT);`, (err) => {
        if (err) reject(err);
        else resolve();
      })
    );
    await new Promise((resolve) => db.close(() => resolve()));
    return execCommand(
      [
        `node ${KNEX}`,
        `--cwd=${cwd}`,
        '--esm',
        'seed:run',
        '--knexfile=./knexfile.js',
      ].join(' '),
      {
        expectedOutput: 'Ran 1 seed files',
        notExpectedOutput: ['first.js', 'second.js'],
      }
    );
  });

  it('throws when runs "esm" files from "module" without --esm flag', () => {
    const cwd = path.resolve(__dirname, '../jake-util/knexfile-esm-module');
    const version = Number((/v(\d+)/i.exec(process.version) || [])[1]);
    return execCommand(
      [
        `node ${KNEX}`,
        ` --cwd=${cwd}`,
        ' seed:run',
        '--knexfile=./knexfile.js',
      ].join(' '),
      {
        expectedErrorMessage:
          version === 10
            ? 'Unexpected token export'
            : 'Must use import to load ES Module',
      }
    );
  });
});

it('runs mjs files', async () => {
  const cwd = path.resolve(__dirname, '../jake-util/knexfile-mjs');
  const { Database } = new require('sqlite3');
  const db = new Database(path.resolve(cwd, 'test.sqlite3'));
  await new Promise((resolve, reject) =>
    db.exec(`create TABLE if not exists xyz (name TEXT);`, (err) => {
      if (err) reject(err);
      else resolve();
    })
  );
  await new Promise((resolve) => db.close(() => resolve()));
  const version = Number((/v(\d+)/i.exec(process.version) || [])[1]);
  return execCommand(
    [
      `node`,
      // TODO: document this !
      version === 10 && '--experimental-modules',
      version === 10 && '--no-warnings',
      `${KNEX}`,
      // TODO: document this !
      version === 10 && `--esm`,
      `--cwd=${cwd}`,
      'seed:run',
      '--knexfile=./knexfile.mjs',
    ]
      .filter(Boolean)
      .join(' '),
    {
      expectedOutput: 'Ran 1 seed files',
    }
  );
});

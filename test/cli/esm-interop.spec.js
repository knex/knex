'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execCommand } = require('cli-testlab');
const sqlite3 = require('sqlite3');
const KNEX = path.normalize(__dirname + '/../../bin/cli.js');
const NODE_VERSION = Number((/v(\d+)/i.exec(process.version) || [])[1]);
const isNode10 = NODE_VERSION === 10;
const TEST_BASE = '../test/jake-util';

const fixture = [
  /** MIGRATIONS */
  {
    title: 'migrates esm modules',
    testCase: 'knexfile-esm',
    knexArgs: ['migrate:latest', '--esm'],
    dropDb: true,
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
  },
  {
    title: 'migrates esm modules from a module',
    testCase: 'knexfile-esm-module',
    knexArgs: ['migrate:latest', '--esm'],
    expectedOutput: 'Batch 1 run: 1 migrations',
    dropDb: true,
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
  },
  {
    title: 'migrate esm module without --esm flag from a module, throws error',
    testCase: 'knexfile-esm-module',
    knexArgs: ['migrate:latest'],
    dropDb: true,
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedErrorMessage: isNode10
      ? 'Unexpected token export'
      : 'Must use import to load ES Module',
    expectedSchema: [],
  },
  {
    title: 'migrates mjs modules',
    testCase: 'knexfile-mjs',
    knexfile: 'knexfile.mjs',
    nodeArgs: [
      // TODO: document this !
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: [
      'migrate:latest',
      // TODO: document this !
      isNode10 && `--esm`,
    ],
    dropDb: true,
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
  },
  /** SEEDS */
  {
    title: 'seeds esm files',
    testCase: 'knexfile-esm',
    expectedOutput: 'Ran 1 seed files',
    knexArgs: ['seed:run', '--esm'],
    dropDb: true,
    /** before assert */
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: 'seeds esm files from module',
    testCase: 'knexfile-esm-module',
    expectedOutput: 'Ran 1 seed files',
    knexArgs: ['seed:run', '--esm'],
    /** before assert */
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
    dropDb: true,
  },
  {
    title: 'seed throws when runs "esm" files from "module" without --esm flag',
    testCase: 'knexfile-esm-module',
    knexArgs: ['seed:run'],
    expectedErrorMessage: isNode10
      ? 'Unexpected token export'
      : 'Must use import to load ES Module',
    dropDb: false,
  },
  {
    title: 'seeds mjs files',
    testCase: 'knexfile-mjs',
    knexfile: 'knexfile.mjs',
    nodeArgs: [
      // TODO: document this !
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: [
      'seed:run',
      // TODO: document this !
      isNode10 && `--esm`,
    ],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    /** before assert */
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  /** SPECIAL CASES */
  {
    title: 'mjs files with mjs top level imports',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile.mjs',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', isNode10 && `--esm`],
    dropDb: true,
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
  },
  {
    title:
      'Directory import is not supported, resolving ES modules imported from knexfile.mjs',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile1.mjs',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', isNode10 && `--esm`],
    expectedErrorMessage: isNode10
      ? 'Error: Cannot find module'
      : `Error [ERR_UNSUPPORTED_DIR_IMPORT]`,
  },
  {
    title: 'dynamic importing js file from NON module package is not supported',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile2.mjs',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', isNode10 && `--esm`],
    expectedErrorMessage: isNode10
      ? 'Error: Cannot load module from .mjs'
      : "Unexpected token 'export'",
  },
  {
    title: isNode10
      ? "NODE10 can't static impor js from .mjs"
      : 'static importing js file from NON module package is not supported',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile2.mjs',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', isNode10 && `--esm`],
    expectedErrorMessage: isNode10
      ? 'Error: Cannot load module from .mjs'
      : "Unexpected token 'export'",
  },
  {
    //Example:  external module.type='module' by url 'packane-name/index.js'
    title: isNode10
      ? "NODE10 can't dynamically import external ESM module package by URL"
      : 'can dynamically import external ESM module package by URL',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile4.mjs',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', isNode10 && `--esm`],
    expectedErrorMessage: isNode10 && 'Error: Cannot load module from .mjs',
    expectedOutput: !isNode10 && 'Batch 1 run: 1 migrations',
    expectedSchema: !isNode10 && [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
  {
    title: isNode10
      ? "NODE10 can't create require"
      : 'Importing commonjs from a mjs module',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile5.mjs',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', isNode10 && `--esm`],
    expectedErrorMessage:
      isNode10 && 'TypeError: module.createRequire is not a function',
    expectedOutput: !isNode10 && 'Batch 1 run: 1 migrations',
    expectedSchema: !isNode10 && [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
  {
    title: 'Importing commonjs from a js ESM module and --esm interop',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile6.js',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', `--esm`],
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
  {
    title: 'Importing js ESM from js ESM with --esm interop',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile7.js',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', `--esm`],
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
  {
    title: 'Dynamic importing js ESM from js ESM with --esm interop',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile8.js',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', `--esm`],
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
  {
    title: 'Static top level cjs import from js ESM with --esm interop',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile9.js',
    nodeArgs: [
      isNode10 && '--experimental-modules',
      isNode10 && '--no-warnings',
    ],
    knexArgs: ['migrate:latest', `--esm`],
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
];

describe('esm interop and mjs support', () => {
  before(() => {
    process.env.KNEX_PATH = '../knex.js';
  });

  for (const spec of fixture) {
    it(spec.title, async function () {
      const {
        testCase,
        knexfile = 'knexfile.js',
        dbName = 'test.sqlite3',
        nodeArgs = [],
        knexArgs,
        expectedOutput,
        expectedSchema,
        expectedErrorMessage,
        before,
        dropDb = false,
      } = spec;
      const cwd = path.resolve(path.dirname(KNEX), TEST_BASE, testCase);
      const dbPath = path.resolve(cwd, dbName);
      // ...
      const cmd = [
        `node`,
        ...nodeArgs,
        KNEX,
        ...knexArgs,
        `--cwd="${cwd}"`,
        `--knexfile=${path.resolve(cwd, knexfile)}`,
        `--knexpath=${KNEX}`,
      ]
        .filter(Boolean)
        .join(' ');
      // ...
      if (dropDb && fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      // ...
      if (before) {
        await before({
          ...spec,
          cmd,
          cwd,
          testCase,
          knexfile,
          dbName,
          dbPath,
          nodeArgs,
          knexArgs,
          expectedOutput,
          expectedSchema,
          expectedErrorMessage,
        });
      }
      // ...
      await execCommand(cmd, { expectedOutput, expectedErrorMessage });
      // ...
      if (expectedSchema) {
        const db = new sqlite3.Database(dbPath);
        const result = await getSchema(db);
        await closeDB(db);
        // migration performed
        assert.deepEqual(
          result.map(({ name }) => name),
          expectedSchema
        );
      }
    });
  }
});

function createTable(db, ddl) {
  return new Promise((resolve, reject) =>
    db.exec(`create TABLE if not exists ${ddl};`, (err) => {
      if (err) reject(err);
      else resolve();
    })
  );
}

function getSchema(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT name from SQLITE_MASTER', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function closeDB(db) {
  return new Promise((resolve, reject) =>
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    })
  );
}

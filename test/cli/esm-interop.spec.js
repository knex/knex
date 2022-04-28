'use strict';
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execCommand } = require('cli-testlab');
const sqlite3 = require('sqlite3');
const semver = require('semver');
const { createTable } = require('./cli-test-utils');
const KNEX = path.normalize(__dirname + '/../../bin/cli.js');
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
    knexArgs: ['migrate:latest'],
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
    title: 'migrate esm module without --esm flag from a module',
    testCase: 'knexfile-esm-module',
    knexArgs: ['migrate:latest'],
    dropDb: true,
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
  },
  {
    title: 'migrates mjs modules',
    testCase: 'knexfile-mjs',
    knexfile: 'knexfile.mjs',
    knexArgs: ['migrate:latest'],
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

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: 'seeds esm files from module',
    testCase: 'knexfile-esm-module',
    expectedOutput: 'Ran 1 seed files',
    knexArgs: ['seed:run'],

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
    dropDb: true,
  },
  {
    title: 'seeds esm files from module without --esm flag',
    testCase: 'knexfile-esm-module',
    expectedOutput: 'Ran 1 seed files',
    knexArgs: ['seed:run'],

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
    dropDb: true,
  },
  {
    title: 'seeds mjs files',
    testCase: 'knexfile-mjs',
    knexfile: 'knexfile.mjs',
    knexArgs: ['seed:run'],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,

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
    knexArgs: ['migrate:latest'],
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
    knexArgs: ['migrate:latest'],
    expectedErrorMessage: `Error [ERR_UNSUPPORTED_DIR_IMPORT]`,
  },
  {
    title: 'dynamic importing js file from NON module package is not supported',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile2.mjs',
    knexArgs: ['migrate:latest'],
    expectedErrorMessage: semver.eq(process.version, 'v14.13.0')
      ? 'Unexpected export statement in CJS module'
      : semver.gte(process.version, 'v14.14.0')
      ? 'Warning: To load an ES module, set "type": "module" in the package.json or use the .mjs extension.'
      : "Unexpected token 'export'",
  },
  {
    title: 'static importing js file from NON module package is not supported',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile2.mjs',
    knexArgs: ['migrate:latest'],
    expectedErrorMessage: semver.eq(process.version, 'v14.13.0')
      ? 'Unexpected export statement in CJS module'
      : semver.gte(process.version, 'v14.14.0')
      ? 'Warning: To load an ES module, set "type": "module" in the package.json or use the .mjs extension.'
      : "Unexpected token 'export'",
  },
  {
    //Example:  external module.type='module' by url 'packane-name/index.js'
    title: 'can dynamically import external ESM module package by URL',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile4.mjs',
    knexArgs: ['migrate:latest'],
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
    title: 'Importing commonjs from a mjs module',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile5.mjs',
    knexArgs: ['migrate:latest'],
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
    title: 'Importing commonjs from a js ESM module and --esm interop',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile6.js',
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
    title: 'Dynamic ESM js import from commonjs/js with esm migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile10.js',
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
    title: 'Imports commonjs/cjs provides js/esm migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile11.js',
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
    title: 'Imports commonjs/cjs provides cjs migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile11.js',
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
    title: 'cjs knexfile Imports commonjs/cjs provides cjs migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile12.cjs',
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
    title: 'cjs knexfile Imports commonjs/js provides js migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile13.cjs',
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
    title: 'cjs knexfile provides esm migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile14.cjs',
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
    title: 'cjs knexfile provides mjs migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile15.cjs',
    knexArgs: ['migrate:latest', '--esm'],
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
    title: 'mjs knexfile provides cjs migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile16.mjs',
    knexArgs: ['migrate:latest'],
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
    /**
     * This is Standard NODEJS resolution
     *  */
    title: 'mjs knexfile provides ESM/js migrations #1',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile17.mjs',
    knexArgs: ['migrate:latest'],
    /**
     * Migration DOESN'T RUN?, files aren't found
     * config.migrations.loadExtensions defaults to ['.mjs']
     */
    expectedOutput: 'Already up to date',
    /** confirmation, migration didn't run */
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
    ], //schema is default knex schema
    dropDb: true,
  },
  {
    /**
     * This is Standard NODEJS resolution
     * even with the 'esm' module loader, AKA --esm
     * no 'esm' involved, knexfile.mjs is navite/'imported'
     */
    title: 'mjs knexfile provides ESM/js migrations #2',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile17.mjs',
    knexArgs: ['migrate:latest'],
    /**
     * Migration DOESN'T RUN, files aren't found
     * config.migrations.loadExtensions defaults to ['.mjs']
     */
    expectedOutput: 'Already up to date',
    /** confirmation, migration didn't run */
    expectedSchema: [
      //schema is default knex schema
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
    ],
    dropDb: true,
  },
  {
    title: 'mjs knexfile provides ESM/js migrations if .js in loadExtensions',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile18.mjs',
    knexArgs: ['migrate:latest', '--esm'],
    dropDb: true,
  },
  {
    title:
      "mjs knexfile CAN'T provide ESM/js migrations if .js in loadExtensions without --esm",
    testCase: 'knexfile-imports',
    knexfile: 'knexfile18.mjs',
    knexArgs: ['migrate:latest'],
    // Fails on NODE 12 & 14
    expectedErrorMessage: "Unexpected token 'export'",
    dropDb: true,
  },
  {
    title: 'ESM/js knexfile provides cjs migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile19.js',
    knexArgs: ['migrate:latest', '--esm'],
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
    title: 'ESM/js knexfile provides mjs migrations',
    testCase: 'knexfile-imports',
    knexfile: 'knexfile20.js',
    knexArgs: ['migrate:latest', '--esm'],
    expectedOutput: 'Batch 1 run: 1 migrations',
    expectedSchema: [
      'knex_migrations',
      'sqlite_sequence',
      'knex_migrations_lock',
      'xyz',
    ],
    dropDb: true,
  },
  /**
   * Seed tests for the above cases
   */
  {
    title: `Seeds knexfile20.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile20.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile19.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile19.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile18.mjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile18.mjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile17.mjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile17.mjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile16.mjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile16.mjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile15.cjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile15.cjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile14.cjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile14.cjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile13.cjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile13.cjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile12.cjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile12.cjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile11.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile11.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile10.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile10.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile9.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile9.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,

    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile8.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile8.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile7.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile7.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    title: `Seeds knexfile6.js`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile6.js',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    // This case failure on Node10 is already documented
    title: `Seeds knexfile5.mjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile5.mjs',
    knexArgs: ['seed:run', `--esm`],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
  {
    // This case failure on Node10 is already documented
    title: `Seeds knexfile4.mjs`,
    testCase: 'knexfile-imports',
    knexfile: 'knexfile4.mjs',
    knexArgs: ['seed:run'],
    expectedOutput: 'Ran 1 seed files',
    dropDb: true,
    before: async ({ dbPath }) => {
      const db = new sqlite3.Database(dbPath);
      await createTable(db, `xyz (name TEXT)`);
    },
  },
].filter(Boolean);

describe('esm interop and mjs support', () => {
  before(() => {
    process.env.KNEX_PATH = '../knex.js';
  });

  for (const spec of fixture) {
    it(spec.title, async function () {
      // This whole suite got broken in this version
      if (semver.gte(process.version, 'v16.6.0')) {
        return this.skip();
      }

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

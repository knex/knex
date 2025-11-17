'use strict';

const { mkdtemp, rm, rmdir, writeFile, stat } = require('node:fs/promises');
const { resolve, relative, isAbsolute, basename } = require('node:path');
const { tmpdir } = require('node:os');
const { execCommand } = require('cli-testlab');

const Debug = require('debug');
const debug = {
  tempfiles: Debug('knex:test:tempfiles'),
  exec: Debug('knex:test:exec'),
};

class RmRfError extends Error {
  constructor(base, file, files) {
    super(`Refused to remove ${file} (failed sanity checks)`);
    this.name = 'RmRfError';
    this.base = base;
    this.file = file;
    this.files = files;
  }
}

/**
 * Ensure `base` and `files` conform to the following expectations:
 * - Everything is an absolute path
 * - Nothing is falsy/empty
 * - All the `files` are within `base`
 * - All paths include `knex-test` in their basename
 *
 * Throws an error on failure, returns the resolved versions
 * of {base, files} on success
 *
 * @param {string} base
 * @param {string[]} files
 * @returns {base: string, files: string[]}
 * @throws {RmRfError}
 */
function assertCanDelete(base, files) {
  base = resolve(base);
  files = files.map((file) => resolve(file));

  if (!base || !isAbsolute(base) || !basename(base).includes('knex-test')) {
    throw new RmRfError(base, base, files);
  }

  for (const file of files) {
    const rel = relative(base, file);
    if (
      !file ||
      !isAbsolute(file) ||
      !basename(file).includes('knex-test') ||
      rel.startsWith('.') ||
      isAbsolute(rel)
    ) {
      throw new RmRfError(base, file, files);
    }
  }

  return { base, files };
}

/**
 * Remove an explicit list of files, then the parent directory.
 * Ensure that the files are children of the directory.
 *
 * Base path and files must include the string 'knex-test'
 *
 * rm -rf is scary, so be explicit about things...
 *
 * @param {string} base
 * @param {string[]} files
 */
async function rmrf(base, files) {
  const resolved = assertCanDelete(base, files);
  base = resolved.base;
  files = resolved.files;

  for (const file of files) {
    debug.tempfiles('removing', file);
    await rm(file);
  }

  debug.tempfiles('removing', base);
  await rmdir(base);
}

/**
 * Creates a temporary directory to host migration files.
 *
 * The callback receives a helper function for creating temp files
 * in the directory which returns a promise to the absolute path
 * of the created file
 *
 * The directory and created files are removed after the callback
 * returns.
 *
 * If `contents` is empty, registers the filename for removal
 * and returns its absolute path.
 *
 * @example
 * withTempDir(async (dir, tempfile) => {
 *   // resolves to e.g. /tmp/knex-temp-1234/knex-temp-foo
 *   const file1 = await tempfile('foo', 'contents');
 * });
 *
 * withTempDir(async (dir, tempfile) => {
 *   const sqlite = await tmpfile('db');
 * });
 *
 * @param {(dir: string, tempfile: (suffix: string, contents?: string) => Promise<string>) => Promise<void>} cb
 */
async function withTempDir(cb) {
  const basedir = await mkdtemp(resolve(tmpdir(), 'knex-test-'));
  debug.tempfiles('created', basedir);

  const files = [];

  const createFile = async (filename, contents) => {
    if (filename !== basename(filename)) {
      throw new Error('Subdirectory support is not implemented...');
    }

    if (!filename.includes('knex-test')) {
      filename = `knex-test-${filename}`;
    }

    const abspath = resolve(basedir, filename);
    try {
      await stat(abspath);
      throw new Error(`Refused to overwrite existing file: ${abspath}`);
    } catch (e) {
      if (!(e instanceof Error) || e.code !== 'ENOENT') throw e;
    }

    if (contents) {
      await writeFile(abspath, contents);
      debug.tempfiles('created', abspath);
    } else {
      debug.tempfiles('added', abspath);
    }

    files.push(abspath);
    return abspath;
  };

  try {
    await cb(basedir, createFile);
  } finally {
    await rmrf(basedir, files);
  }
}

const KNEX = resolve(__dirname, '..', '..', 'bin', 'cli.js');

/**
 * Return a string containing a migration file from
 * the supplied functions.
 *
 * @example
 * const contents = migration({
 *   up: async (knex) => { ... },
 *   down: async (knex) => { ... },
 * });
 *
 * @typedef {import('../../types/index').Knex} Knex
 * @typedef {(knex: Knex) => Promise<void>} Migrate
 * @param {{up: Migrate, down: Migrate}} migrations
 */
function migration(migrations) {
  return `
exports.up = ${String(migrations.up)};
exports.down = ${String(migrations.down)};
`;
}

/**
 * Run a `knex migrate` command, possibly with extra arguments,
 * using the specified sqlite database.
 *
 * @example
 * await migrate('up', '/tmp/etc');
 *
 * await migrate('up', '/tmp/etc', '--disable-transactions');
 *
 * @param {string} subcommand The migration subcommand to use
 * @param {string} dir The migration directory
 * @param {string} db The sqlite database filename
 * @param {string[]} args Any additional arguments passed to the CLI
 * @returns {Promise<ExecResult>}
 */
function migrate(subcommand, dir, db, ...args) {
  const cmd = [
    `node ${KNEX}`,
    `migrate:${subcommand}`,
    `--client=sqlite3`,
    `--connection=${db}`,
    `--migrations-directory=${dir}`,
    ...args,
  ];

  debug.exec('Executing', cmd);
  return execCommand(cmd.join(' '));
}

module.exports = { withTempDir, migration, migrate };

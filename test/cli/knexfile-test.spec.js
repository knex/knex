'use strict';

const path = require('path');
const tildify = require('tildify');

const { FileTestHelper, execCommand } = require('cli-testlab');

const KNEX = path.normalize(__dirname + '/../../bin/cli.js');

describe('knexfile', () => {
  /**
   * @type FileTestHelper
   */
  let fileHelper;
  beforeEach(() => {
    fileHelper = new FileTestHelper(path.resolve(__dirname, '../jake-util'));
    fileHelper.deleteFile('test.sqlite3');
    fileHelper.registerForCleanup('test.sqlite3');
  });

  afterEach(() => {
    fileHelper.cleanup();
  });

  before(() => {
    process.env.KNEX_PATH = '../knex.js';
  });

  describe('knexfile resolution', () => {
    context('--cwd is NOT specified', function () {
      context('and --knexfile is also NOT specified', function () {
        it('Resolves default knexfile in working directory correctly', () => {
          const path = process.cwd() + '/knexfile.js';
          fileHelper.createFile(
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
        `,
            { isPathAbsolute: true }
          );

          return execCommand(
            `node ${KNEX} migrate:latest --knexpath=../knex.js`,
            {
              expectedOutput: 'Batch 1 run: 1 migrations',
            }
          );
        });
      });

      context('but --knexfile is specified', function () {
        it('Run migrations with knexfile passed', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile.js --knexpath=../knex.js`,
            {
              expectedOutput: 'Batch 1 run: 1 migrations',
            }
          );
        });

        it('Run migrations with knexfile returning function passed', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile_func.js --knexpath=../knex.js`,
            {
              expectedOutput: 'Batch 1 run: 1 migrations',
            }
          );
        });

        it('Run migrations with knexfile with async passed', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile_async.js --knexpath=../knex.js`,
            {
              expectedOutput: 'Batch 1 run: 1 migrations',
            }
          );
        });

        it('Run migrations with knexfile with promise passed', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile/knexfile_promise.js --knexpath=../knex.js`,
            {
              expectedOutput: 'Batch 1 run: 1 migrations',
            }
          );
        });

        it("changes the process's cwd to the directory that contains the knexfile", () => {
          const knexfile = 'test/jake-util/knexfile-relative/knexfile.js';
          const expectedCWD = tildify(path.resolve(path.dirname(knexfile)));

          return execCommand(
            `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-relative/knexfile.js --knexpath=../knex.js`,
            {
              expectedOutput: `Working directory changed to ${expectedCWD}`,
            }
          );
        });

        // This addresses the issue that was reported here:
        //
        //   https://github.com/knex/knex/issues/3660
        //
        context(
          'and the knexfile itself resolves paths relative to process.cwd()',
          function () {
            it("changes the process's cwd to the directory that contains the knexfile before opening the knexfile", () => {
              const knexfile = 'test/jake-util/knexfile-relative/knexfile.js';
              const expectedCWD = tildify(path.resolve(path.dirname(knexfile)));

              return execCommand(
                `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-relative/knexfile-with-resolve.js --knexpath=../knex.js`,
                {
                  expectedOutput: `Working directory changed to ${expectedCWD}`,
                }
              );
            });
          }
        );

        // FYI: This is only true because the Knex CLI changes the CWD to
        //      the directory of the knexfile.
        it('Resolves migrations relatively to knexfile', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-relative/knexfile.js --knexpath=../knex.js`,
            {
              expectedOutput: 'Batch 1 run: 2 migrations',
            }
          );
        });

        it('Throws informative error when no knexfile is found', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --knexpath=../knex.js`,
            {
              expectedErrorMessage: 'No configuration file found',
            }
          );
        });
      });
    });

    context('--cwd is specified', function () {
      context('and --knexfile is also specified', function () {
        context('and --knexfile is a relative path', function () {
          it('resolves --knexfile relative to --cwd', function () {
            return execCommand(
              `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile --knexfile=knexfile.js`,
              {
                expectedOutput: 'Batch 1 run: 1 migrations',
              }
            );
          });
        });

        context('and --knexfile is an absolute path', function () {
          it('uses the indicated knexfile', function () {
            // Notice: the Knexfile is using Typescript.  This means that Knex
            // is pre-loading the appropriate Typescript modules before loading
            // the Knexfile.
            const knexfile = path.resolve(
              'test/jake-util/knexfile-ts/custom-config.ts'
            );
            return execCommand(
              `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile --knexfile=${knexfile}`,
              {
                expectedOutput: 'Batch 1 run: 4 migrations',
              }
            );
          });
        });
      });

      context('but --knexfile is NOT specified', function () {
        it('resolves knexfile relative to the specified cwd', () => {
          return execCommand(
            `node ${KNEX} migrate:latest --cwd=test/jake-util/knexfile`,
            {
              expectedOutput: 'Batch 1 run: 1 migrations',
            }
          );
        });
      });
    });
  });

  describe('knexfile supports custom migrationSource', () => {
    it('works correctly with migrationSource specified', () => {
      return execCommand(
        `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-custom-migration-source/knexfile.js --knexpath=../knex.js`,
        {
          expectedOutput: 'Batch 1 run: 2 migrations',
        }
      ).then(() =>
        execCommand(
          `node ${KNEX} migrate:rollback --all --knexfile=test/jake-util/knexfile-custom-migration-source/knexfile.js --knexpath=../knex.js`,
          {
            expectedOutput: 'Batch 1 rolled back: 2 migrations',
          }
        )
      );
    });

    it('ignores migrationSource if migration directory is specified', () => {
      return execCommand(
        `node ${KNEX} migrate:latest --knexfile=test/jake-util/knexfile-custom-migration-source/knexfile-with-directory.js --knexpath=../knex.js`,
        {
          expectedOutput: [
            'Batch 1 run: 1 migrations',
            'FS-related option specified for migration configuration. This resets migrationSource to default FsMigrations',
          ],
        }
      );
    });
  });
});

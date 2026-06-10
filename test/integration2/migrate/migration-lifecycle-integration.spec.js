'use strict';
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;

const path = require('path');
const rimraf = require('rimraf');
const logger = require('../../integration/logger');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Migrations Lifecycle Hooks', function () {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      // Force clean slate before each test
      beforeEach(async () => {
        rimraf.sync(path.join(__dirname, './migration'));
        knex = logger(getKnexForDb(db));
        // make sure lock was not left from previous failed test run
        await knex.schema.dropTableIfExists('knex_migrations');
        await knex.schema.dropTableIfExists('migration_test_1');
        await knex.schema.dropTableIfExists('migration_test_2');
        await knex.schema.dropTableIfExists('migration_test_2_1');
        await knex.migrate.forceFreeMigrationsLock({
          directory: 'test/integration2/migrate/test',
        });
      });

      describe('knex.migrate.latest', function () {
        describe('beforeAll', function () {
          it('runs before the migrations batch', async function () {
            let count, migrationFiles;
            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              beforeAll: async (knexOrTrx, migrations) => {
                const data = await knexOrTrx('knex_migrations').select('*');
                count = data.length;
                migrationFiles = migrations;
              },
            });

            const data = await knex('knex_migrations').select('*');
            expect(data.length).to.equal(count + 2);

            expect(migrationFiles).to.deep.equal([
              {
                directory: 'test/integration2/migrate/test',
                file: '20131019235242_migration_1.js',
              },
              {
                directory: 'test/integration2/migrate/test',
                file: '20131019235306_migration_2.js',
              },
            ]);
          });

          it('does not run the migration or beforeEach/afterEach/afterAll hooks if it fails', async function () {
            const beforeAll = sinon
              .stub()
              .throws(new Error('force beforeAll hook failure'));
            const beforeEach = sinon.stub();
            const afterEach = sinon.stub();
            const afterAll = sinon.stub();

            await knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test',
                beforeAll,
                beforeEach,
                afterEach,
                afterAll,
              })
              .catch((error) => {
                expect(error.message).to.equal('force beforeAll hook failure');
              });

            // Should not have run the migration
            const hasTableCreatedByMigration = await knex.schema.hasTable(
              'migration_test_1'
            );
            expect(hasTableCreatedByMigration).to.be.false;

            // Should not have called the other hooks
            expect(beforeEach.called).to.be.false;
            expect(afterEach.called).to.be.false;
            expect(afterAll.called).to.be.false;
          });
        });

        describe('afterAll', function () {
          it('runs after the migrations batch', async function () {
            let count, migrationFiles;
            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              afterAll: async (knexOrTrx, migrations) => {
                const data = await knexOrTrx('knex_migrations').select('*');
                count = data.length;
                migrationFiles = migrations;
              },
            });

            const data = await knex('knex_migrations').select('*');
            expect(data.length).to.equal(count);

            expect(migrationFiles).to.deep.equal([
              {
                directory: 'test/integration2/migrate/test',
                file: '20131019235242_migration_1.js',
              },
              {
                directory: 'test/integration2/migrate/test',
                file: '20131019235306_migration_2.js',
              },
            ]);
          });

          it('is not called if the migration fails', async function () {
            const afterAll = sinon.stub();

            await knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test_with_invalid',
                afterAll,
              })
              .catch(() => {});

            expect(afterAll.called).to.be.false;
          });
        });

        describe('beforeEach', function () {
          it('runs before each migration', async function () {
            const tableExistenceChecks = [];
            const beforeEach = sinon.stub().callsFake(async (trx) => {
              const hasFirstTestTable = await trx.schema.hasTable(
                'migration_test_1'
              );
              const hasSecondTestTable = await trx.schema.hasTable(
                'migration_test_2'
              );
              tableExistenceChecks.push({
                hasFirstTestTable,
                hasSecondTestTable,
              });
            });

            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              beforeEach,
            });

            expect(beforeEach.callCount).to.equal(2);
            expect(tableExistenceChecks).to.deep.equal([
              {
                hasFirstTestTable: false,
                hasSecondTestTable: false,
              },
              {
                hasFirstTestTable: true,
                hasSecondTestTable: false,
              },
            ]);
          });

          it('does not run the migration and the afterEach/afterAll hooks if the hook fails', async function () {
            const beforeEach = sinon
              .stub()
              .throws(new Error('force beforeEach hook failure'));
            const afterEach = sinon.stub();
            const afterAll = sinon.stub();

            const error = await knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test',
                beforeEach,
                afterEach,
                afterAll,
              })
              .catch((error) => error);

            expect(error.message).to.equal('force beforeEach hook failure');

            // Should not have run the migration
            const hasTableCreatedByMigration = await knex.schema.hasTable(
              'migration_test_1'
            );
            expect(hasTableCreatedByMigration).to.be.false;

            // Should not have called the after hooks
            expect(afterEach.called).to.be.false;
            expect(afterAll.called).to.be.false;
          });
        });

        describe('afterEach', function () {
          it('runs after each migration', async function () {
            const tableExistenceChecks = [];
            const afterEach = sinon.stub().callsFake(async (trx) => {
              const hasFirstTestTable = await trx.schema.hasTable(
                'migration_test_1'
              );
              const hasSecondTestTable = await trx.schema.hasTable(
                'migration_test_2'
              );
              tableExistenceChecks.push({
                hasFirstTestTable,
                hasSecondTestTable,
              });
            });

            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              afterEach,
            });

            expect(afterEach.callCount).to.equal(2);
            expect(tableExistenceChecks).to.deep.equal([
              {
                hasFirstTestTable: true,
                hasSecondTestTable: false,
              },
              {
                hasFirstTestTable: true,
                hasSecondTestTable: true,
              },
            ]);
          });

          it('is not called after a migration fails', async function () {
            const afterEach = sinon.stub();

            await knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test_with_invalid',
                afterEach,
              })
              .catch(() => {});

            // The afterEach hook should have run for the first two successful migrations, but
            // not after failed third migration
            expect(afterEach.callCount).to.equal(2);
            expect(
              afterEach.args.map(([_knex, [{ file }]]) => file)
            ).to.deep.equal([
              '20131019235242_migration_1.js',
              '20131019235306_migration_2.js',
            ]);
          });

          it('does not run the afterAll hook if the hook fails', async function () {
            const afterEach = sinon
              .stub()
              .throws(new Error('force afterEach hook failure'));
            const afterAll = sinon.stub();

            await knex.migrate
              .latest({
                directory: 'test/integration2/migrate/test',
                afterEach,
                afterAll,
              })
              .catch((error) => {
                expect(error.message).to.equal('force afterEach hook failure');
              });

            expect(afterAll.called).to.be.false;
          });
        });

        describe('execution order', function () {
          it('runs in the expected order of beforeAll -> beforeEach -> afterEach -> afterAll', async function () {
            const order = [];

            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              beforeAll: () => order.push('beforeAll'),
              beforeEach: (_knex, [{ file }]) =>
                order.push(`beforeEach-${file}`),
              afterEach: (_knex, [{ file }]) => order.push(`afterEach-${file}`),
              afterAll: () => order.push('afterAll'),
            });

            expect(order).to.deep.equal([
              'beforeAll',
              'beforeEach-20131019235242_migration_1.js',
              'afterEach-20131019235242_migration_1.js',
              'beforeEach-20131019235306_migration_2.js',
              'afterEach-20131019235306_migration_2.js',
              'afterAll',
            ]);
          });
        });

        describe('when there are no pending migrations', function () {
          it('does not run any of the hooks', async function () {
            // Fire the migrations once to get the DB up to date
            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
            });

            // Now there should not be any pending migrations
            const beforeAll = sinon.stub();
            const beforeEach = sinon.stub();
            const afterEach = sinon.stub();
            const afterAll = sinon.stub();

            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              beforeAll,
              beforeEach,
              afterEach,
              afterAll,
            });

            expect(beforeAll.called).to.be.false;
            expect(beforeEach.called).to.be.false;
            expect(afterEach.called).to.be.false;
            expect(afterAll.called).to.be.false;
          });
        });
      });
    });
  });
});

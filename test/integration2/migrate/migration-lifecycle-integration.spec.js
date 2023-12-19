'use strict';
const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;

const path = require('path');
const rimraf = require('rimraf');
const logger = require('../../integration/logger');
const { getAllDbs, getKnexForDb } = require('../util/knex-instance-provider');

describe('Migrations Lifecycle Hooks', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;

      before(async () => {
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

      describe('knex.migrate.latest - lifecycle hooks', function () {
        before(() => {
          return knex.migrate.rollback(
            { directory: 'test/integration2/migrate/test' },
            true
          );
        });

        afterEach(() => {
          return knex.migrate.rollback(
            { directory: 'test/integration2/migrate/test' },
            true
          );
        });

        describe('beforeAll', () => {
          it('runs before the migrations batch', async function () {
            let beforeCount;
            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              beforeAll: async (knexOrTrx) => {
                const data = await knexOrTrx('knex_migrations').select('*');
                beforeCount = data.length;
              },
            });

            const data = await knex('knex_migrations').select('*');
            expect(data.length).to.equal(beforeCount + 2);
          });
        });

        describe('afterAll', () => {
          it('runs after the migrations batch', async function () {
            let count;
            await knex.migrate.latest({
              directory: 'test/integration2/migrate/test',
              afterAll: async (knexOrTrx) => {
                const data = await knexOrTrx('knex_migrations').select('*');
                count = data.length;
              },
            });

            const data = await knex('knex_migrations').select('*');
            expect(data.length).to.equal(count);
          });
        });

        describe('beforeEach', () => {
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
        });

        describe('afterEach', () => {
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
        });
      });
    });
  });
});

const Knex = require('../../../lib/index');
const { expect } = require('chai');
const sqliteConfig = require('../../knexfile').sqlite3;
const FsMigrations = require('../../../lib/migrate/sources/fs-migrations')
  .default;

describe('Migrator', () => {
  describe('does not use postProcessResponse for internal queries', (done) => {
    let migrationSource;
    let knex;
    before(() => {
      migrationSource = new FsMigrations('test/unit/migrate/migrations/');
      knex = Knex({
        ...sqliteConfig,
        migrationSource,
        postProcessResponse: () => {
          throw new Error('Response was processed');
        },
      });
    });

    after(() => {
      return knex.migrate.rollback({
        directory: 'test/unit/migrate/migrations',
      });
    });

    it('latest', (done) => {
      expect(() => {
        knex.migrate
          .latest({
            directory: 'test/unit/migrate/migrations',
          })
          .then(() => {
            done();
          });
      }).not.to.throw();
    });
  });

  describe('uses postProcessResponse for migrations', (done) => {
    let migrationSource;
    let knex;
    before(() => {
      migrationSource = new FsMigrations(
        'test/unit/migrate/processed-migrations/'
      );
    });

    after(() => {
      return knex.migrate.rollback({
        directory: 'test/unit/migrate/processed-migrations',
      });
    });

    it('latest', (done) => {
      knex = Knex({
        ...sqliteConfig,
        migrationSource,
        postProcessResponse: () => {
          done();
        },
      });

      expect(() => {
        knex.migrate.latest({
          directory: 'test/unit/migrate/processed-migrations',
        });
      }).not.to.throw();
    });
  });
});

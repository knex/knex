const Knex = require('../../../../lib');
const { expect } = require('chai');
const sqliteConfig = require('../../../knexfile').sqlite3;
const FsMigrations = require('../../../../lib/migrations/migrate/sources/fs-migrations')
  .default;

describe('Migrator', () => {
  describe('does not use postProcessResponse for internal queries', (done) => {
    let migrationSource;
    let knex;
    beforeEach(() => {
      migrationSource = new FsMigrations('test/unit/migrate/migrations/');
      knex = Knex({
        ...sqliteConfig,
        connection: ':memory:',
        migrationSource,
        postProcessResponse: () => {
          throw new Error('Response was processed');
        },
      });
    });

    afterEach(() => {
      return knex.destroy();
    });

    it('latest', (done) => {
      expect(() => {
        return knex.migrate
          .latest({
            directory: 'test/unit/migrate/migrations',
          })
          .then(() => {
            done();
          });
      }).not.to.throw();
    });
  });

  describe('supports running migrations in transaction', (done) => {
    let migrationSource;
    let knex;
    let wasProcessed = false;
    let wasWrapped = false;
    beforeEach(() => {
      migrationSource = new FsMigrations('test/unit/migrate/migrations/');
      knex = Knex({
        ...sqliteConfig,
        connection: ':memory:',
        migrationSource,
        postProcessResponse: (response) => {
          wasProcessed = true;
          return response;
        },
        wrapIdentifier: (value, wrap) => {
          wasWrapped = true;
          return wrap(value);
        },
      });
    });

    afterEach(() => {
      return knex.destroy();
    });

    it('latest', (done) => {
      expect(() => {
        return knex.transaction((txn) => {
          txn.migrate
            .latest({
              directory: 'test/unit/migrate/migrations',
            })
            .then(() => {
              expect(wasProcessed).to.equal(false);
              expect(wasWrapped).to.equal(false);
              done();
            });
        });
      }).not.to.throw();
    });
  });

  describe('uses postProcessResponse for migrations', (done) => {
    let migrationSource;
    let knex;
    beforeEach(() => {
      migrationSource = new FsMigrations(
        'test/unit/migrate/processed-migrations/'
      );
    });

    afterEach(() => {
      return knex.destroy();
    });

    it('latest', (done) => {
      let wasPostProcessed = false;
      knex = Knex({
        ...sqliteConfig,
        connection: ':memory:',
        migrationSource,
        postProcessResponse: (response) => {
          wasPostProcessed = true;
          return response;
        },
      });

      knex.migrate
        .latest({
          directory: 'test/unit/migrate/processed-migrations',
        })
        .then(() => {
          expect(wasPostProcessed).to.equal(true);
          done();
        });
    });
  });
});

const Knex = require('../../../../lib');
const sqliteConfig = require('../../../knexfile').sqlite3;
const { FsMigrations } =
  require('../../../../lib/migrations/migrate/sources/fs-migrations');

describe('Migrator', () => {
  describe('does not use postProcessResponse for internal queries', () => {
    let migrationSource;
    let knex;
    beforeEach(() => {
      migrationSource = new FsMigrations('test/unit/migrations/migrate/migrations/');
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

    it('latest', async () => {
      await knex.migrate.latest({
        directory: 'test/unit/migrations/migrate/migrations',
      });
    });
  });

  describe('supports running migrations in transaction', () => {
    let migrationSource;
    let knex;
    let wasProcessed = false;
    let wasWrapped = false;
    beforeEach(() => {
      migrationSource = new FsMigrations('test/unit/migrations/migrate/migrations/');
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

    it('latest', async () => {
      await knex.transaction((txn) => {
        return txn.migrate
          .latest({
            directory: 'test/unit/migrations/migrate/migrations',
          })
          .then(() => {
            expect(wasProcessed).toBe(false);
            expect(wasWrapped).toBe(false);
          });
      });
    });
  });

  describe('uses postProcessResponse for migrations', () => {
    let migrationSource;
    let knex;
    beforeEach(() => {
      migrationSource = new FsMigrations(
        'test/unit/migrations/migrate/processed-migrations/'
      );
    });

    afterEach(() => {
      return knex.destroy();
    });

    it('latest', async () => {
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

      await knex.migrate.latest({
        directory: 'test/unit/migrations/migrate/processed-migrations',
      });
      expect(wasPostProcessed).toBe(true);
    });
  });
});

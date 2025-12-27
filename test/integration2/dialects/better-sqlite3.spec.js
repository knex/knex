const { expect } = require('chai');
require('../../util/chai-setup');
const { getKnexForBetterSqlite } = require('../util/knex-instance-provider');

describe('better-sqlite3 safeIntegers', () => {
  describe('Factory-level option', () => {
    it('should return BigInt when safeIntegers is true', async () => {
      const knex = getKnexForBetterSqlite(false, {
        connection: {
          filename: ':memory:',
          options: {
            safeIntegers: true,
          },
        },
      });

      await knex.schema.createTable('test_bigint', (table) => {
        table.bigInteger('id').primary();
        table.bigInteger('value');
      });

      const largeValue = 9007199254740992n; // Number.MAX_SAFE_INTEGER + 1
      await knex('test_bigint').insert({ id: 1n, value: largeValue });

      const result = await knex('test_bigint').select('*').first();
      expect(typeof result.value).to.equal('bigint');
      expect(result.value).to.equal(largeValue);

      await knex.destroy();
    });

    it('should return number when safeIntegers is false', async () => {
      const knex = getKnexForBetterSqlite(false, {
        connection: {
          filename: ':memory:',
          options: {
            safeIntegers: false,
          },
        },
      });

      await knex.schema.createTable('test_number', (table) => {
        table.integer('id').primary();
        table.integer('value');
      });

      await knex('test_number').insert({ id: 1, value: 42 });

      const result = await knex('test_number').select('*').first();
      expect(typeof result.value).to.equal('number');
      expect(result.value).to.equal(42);

      await knex.destroy();
    });

    it('should use driver default when safeIntegers is not set', async () => {
      const knex = getKnexForBetterSqlite(false, {
        connection: {
          filename: ':memory:',
        },
      });

      await knex.schema.createTable('test_default', (table) => {
        table.integer('id').primary();
        table.integer('value');
      });

      await knex('test_default').insert({ id: 1, value: 42 });

      const result = await knex('test_default').select('*').first();
      expect(typeof result.value).to.equal('number');

      await knex.destroy();
    });
  });

  describe('Query-level option', () => {
    it('should override factory setting per query', async () => {
      const knex = getKnexForBetterSqlite(false, {
        connection: {
          filename: ':memory:',
          options: {
            safeIntegers: false,
          },
        },
      });

      await knex.schema.createTable('test_override', (table) => {
        table.bigInteger('id').primary();
        table.bigInteger('value');
      });

      const largeValue = 9007199254740992n;
      await knex('test_override').insert({ id: 1n, value: largeValue });

      const resultWithBigInt = await knex('test_override')
        .select('*')
        .options({ safeIntegers: true })
        .first();

      expect(typeof resultWithBigInt.value).to.equal('bigint');

      const resultWithNumber = await knex('test_override')
        .select('*')
        .first();

      expect(typeof resultWithNumber.value).to.equal('number');

      await knex.destroy();
    });

    it('should work when factory setting is undefined', async () => {
      const knex = getKnexForBetterSqlite(false, {
        connection: {
          filename: ':memory:',
        },
      });

      await knex.schema.createTable('test_query_only', (table) => {
        table.bigInteger('id').primary();
        table.bigInteger('value');
      });

      const largeValue = 9007199254740992n;
      await knex('test_query_only').insert({ id: 1n, value: largeValue });

      const resultWithBigInt = await knex('test_query_only')
        .select('*')
        .options({ safeIntegers: true })
        .first();
      expect(typeof resultWithBigInt.value).to.equal('bigint');
      expect(resultWithBigInt.value).to.equal(largeValue);

      const resultWithNumber = await knex('test_query_only')
        .select('*')
        .first();
      expect(typeof resultWithNumber.value).to.equal('number');

      await knex.destroy();
    });
  });
});

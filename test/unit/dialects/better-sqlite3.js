'use strict';
const path = require('path');
const expect = require('chai').expect;
const fs = require('fs');
const knex = require('../../../knex');

describe('better-sqlite3 unit tests', () => {
  describe('nativeBinding', () => {
    it('should work with a custom `nativeBinding`', async () => {
      const knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
          options: {
            nativeBinding: path.resolve(
              __dirname,
              '../../../node_modules/better-sqlite3/build/Release/better_sqlite3.node'
            ),
          },
        },
      });

      const result = await knexInstance
        .select(knexInstance.raw('2 + 2 as answer'))
        .first()
        .catch((err) => err);
      expect(result.answer).to.equal(4);
    });

    it('should fail with a broken custom `nativeBinding`', async () => {
      const knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
          options: {
            nativeBinding: 'not/a/real/path',
          },
        },
      });

      const result = await knexInstance
        .select(knexInstance.raw('2 + 2 as answer'))
        .first()
        .catch((err) => err);
      console.dir(result);
      expect(result).to.be.an('error');
      expect(result.code).to.equal('MODULE_NOT_FOUND');
    });
  });

  describe('readonly', () => {
    const dbPath = path.resolve(__dirname, '../test.sqlite3');

    before(() => {
      // Read-only access requires the DB file to exist.
      fs.writeFileSync(dbPath, '');
    });

    it('should initialize the DB with the passed-in `readonly` option', async () => {
      const knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: dbPath,
          options: {
            readonly: true,
          },
        },
      });

      const connection = await knexInstance.client.acquireConnection();
      expect(connection.readonly).to.equal(true);
    });

    it('should prevent writing to the DB', async () => {
      const knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: dbPath,
          options: {
            readonly: true,
          },
        },
      });

      await expect(
        knexInstance.raw('create table shouldFail (x integer)')
      ).to.eventually.be.rejectedWith('attempt to write a readonly database');
    });

    it('should fall back on `readonly` = `false`', async () => {
      const knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: dbPath,
        },
      });

      const connection = await knexInstance.client.acquireConnection();
      expect(connection.readonly).to.equal(false);
    });
  });

  describe('defaultSafeIntegers', () => {
    let knexInstance;

    afterEach(async () => {
      if (knexInstance) {
        await knexInstance.destroy();
        knexInstance = null;
      }
    });

    it('should return BigInt when `defaultSafeIntegers` is enabled', async () => {
      knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
          options: {
            defaultSafeIntegers: true,
          },
        },
      });

      await knexInstance.schema.createTable('test_bigint', (table) => {
        table.bigInteger('id').primary();
        table.string('name');
      });

      const largeId = 9007199254740993n;

      await knexInstance('test_bigint').insert({
        id: largeId,
        name: 'test',
      });

      const result = await knexInstance('test_bigint')
        .select('id', 'name')
        .first();

      expect(typeof result.id).to.equal('bigint');
      expect(result.id).to.equal(largeId);
    });

    it('should return Number when `defaultSafeIntegers` is not set', async () => {
      knexInstance = knex({
        client: 'better-sqlite3',
        useNullAsDefault: true,
        connection: {
          filename: ':memory:',
        },
      });

      await knexInstance.schema.createTable('test_number', (table) => {
        table.integer('id').primary();
        table.string('name');
      });

      const smallId = 123;

      await knexInstance('test_number').insert({
        id: smallId,
        name: 'test',
      });

      const result = await knexInstance('test_number')
        .select('id', 'name')
        .first();

      expect(typeof result.id).to.equal('number');
      expect(result.id).to.equal(smallId);
    });
  });
});

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
});

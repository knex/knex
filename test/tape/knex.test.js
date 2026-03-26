'use strict';

const knex = require('../../lib/index');
const fs = require('fs');

describe('knex initialization', () => {
  it('should parse the connection string', () => {
    const knexObj = knex({
      client: 'mysql',
      connection: 'mysql://user:password@localhost/dbname',
    });
    expect(knexObj.client.config.connection).toEqual({
      database: 'dbname',
      host: 'localhost',
      // password: 'password', // non-enumerable
      user: 'user',
    });
    expect(knexObj.client.config.connection.password).toBe('password');
    return knexObj.destroy();
  });

  it('should allow to use proprietary dialect', () => {
    const Client = require('../../lib/dialects/mysql');
    const knexObj = knex({
      client: Client,
      connection: {
        database: 'dbname',
        host: 'localhost',
        password: 'password',
        user: 'user',
      },
    });
    expect(knexObj.client).toBeInstanceOf(Client);
    expect(knexObj.client.config).toEqual({
      client: Client,
      connection: {
        database: 'dbname',
        host: 'localhost',
        // password: 'password', // non-enumerable
        user: 'user',
      },
    });
    return knexObj.destroy();
  });

  it('should use knex supported dialect', () => {
    const knexObj = knex({
      client: 'postgres',
      connection: {
        database: 'dbname',
        host: 'localhost',
        password: 'password',
        user: 'user',
      },
    });
    expect(knexObj.client.config).toEqual({
      client: 'postgres',
      connection: {
        database: 'dbname',
        host: 'localhost',
        // password: 'password', // non-enumerable
        user: 'user',
      },
    });
    return knexObj.destroy();
  });

  it('should support open flags selection for sqlite3', async () => {
    const knexObj = knex({
      client: 'sqlite3',
      connection: {
        filename: 'file:memdb-test?mode=memory',
        // allow the filename to be interpreted as a URI
        flags: ['OPEN_URI'],
      },
    });
    try {
      // run a query so a connection is created
      await knexObj.select(knexObj.raw('"0"'));
      // if the filename was interpreted as a URI, no file should have been created
      expect(fs.existsSync('./file:memdb-test?mode=memory')).toBe(false);
    } finally {
      await knexObj.destroy();
    }
  });

  it('should error when invalid open flags are selected for sqlite3', async () => {
    // Test invalid flags
    let knexObj = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        flags: ['NON_EXISTING'],
      },
    });
    try {
      await knexObj.select(knexObj.raw('"0"'));
      throw new Error('Should not get here');
    } catch (err) {
      expect(err.message).toBe(
        'flag NON_EXISTING not supported by node-sqlite3'
      );
    } finally {
      await knexObj.destroy();
    }

    // test invalid config
    knexObj = knex({
      client: 'sqlite3',
      connection: {
        filename: ':memory:',
        flags: 'OPEN_URI',
      },
    });
    try {
      await knexObj.select(knexObj.raw('"0"'));
      throw new Error('Should not get here');
    } catch (err) {
      expect(err.message).toBe('flags must be an array of strings');
    } finally {
      await knexObj.destroy();
    }
  });

  it('should throw error if client is omitted in config', () => {
    try {
      knex({});
      expect(true).toBe(false); // Don't reach this point
    } catch (error) {
      expect(error.message).toBe(
        "knex: Required configuration option 'client' is missing."
      );
    }
  });
});

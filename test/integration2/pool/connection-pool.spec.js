'use strict';

const { expect } = require('chai');
const knex = require('../../../lib');
const {
  getAllDbs,
} = require('../util/knex-instance-provider');
const {
  isPostgreSQL,
  isMysql,
  isPgNative,
  isOracle,
  isCockroachDB,
} = require('../../util/db-helpers');

// Connection configs matching the test infrastructure (knex-instance-provider.js)
const testConfig =
  (process.env.KNEX_TEST && require(process.env.KNEX_TEST)) || {};

const pgConnectionConfig = testConfig.postgres || {
  port: 25432,
  host: 'localhost',
  database: 'knex_test',
  user: 'testuser',
  password: 'knextest',
};

const mysqlConnectionConfig = testConfig.mysql || {
  port: 23306,
  database: 'knex_test',
  host: 'localhost',
  user: 'testuser',
  password: 'testpassword',
  charset: 'utf8',
};

const oracleConnectionConfig = testConfig.oracledb || {
  user: 'system',
  password: 'Oracle18',
  connectString: 'localhost:21521/XE',
  stmtCacheSize: 0,
};

// Helper: does the current test run include this db?
function dbIncluded(name) {
  return getAllDbs().includes(name);
}

describe('connectionPool', function () {
  this.timeout(30000);

  describe('postgres', function () {
    if (!dbIncluded('postgres')) return;

    let pg;
    let nativePool;
    let db;

    before(function () {
      try {
        pg = require('pg');
      } catch (_e) {
        this.skip();
      }
      nativePool = new pg.Pool(pgConnectionConfig);
      db = knex({
        client: 'pg',
        connectionPool: nativePool,
      });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) await nativePool.end();
    });

    it('runs basic select queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result');
      expect(result.rows[0].result).to.equal(2);
    });

    it('runs multiple concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val'),
        db.raw('SELECT 2 AS val'),
        db.raw('SELECT 3 AS val'),
      ]);
      expect(results.map((r) => r.rows[0].val)).to.deep.equal([1, 2, 3]);
    });

    it('supports transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS connection_pool_test (id serial PRIMARY KEY, name text)'
      );
      try {
        await db.transaction(async (trx) => {
          await trx('connection_pool_test').insert({ name: 'alice' });
          await trx('connection_pool_test').insert({ name: 'bob' });
        });
        const rows = await db('connection_pool_test').select('name').orderBy('name');
        expect(rows.map((r) => r.name)).to.deep.equal(['alice', 'bob']);
      } finally {
        await db.raw('DROP TABLE IF EXISTS connection_pool_test');
      }
    });

    it('rolls back failed transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS connection_pool_test (id serial PRIMARY KEY, name text NOT NULL)'
      );
      try {
        try {
          await db.transaction(async (trx) => {
            await trx('connection_pool_test').insert({ name: 'alice' });
            await trx('connection_pool_test').insert({ name: null }); // violates NOT NULL
          });
        } catch (_e) {
          // expected
        }
        const rows = await db('connection_pool_test').select();
        expect(rows).to.have.length(0);
      } finally {
        await db.raw('DROP TABLE IF EXISTS connection_pool_test');
      }
    });

    it('does not destroy the native pool when knex.destroy() is called', async function () {
      // Create a separate knex instance for this test
      const pool2 = new pg.Pool(pgConnectionConfig);
      const db2 = knex({ client: 'pg', connectionPool: pool2 });

      // Use it
      await db2.raw('SELECT 1');

      // Destroy knex
      await db2.destroy();

      // Native pool should still be usable
      const client = await pool2.connect();
      const res = await client.query('SELECT 1 AS alive');
      expect(res.rows[0].alive).to.equal(1);
      client.release();

      await pool2.end();
    });

    it('supports streaming', async function () {
      const rows = [];
      await new Promise((resolve, reject) => {
        const stream = db.raw('SELECT generate_series(1, 5) AS n').stream();
        stream.on('data', (row) => rows.push(row.n));
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      expect(rows).to.deep.equal([1, 2, 3, 4, 5]);
    });
  });

  describe('mysql', function () {
    if (!dbIncluded('mysql')) return;

    let mysql;
    let nativePool;
    let db;

    before(function () {
      try {
        mysql = require('mysql');
      } catch (_e) {
        this.skip();
      }
      nativePool = mysql.createPool(mysqlConnectionConfig);
      db = knex({
        client: 'mysql',
        connectionPool: nativePool,
      });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) {
        await new Promise((resolve) => nativePool.end(resolve));
      }
    });

    it('runs basic select queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result');
      expect(result[0][0].result).to.equal(2);
    });

    it('runs multiple concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val'),
        db.raw('SELECT 2 AS val'),
        db.raw('SELECT 3 AS val'),
      ]);
      expect(results.map((r) => r[0][0].val)).to.deep.equal([1, 2, 3]);
    });

    it('supports transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS connection_pool_test (id int AUTO_INCREMENT PRIMARY KEY, name varchar(255))'
      );
      try {
        await db.transaction(async (trx) => {
          await trx('connection_pool_test').insert({ name: 'alice' });
          await trx('connection_pool_test').insert({ name: 'bob' });
        });
        const rows = await db('connection_pool_test').select('name').orderBy('name');
        expect(rows.map((r) => r.name)).to.deep.equal(['alice', 'bob']);
      } finally {
        await db.raw('DROP TABLE IF EXISTS connection_pool_test');
      }
    });

    it('does not destroy the native pool when knex.destroy() is called', async function () {
      const pool2 = mysql.createPool(mysqlConnectionConfig);
      const db2 = knex({ client: 'mysql', connectionPool: pool2 });

      await db2.raw('SELECT 1');
      await db2.destroy();

      // Native pool should still be usable
      const result = await new Promise((resolve, reject) => {
        pool2.query('SELECT 1 AS alive', (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
      expect(result[0].alive).to.equal(1);

      await new Promise((resolve) => pool2.end(resolve));
    });
  });

  describe('mysql2', function () {
    if (!dbIncluded('mysql2')) return;

    let mysql2;
    let nativePool;
    let db;

    before(function () {
      try {
        mysql2 = require('mysql2');
      } catch (_e) {
        this.skip();
      }
      nativePool = mysql2.createPool(mysqlConnectionConfig);
      db = knex({
        client: 'mysql2',
        connectionPool: nativePool,
      });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) {
        await new Promise((resolve) => nativePool.end(resolve));
      }
    });

    it('runs basic select queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result');
      expect(result[0][0].result).to.equal(2);
    });

    it('runs multiple concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val'),
        db.raw('SELECT 2 AS val'),
        db.raw('SELECT 3 AS val'),
      ]);
      expect(results.map((r) => r[0][0].val)).to.deep.equal([1, 2, 3]);
    });

    it('supports transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS connection_pool_test (id int AUTO_INCREMENT PRIMARY KEY, name varchar(255))'
      );
      try {
        await db.transaction(async (trx) => {
          await trx('connection_pool_test').insert({ name: 'alice' });
          await trx('connection_pool_test').insert({ name: 'bob' });
        });
        const rows = await db('connection_pool_test').select('name').orderBy('name');
        expect(rows.map((r) => r.name)).to.deep.equal(['alice', 'bob']);
      } finally {
        await db.raw('DROP TABLE IF EXISTS connection_pool_test');
      }
    });

    it('does not destroy the native pool when knex.destroy() is called', async function () {
      const pool2 = mysql2.createPool(mysqlConnectionConfig);
      const db2 = knex({ client: 'mysql2', connectionPool: pool2 });

      await db2.raw('SELECT 1');
      await db2.destroy();

      // Native pool should still be usable
      const [rows] = await nativePool.promise().query('SELECT 1 AS alive');
      expect(rows[0].alive).to.equal(1);

      await new Promise((resolve) => pool2.end(resolve));
    });
  });

  describe('oracledb', function () {
    if (!dbIncluded('oracledb')) return;

    let oracledb;
    let nativePool;
    let db;

    before(async function () {
      try {
        oracledb = require('oracledb');
      } catch (_e) {
        this.skip();
      }
      nativePool = await oracledb.createPool(oracleConnectionConfig);
      db = knex({
        client: 'oracledb',
        connectionPool: nativePool,
      });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) await nativePool.close(0);
    });

    it('runs basic select queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result FROM DUAL');
      expect(result[0].RESULT).to.equal(2);
    });

    it('runs multiple concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val FROM DUAL'),
        db.raw('SELECT 2 AS val FROM DUAL'),
        db.raw('SELECT 3 AS val FROM DUAL'),
      ]);
      expect(results.map((r) => r[0].VAL)).to.deep.equal([1, 2, 3]);
    });

    it('does not destroy the native pool when knex.destroy() is called', async function () {
      const pool2 = await oracledb.createPool(oracleConnectionConfig);
      const db2 = knex({ client: 'oracledb', connectionPool: pool2 });

      await db2.raw('SELECT 1 FROM DUAL');
      await db2.destroy();

      // Native pool should still be usable
      const conn = await pool2.getConnection();
      const result = await conn.execute('SELECT 1 AS alive FROM DUAL');
      expect(result.rows[0][0]).to.equal(1);
      await conn.close();

      await pool2.close(0);
    });
  });
});

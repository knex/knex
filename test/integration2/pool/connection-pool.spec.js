'use strict';

const { expect } = require('chai');
const knex = require('../../../lib');
const { KnexPool } = require('../../../lib/pool');
const { getAllDbs, testConfigs } = require('../util/knex-instance-provider');

const pgConnectionConfig = testConfigs.postgres.connection;
const mysqlConnectionConfig = testConfigs.mysql.connection;

function dbIncluded(name) {
  return getAllDbs().includes(name);
}

describe('connectionPool', function () {
  this.timeout(30000);

  // ── PostgreSQL with native pg.Pool ──────────────────────────────

  describe('postgres — native pg.Pool', function () {
    if (!dbIncluded('postgres')) return;

    let pg, nativePool, db;

    before(function () {
      try {
        pg = require('pg');
      } catch (_e) {
        this.skip();
      }
      nativePool = new pg.Pool(pgConnectionConfig);
      db = knex({ client: 'pg', connectionPool: nativePool });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) await nativePool.end();
    });

    it('runs basic queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result');
      expect(result.rows[0].result).to.equal(2);
    });

    it('runs concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val'),
        db.raw('SELECT 2 AS val'),
        db.raw('SELECT 3 AS val'),
      ]);
      expect(results.map((r) => r.rows[0].val)).to.deep.equal([1, 2, 3]);
    });

    it('supports transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS cp_test (id serial PRIMARY KEY, name text)'
      );
      try {
        await db.transaction(async (trx) => {
          await trx('cp_test').insert({ name: 'alice' });
          await trx('cp_test').insert({ name: 'bob' });
        });
        const rows = await db('cp_test').select('name').orderBy('name');
        expect(rows.map((r) => r.name)).to.deep.equal(['alice', 'bob']);
      } finally {
        await db.raw('DROP TABLE IF EXISTS cp_test');
      }
    });

    it('rolls back failed transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS cp_test (id serial PRIMARY KEY, name text NOT NULL)'
      );
      try {
        try {
          await db.transaction(async (trx) => {
            await trx('cp_test').insert({ name: 'alice' });
            await trx('cp_test').insert({ name: null }); // NOT NULL violation
          });
        } catch (_e) {
          // expected
        }
        const rows = await db('cp_test').select();
        expect(rows).to.have.length(0);
      } finally {
        await db.raw('DROP TABLE IF EXISTS cp_test');
      }
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

    it('does not destroy the native pool on knex.destroy()', async function () {
      const pool2 = new pg.Pool(pgConnectionConfig);
      const db2 = knex({ client: 'pg', connectionPool: pool2 });

      await db2.raw('SELECT 1');
      await db2.destroy();

      // Pool still works
      const client = await pool2.connect();
      const res = await client.query('SELECT 1 AS alive');
      expect(res.rows[0].alive).to.equal(1);
      client.release();
      await pool2.end();
    });
  });

  // ── PostgreSQL with shared KnexPool ─────────────────────────────

  describe('postgres — shared KnexPool', function () {
    if (!dbIncluded('postgres')) return;

    let pg, knexPool, db1, db2;

    before(function () {
      try {
        pg = require('pg');
      } catch (_e) {
        this.skip();
      }

      // Build a KnexPool that creates pg connections
      const pgSettings = pgConnectionConfig;
      knexPool = new KnexPool({
        create: () => {
          const client = new pg.Client(pgSettings);
          return client.connect().then(() => client);
        },
        destroy: (connection) => connection.end(),
        validate: (connection) => !connection._ending,
        min: 0,
        max: 5,
      });

      db1 = knex({ client: 'pg', connectionPool: knexPool });
      db2 = knex({ client: 'pg', connectionPool: knexPool });
    });

    after(async function () {
      if (db1) await db1.destroy();
      if (db2) await db2.destroy();
      if (knexPool) await knexPool.destroy();
    });

    it('both instances share the same pool', async function () {
      const [r1, r2] = await Promise.all([
        db1.raw('SELECT 1 AS val'),
        db2.raw('SELECT 2 AS val'),
      ]);
      expect(r1.rows[0].val).to.equal(1);
      expect(r2.rows[0].val).to.equal(2);
      expect(db1.client.pool).to.equal(db2.client.pool);
    });

    it('transactions work on shared pool', async function () {
      await db1.raw(
        'CREATE TABLE IF NOT EXISTS cp_shared_test (id serial PRIMARY KEY, name text)'
      );
      try {
        await db1.transaction(async (trx) => {
          await trx('cp_shared_test').insert({ name: 'from_db1' });
        });
        const rows = await db2('cp_shared_test').select('name');
        expect(rows[0].name).to.equal('from_db1');
      } finally {
        await db1.raw('DROP TABLE IF EXISTS cp_shared_test');
      }
    });

    it('knex.destroy() does not destroy the shared pool', async function () {
      // Create a third instance, destroy it, verify the pool is still alive
      const db3 = knex({ client: 'pg', connectionPool: knexPool });
      await db3.raw('SELECT 1');
      await db3.destroy();

      // Pool still works for other instances
      const res = await db1.raw('SELECT 42 AS val');
      expect(res.rows[0].val).to.equal(42);
    });
  });

  // ── MySQL with native pool ──────────────────────────────────────

  describe('mysql — native pool', function () {
    if (!dbIncluded('mysql')) return;

    let mysql, nativePool, db;

    before(function () {
      try {
        mysql = require('mysql');
      } catch (_e) {
        this.skip();
      }
      nativePool = mysql.createPool(mysqlConnectionConfig);
      db = knex({ client: 'mysql', connectionPool: nativePool });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) {
        await new Promise((resolve) => nativePool.end(resolve));
      }
    });

    it('runs basic queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result');
      expect(result[0][0].result).to.equal(2);
    });

    it('runs concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val'),
        db.raw('SELECT 2 AS val'),
        db.raw('SELECT 3 AS val'),
      ]);
      expect(results.map((r) => r[0][0].val)).to.deep.equal([1, 2, 3]);
    });

    it('supports transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS cp_test (id int AUTO_INCREMENT PRIMARY KEY, name varchar(255))'
      );
      try {
        await db.transaction(async (trx) => {
          await trx('cp_test').insert({ name: 'alice' });
          await trx('cp_test').insert({ name: 'bob' });
        });
        const rows = await db('cp_test').select('name').orderBy('name');
        expect(rows.map((r) => r.name)).to.deep.equal(['alice', 'bob']);
      } finally {
        await db.raw('DROP TABLE IF EXISTS cp_test');
      }
    });

    it('does not destroy the native pool on knex.destroy()', async function () {
      const pool2 = mysql.createPool(mysqlConnectionConfig);
      const db2 = knex({ client: 'mysql', connectionPool: pool2 });

      await db2.raw('SELECT 1');
      await db2.destroy();

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

  // ── MySQL2 with native pool ─────────────────────────────────────

  describe('mysql2 — native pool', function () {
    if (!dbIncluded('mysql2')) return;

    let mysql2, nativePool, db;

    before(function () {
      try {
        mysql2 = require('mysql2');
      } catch (_e) {
        this.skip();
      }
      nativePool = mysql2.createPool(mysqlConnectionConfig);
      db = knex({ client: 'mysql2', connectionPool: nativePool });
    });

    after(async function () {
      if (db) await db.destroy();
      if (nativePool) {
        await new Promise((resolve) => nativePool.end(resolve));
      }
    });

    it('runs basic queries', async function () {
      const result = await db.raw('SELECT 1 + 1 AS result');
      expect(result[0][0].result).to.equal(2);
    });

    it('runs concurrent queries', async function () {
      const results = await Promise.all([
        db.raw('SELECT 1 AS val'),
        db.raw('SELECT 2 AS val'),
        db.raw('SELECT 3 AS val'),
      ]);
      expect(results.map((r) => r[0][0].val)).to.deep.equal([1, 2, 3]);
    });

    it('supports transactions', async function () {
      await db.raw(
        'CREATE TABLE IF NOT EXISTS cp_test (id int AUTO_INCREMENT PRIMARY KEY, name varchar(255))'
      );
      try {
        await db.transaction(async (trx) => {
          await trx('cp_test').insert({ name: 'alice' });
          await trx('cp_test').insert({ name: 'bob' });
        });
        const rows = await db('cp_test').select('name').orderBy('name');
        expect(rows.map((r) => r.name)).to.deep.equal(['alice', 'bob']);
      } finally {
        await db.raw('DROP TABLE IF EXISTS cp_test');
      }
    });

    it('does not destroy the native pool on knex.destroy()', async function () {
      const pool2 = mysql2.createPool(mysqlConnectionConfig);
      const db2 = knex({ client: 'mysql2', connectionPool: pool2 });

      await db2.raw('SELECT 1');
      await db2.destroy();

      const [rows] = await nativePool.promise().query('SELECT 1 AS alive');
      expect(rows[0].alive).to.equal(1);
      await new Promise((resolve) => pool2.end(resolve));
    });
  });
});

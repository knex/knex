'use strict';
const expect = require('chai').expect;
const knex = require('../../../knex');

describe('CockroachDB unit tests', () => {
  const knexInstance = knex({
    client: 'cockroachdb',
    connection: {
      user: 'user',
      password: 'password',
      connectString: 'connect-string',
      externalAuth: true,
      host: 'host',
      database: 'database',
    },
  });

  it('correctly builds single value upsert', async () => {
    const qb = knexInstance.client.queryBuilder();
    qb.upsert({ value: 1 }).into('fakeTable');
    const compiler = knexInstance.client.queryCompiler(qb);
    const sql = compiler.upsert();
    expect(sql).to.eql({
      sql: 'upsert into "fakeTable" ("value") values (?)',
      returning: undefined,
    });
  });

  it('correctly builds default values only upsert', async () => {
    const qb = knexInstance.client.queryBuilder();
    qb.upsert({}).into('fakeTable');
    const compiler = knexInstance.client.queryCompiler(qb);
    const sql = compiler.upsert();
    expect(sql).to.eql({
      sql: 'upsert into "fakeTable" default values',
      returning: undefined,
    });
  });

  it('correctly builds default values only upsert and returning', async () => {
    const qb = knexInstance.client.queryBuilder();
    qb.upsert({}).into('fakeTable').returning('id');
    const compiler = knexInstance.client.queryCompiler(qb);
    const sql = compiler.upsert();
    expect(sql).to.eql({
      sql: 'upsert into "fakeTable" default values returning "id"',
      returning: 'id',
    });
  });

  it('correctly builds bulk values only upsert and returning', async () => {
    const qb = knexInstance.client.queryBuilder();
    qb.upsert([{ a: 1 }, { a: 2 }])
      .into('fakeTable')
      .returning('a');
    const compiler = knexInstance.client.queryCompiler(qb);
    const sql = compiler.upsert();
    expect(sql).to.eql({
      sql: 'upsert into "fakeTable" ("a") values (?), (?) returning "a"',
      returning: 'a',
    });
  });

  it('correctly builds bulk values different columns upsert and returning', async () => {
    const qb = knexInstance.client.queryBuilder();
    qb.upsert([{ a: 1 }, { b: 2 }])
      .into('fakeTable')
      .returning(['a', 'b']);
    const compiler = knexInstance.client.queryCompiler(qb);
    const sql = compiler.upsert();
    expect(sql).to.eql({
      sql: 'upsert into "fakeTable" ("a", "b") values (?, DEFAULT), (DEFAULT, ?) returning "a", "b"',
      returning: ['a', 'b'],
    });
  });
});

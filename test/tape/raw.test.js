'use strict';

const Raw = require('../../lib/raw');
const MysqlClient = require('../../lib/dialects/mysql/index');
const MssqlClient = require('../../lib/dialects/mssql/index');
const PostgreClient = require('../../lib/dialects/postgres/index');
const SqliteClient = require('../../lib/dialects/sqlite3/index');
const _ = require('lodash');

const clientMysql = new MysqlClient({ client: 'mysql' });
const clientPostgre = new PostgreClient({ client: 'pg' });
const clientSqlite = new SqliteClient({ client: 'sqlite3' });
const clientMssql = new MssqlClient({ client: 'mssql' });

function raw(sql, bindings, client = clientMysql) {
  return new Raw(client).set(sql, bindings);
}

describe('Raw', () => {
  it('allows for ?? to interpolate identifiers', () => {
    expect(
      raw('select * from ?? where id = ? and ?? = ??', [
        'table',
        1,
        'table.first',
        'table.second',
      ]).toString()
    ).toBe(
      'select * from `table` where id = 1 and `table`.`first` = `table`.`second`'
    );
  });

  it('allows for object bindings', () => {
    expect(
      raw('select * from users where user_id = :userId and name = :name', {
        userId: 1,
        name: 'tim',
      }).toString()
    ).toBe("select * from users where user_id = 1 and name = 'tim'");
  });

  it('allows for :val: for interpolated identifiers', () => {
    expect(
      raw('select * from :table: where user_id = :userId and name = :name', {
        table: 'users',
        userId: 1,
        name: 'tim',
      }).toString()
    ).toBe("select * from `users` where user_id = 1 and name = 'tim'");
  });

  it('allows use :val: in start of raw query', () => {
    expect(
      raw(':userIdCol: = :userId', {
        userIdCol: 'table',
        userId: 1,
      }).toString()
    ).toBe('`table` = 1');
  });

  it('allows use :val in start of raw query', () => {
    expect(raw(':userId', { userId: 1 }).toString()).toBe('1');
  });

  it('allows for :val: to be interpolated when identifiers with dots', () => {
    expect(
      raw(
        'select * from "table" join "chair" on :tableCol: = :chairCol:',
        {
          tableCol: 'table.id',
          chairCol: 'chair.table_id',
        }
      ).toString()
    ).toBe(
      'select * from "table" join "chair" on `table`.`id` = `chair`.`table_id`'
    );
  });

  it('allows for options in raw queries, #605', () => {
    const x = raw("select 'foo', 'bar';")
      .options({ rowMode: 'array' })
      .toSQL();

    expect(_.pick(x, ['sql', 'options', 'method', 'bindings'])).toEqual({
      sql: "select 'foo', 'bar';",
      options: { rowMode: 'array' },
      method: 'raw',
      bindings: [],
    });
  });

  it('raw bindings are optional, #853', () => {
    const sql = raw('select * from ? where id=?', [raw('foo'), 4]).toSQL();

    expect(sql.sql).toBe('select * from foo where id=?');
    expect(sql.bindings).toEqual([4]);
  });

  it('Allows retrieval of raw query through toNative (MySQL)', () => {
    expect(
      raw('count(*) as user_count, status', undefined, clientMysql)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'count(*) as user_count, status',
      bindings: [],
    });
    expect(
      raw('select * from users where id = ?', [1], clientMysql)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'select * from users where id = ?',
      bindings: [1],
    });
  });

  it('Allows retrieval of raw query through toNative (PostgreSQL)', () => {
    expect(
      raw('count(*) as user_count, status', undefined, clientPostgre)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'count(*) as user_count, status',
      bindings: [],
    });
    expect(
      raw('select * from users where id = ?', [1], clientPostgre)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'select * from users where id = $1',
      bindings: [1],
    });
  });

  it('Allows retrieval of raw query through toNative (SQLite)', () => {
    expect(
      raw('count(*) as user_count, status', undefined, clientSqlite)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'count(*) as user_count, status',
      bindings: [],
    });
    expect(
      raw('select * from users where id = ?', [1], clientSqlite)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'select * from users where id = ?',
      bindings: [1],
    });
  });

  it('Allows retrieval of raw query through toNative (mssql)', () => {
    expect(
      raw('count(*) as user_count, status', undefined, clientMssql)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'count(*) as user_count, status',
      bindings: [],
    });
    expect(
      raw('select * from users where id = ?', [1], clientMssql)
        .toSQL()
        .toNative()
    ).toEqual({
      sql: 'select * from users where id = @p0',
      bindings: [1],
    });
  });
});

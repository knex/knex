'use strict';

const Raw = require('../../lib/raw');
const MysqlClient = require('../../lib/dialects/mysql/index');
const MssqlClient = require('../../lib/dialects/mssql/index');
const PostgreClient = require('../../lib/dialects/postgres/index');
const SqliteClient = require('../../lib/dialects/sqlite3/index');
const test = require('tape');
const _ = require('lodash');

const clientMysql = new MysqlClient({ client: 'mysql' });
const clientPostgre = new PostgreClient({ client: 'pg' });
const clientSqlite = new SqliteClient({ client: 'sqlite3' });
const clientMssql = new MssqlClient({ client: 'mssql' });

function raw(sql, bindings, client = clientMysql) {
  return new Raw(client).set(sql, bindings);
}

test('allows for ?? to interpolate identifiers', function (t) {
  t.plan(1);
  t.equal(
    raw('select * from ?? where id = ? and ?? = ??', [
      'table',
      1,
      'table.first',
      'table.second',
    ]).toString(),
    'select * from `table` where id = 1 and `table`.`first` = `table`.`second`'
  );
});

test('allows for object bindings', function (t) {
  t.plan(1);
  t.equal(
    raw('select * from users where user_id = :userId and name = :name', {
      userId: 1,
      name: 'tim',
    }).toString(),
    "select * from users where user_id = 1 and name = 'tim'"
  );
});

test('allows for :val: for interpolated identifiers', function (t) {
  t.plan(1);
  t.equal(
    raw('select * from :table: where user_id = :userId and name = :name', {
      table: 'users',
      userId: 1,
      name: 'tim',
    }).toString(),
    "select * from `users` where user_id = 1 and name = 'tim'"
  );
});

test('allows use :val: in start of raw query', function (t) {
  t.plan(1);
  t.equal(
    raw(':userIdCol: = :userId', { userIdCol: 'table', userId: 1 }).toString(),
    '`table` = 1'
  );
});

test('allows use :val in start of raw query', function (t) {
  t.plan(1);
  t.equal(raw(':userId', { userId: 1 }).toString(), '1');
});

test('allows for :val: to be interpolated when identifiers with dots', function (t) {
  t.plan(1);
  t.equal(
    raw('select * from "table" join "chair" on :tableCol: = :chairCol:', {
      tableCol: 'table.id',
      chairCol: 'chair.table_id',
    }).toString(),
    'select * from "table" join "chair" on `table`.`id` = `chair`.`table_id`'
  );
});

test('allows for options in raw queries, #605', function (t) {
  t.plan(1);
  const x = raw("select 'foo', 'bar';").options({ rowMode: 'array' }).toSQL();

  t.deepEqual(_.pick(x, ['sql', 'options', 'method', 'bindings']), {
    sql: "select 'foo', 'bar';",
    options: { rowMode: 'array' },
    method: 'raw',
    bindings: [],
  });
});

test('raw bindings are optional, #853', function (t) {
  t.plan(2);

  const sql = raw('select * from ? where id=?', [raw('foo'), 4]).toSQL();

  t.equal(sql.sql, 'select * from foo where id=?');

  t.deepEqual(sql.bindings, [4]);
});

test('Allows retrieval of raw query through toNative (MySQL)', function (t) {
  t.plan(2);
  t.deepEqual(
    raw('count(*) as user_count, status', undefined, clientMysql)
      .toSQL()
      .toNative(),
    {
      sql: 'count(*) as user_count, status',
      bindings: [],
    }
  );
  t.deepEqual(
    raw('select * from users where id = ?', [1], clientMysql)
      .toSQL()
      .toNative(),
    {
      sql: 'select * from users where id = ?',
      bindings: [1],
    }
  );
});

test('Allows retrieval of raw query through toNative (PostgreSQL)', function (t) {
  t.plan(2);
  t.deepEqual(
    raw('count(*) as user_count, status', undefined, clientPostgre)
      .toSQL()
      .toNative(),
    {
      sql: 'count(*) as user_count, status',
      bindings: [],
    }
  );
  t.deepEqual(
    raw('select * from users where id = ?', [1], clientPostgre)
      .toSQL()
      .toNative(),
    {
      sql: 'select * from users where id = $1',
      bindings: [1],
    }
  );
});

test('Allows retrieval of raw query through toNative (SQLite)', function (t) {
  t.plan(2);
  t.deepEqual(
    raw('count(*) as user_count, status', undefined, clientSqlite)
      .toSQL()
      .toNative(),
    {
      sql: 'count(*) as user_count, status',
      bindings: [],
    }
  );
  t.deepEqual(
    raw('select * from users where id = ?', [1], clientSqlite)
      .toSQL()
      .toNative(),
    {
      sql: 'select * from users where id = ?',
      bindings: [1],
    }
  );
});

test('Allows retrieval of raw query through toNative (mssql)', function (t) {
  t.plan(2);
  t.deepEqual(
    raw('count(*) as user_count, status', undefined, clientMssql)
      .toSQL()
      .toNative(),
    {
      sql: 'count(*) as user_count, status',
      bindings: [],
    }
  );
  t.deepEqual(
    raw('select * from users where id = ?', [1], clientMssql)
      .toSQL()
      .toNative(),
    {
      sql: 'select * from users where id = @p0',
      bindings: [1],
    }
  );
});

const { expect } = require('chai');

let tableSql;

const PG_Client = require('../../../lib/dialects/cockroachdb');
const client = new PG_Client({ client: 'pg' });

const equal = require('chai').assert.equal;

describe('CockroachDB SchemaBuilder', function () {
  it('create table with uuid primary key in one go', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('uuid_primary', function (table) {
        table.uuid('id', { primaryKey: true });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "uuid_primary" ("id" uuid primary key default gen_random_uuid())'
    );
  });

  it('drop unique if exists', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropUniqueIfExists('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'drop index if exists "users"@"users_foo_unique" cascade'
    );
  });

  it('drop unique if exists, custom', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropUniqueIfExists(null, 'foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'drop index if exists "users"@"foo" cascade'
    );
  });

  it('drop foreign if exists', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropForeignIfExists('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint if exists "users_foo_foreign"'
    );
  });

  it('drop primary if exists', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropPrimaryIfExists();
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint if exists "users_pkey"'
    );
  });
});

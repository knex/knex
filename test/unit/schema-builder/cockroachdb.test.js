let tableSql;

const PG_Client = require('../../../lib/dialects/cockroachdb');
const client = new PG_Client({ client: 'pg' });

describe('CockroachDB SchemaBuilder', function () {
  it('create table with uuid primary key in one go', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('uuid_primary', function (table) {
        table.uuid('id', { primaryKey: true });
      })
      .toSQL();
    expect(tableSql.length).toBe(1);
    expect(tableSql[0].sql).toBe(
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
    expect(tableSql.length).toBe(1);
    expect(tableSql[0].sql).toBe(
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
    expect(tableSql.length).toBe(1);
    expect(tableSql[0].sql).toBe(
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
    expect(tableSql.length).toBe(1);
    expect(tableSql[0].sql).toBe(
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
    expect(tableSql.length).toBe(1);
    expect(tableSql[0].sql).toBe(
      'alter table "users" drop constraint if exists "users_pkey"'
    );
  });
});

/*global describe, expect, it*/
/* eslint max-len:0 */

'use strict';

let tableSql;

const Redshift_Client = require('../../../lib/dialects/redshift');
const client          = new Redshift_Client({})

const equal  = require('assert').equal;

describe("Redshift SchemaBuilder", function() {

  it("fixes memoization regression", function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.uuid('key');
      table.increments('id');
      table.string('email');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table "users" ("key" char(36), "id" integer identity(1,1) primary key not null, "email" varchar(255))');
  });

  it("basic alter table", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.increments('id');
      table.string('email');
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "id" integer identity(1,1) primary key not null');
    expect(tableSql[1].sql).to.equal('alter table "users" add column "email" varchar(255)');
  });

  it("alter table with schema", function() {
    tableSql = client.schemaBuilder().withSchema('myschema').table('users', function(table) {
      table.increments('id');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "myschema"."users" add column "id" integer identity(1,1) primary key not null');
  });

  it("drop table", function() {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table "users"');
  });

  it("drop table with schema", function() {
    tableSql = client.schemaBuilder().withSchema('myschema').dropTable('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table "myschema"."users"');
  });

  it("drop table if exists", function() {
    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table if exists "users"');
  });

  it("drop table if exists with schema", function() {
    tableSql = client.schemaBuilder().withSchema('myschema').dropTableIfExists('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table if exists "myschema"."users"');
  });

  it("drop column", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropColumn('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo"');
  });

  it("drop multiple columns", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropColumn(['foo', 'bar']);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo", drop column "bar"');
  });

  it("drop multiple columns with arguments", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropColumn('foo', 'bar');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo", drop column "bar"');
  });

  it("drop primary", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropPrimary();
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "users_pkey"');
  });

  it("drop unique", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropUnique('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "users_foo_unique"');
  });

  it("drop unique, custom", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropUnique(null, 'foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "foo"');
  });

  it("drop index should be a no-op", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropIndex('foo');
    }).toSQL();
    equal(0, tableSql.length);
  });

  it("drop foreign", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropForeign('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "users_foo_foreign"');
  });

  it("drop foreign", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropForeign(null, 'foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "foo"');
  });

  it("drop timestamps", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropTimestamps();
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop column "created_at", drop column "updated_at"');
  });

  it("rename table", function() {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" rename to "foo"');
  });

  it("adding primary key", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.primary('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add constraint "users_pkey" primary key ("foo")');
  });

  it("adding primary key fluently", function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.string('name').primary();
      table.string('foo');
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table "users" ("name" varchar(255) not null, "foo" varchar(255))');
    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "users_pkey" primary key ("name")');
  });

  it("adding foreign key", function() {
    tableSql = client.schemaBuilder().createTable('accounts', function(table) {
      table.integer('account_id').references('users.id');
    }).toSQL();
    expect(tableSql[1].sql).to.equal('alter table "accounts" add constraint "accounts_account_id_foreign" foreign key ("account_id") references "users" ("id")');
  });

  it("adds foreign key with onUpdate and onDelete", function() {
    tableSql = client.schemaBuilder().createTable('person', function(table) {
      table.integer('user_id').notNull().references('users.id').onDelete('SET NULL');
      table.integer('account_id').notNull().references('id').inTable('accounts').onUpdate('cascade');
    }).toSQL();
    equal(3, tableSql.length);
    expect(tableSql[1].sql).to.equal('alter table "person" add constraint "person_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete SET NULL');
    expect(tableSql[2].sql).to.equal('alter table "person" add constraint "person_account_id_foreign" foreign key ("account_id") references "accounts" ("id") on update cascade');
  });

  it("adding unique key", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.unique('foo', 'bar');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add constraint "bar" unique ("foo")');
  });

  it("adding unique key fluently", function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.string('email').unique();
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table "users" ("email" varchar(255))');
    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "users_email_unique" unique ("email")');
  });

  it("adding index should be a no-op", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.index(['foo', 'bar'], 'baz');
    }).toSQL();
    equal(0, tableSql.length);
  });

  it("adding incrementing id", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.increments('id');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "id" integer identity(1,1) primary key not null');
  });

  it("adding big incrementing id", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.bigIncrements('id');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "id" bigint identity(1,1) primary key not null');
  });

  it("adding string", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.string('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(255)');
  });

  it("adding varchar with length", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.string('foo', 100);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(100)');
  });

  it("adding a string with a default", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.string('foo', 100).defaultTo('bar');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(100) default \'bar\'');
  });

  it("adding text", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.text('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(max)');
  });

  it("adding big integer", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.bigInteger('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bigint');
  });

  it("tests a big integer as the primary autoincrement key", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.bigIncrements('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bigint identity(1,1) primary key not null');
  });

  it("adding integer", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.integer('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" integer');
  });

  it("adding autoincrement integer", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.increments('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" integer identity(1,1) primary key not null');
  });

  it("adding medium integer", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.mediumint('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" integer');
  });

  it("adding tiny integer", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.tinyint('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" smallint');
  });

  it("adding small integer", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.smallint('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" smallint');
  });

  it("adding float", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.float('foo', 5, 2);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" real');
  });

  it("adding double", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.double('foo', 15, 8);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" double precision');
  });

  it("adding decimal", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.decimal('foo', 5, 2);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" decimal(5, 2)');
  });

  it("adding boolean", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.boolean('foo').defaultTo(false);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" boolean default \'0\'');
  });

  it("adding enum", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.enum('foo', ['bar', 'baz']);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(255)');
  });

  it("adding date", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.date('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" date');
  });

  it("adding date time", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dateTime('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" timestamptz');
  });

  it("adding time", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.time('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" time');
  });

  it("adding timestamp", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.timestamp('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" timestamptz');
  });

  it("adding timestamps", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.timestamps();
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "created_at" timestamptz');
    expect(tableSql[1].sql).to.equal('alter table "users" add column "updated_at" timestamptz');
  });

  it("adding timestamps with defaults", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.timestamps(false, true);
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "created_at" timestamptz not null default CURRENT_TIMESTAMP');
    expect(tableSql[1].sql).to.equal('alter table "users" add column "updated_at" timestamptz not null default CURRENT_TIMESTAMP');
  });

  it("adding binary", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.binary('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(max)');
  });

  it('adding jsonb', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.jsonb('preferences');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "user" add column "preferences" varchar(max)');
  });

  it('allows adding default json objects when the column is json', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.json('preferences').defaultTo({}).notNullable();
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "user" add column "preferences" varchar(max) not null {}');
  });

  it('sets specificType correctly', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.specificType('email', 'CITEXT').unique().notNullable();
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "user" add column "email" CITEXT not null');
  });

  it('allows creating an extension', function() {
    const sql = client.schemaBuilder().createExtension('test').toSQL();
    expect(sql[0].sql).to.equal('create extension "test"');
  });

  it('allows dropping an extension', function() {
    const sql = client.schemaBuilder().dropExtension('test').toSQL();
    expect(sql[0].sql).to.equal('drop extension "test"');
  });

  it('allows creating an extension only if it doesn\'t exist', function() {
    const sql = client.schemaBuilder().createExtensionIfNotExists('test').toSQL();
    expect(sql[0].sql).to.equal('create extension if not exists "test"');
  });

  it('allows dropping an extension only if it exists', function() {
    const sql = client.schemaBuilder().dropExtensionIfExists('test').toSQL();
    expect(sql[0].sql).to.equal('drop extension if exists "test"');
  });

  it('table inherits another table', function() {
    tableSql = client.schemaBuilder().createTable('inheriteeTable', function(t) {
      t.string('username');
      t.inherits('inheritedTable');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('create table "inheriteeTable" ("username" varchar(255)) like ("inheritedTable")');
  });

  it('should warn on disallowed method', function() {
    tableSql = client.schemaBuilder().createTable('users', function(t) {
      t.string('username');
      t.engine('myISAM');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('create table "users" ("username" varchar(255))');
  });

  it('#1430 - .primary & .dropPrimary takes columns and constraintName', function() {
    tableSql = client.schemaBuilder().table('users', function(t) {
      // t.string('test1').notNullable();
      t.string('test1');
      t.string('test2').notNullable();
      t.primary(['test1', 'test2'], 'testconstraintname');
    }).toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "test1" varchar(255)');
    expect(tableSql[1].sql).to.equal('alter table "users" add column "test2" varchar(255) not null');

    tableSql = client.schemaBuilder().table('users', function(t) {
      t.string('test1').notNullable();
      t.string('test2').notNullable();
      t.primary(['test1', 'test2'], 'testconstraintname');
    }).toSQL();

    expect(tableSql[0].sql).to.equal('alter table "users" add column "test1" varchar(255) not null');
    expect(tableSql[1].sql).to.equal('alter table "users" add column "test2" varchar(255) not null');
    expect(tableSql[2].sql).to.equal('alter table "users" add constraint "testconstraintname" primary key ("test1", "test2")');

    tableSql = client.schemaBuilder().createTable('users', function(t) {
      t.string('test').primary('testconstraintname');
    }).toSQL();

    expect(tableSql[0].sql).to.equal('create table "users" ("test" varchar(255) not null)');
    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "testconstraintname" primary key ("test")');
  });

});

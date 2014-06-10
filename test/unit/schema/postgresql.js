module.exports = function(client) {

  client.initSchema();

  var tableSql;
  var SchemaBuilder = client.SchemaBuilder;
  var _ = require('lodash');
  var equal = require('assert').equal;
  var deepEqual = require('assert').deepEqual;

  describe("PostgreSQL SchemaBuilder", function() {

    it("fixes memoization regression", function() {
      tableSql = new SchemaBuilder().createTable('users', function(table) {
        table.uuid('key');
        table.increments('id');
        table.string('email');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('create table "users" ("key" uuid, "id" serial primary key, "email" varchar(255))');
    });

    it("basic alter table", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.increments('id');
        table.string('email');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "id" serial primary key, add column "email" varchar(255)');
    });

    it("drop table", function() {
      tableSql = new SchemaBuilder().dropTable('users').toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop table "users"');
    });

    it("drop table if exists", function() {
      tableSql = new SchemaBuilder().dropTableIfExists('users').toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop table if exists "users"');
    });

    it("drop column", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropColumn('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo"');
    });

    it("drop multiple columns", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropColumn(['foo', 'bar']);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo", drop column "bar"');
    });

    it("drop multiple columns with arguments", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropColumn('foo', 'bar');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo", drop column "bar"');
    });

    it("drop primary", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropPrimary();
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint users_pkey');
    });

    it("drop unique", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropUnique('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint users_foo_unique');
    });

    it("drop unique, custom", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropUnique(null, 'foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint foo');
    });

    it("drop index", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropIndex('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop index users_foo_index');
    });

    it("drop index, custom", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropIndex(null, 'foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop index foo');
    });

    it("drop foreign", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropForeign('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint users_foo_foreign');
    });

    it("drop foreign", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropForeign(null, 'foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint foo');
    });

    it("drop timestamps", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dropTimestamps();
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop column "created_at", drop column "updated_at"');
    });

    it("rename table", function() {
      tableSql = new SchemaBuilder().renameTable('users', 'foo').toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" rename to "foo"');
    });

    it("adding primary key", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.primary('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add primary key ("foo")');
    });

    it("adding primary key fluently", function() {
      tableSql = new SchemaBuilder().createTable('users', function(table) {
        table.string('name').primary();
      }).toSQL();
      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal('create table "users" ("name" varchar(255))');
      expect(tableSql[1].sql).to.equal('alter table "users" add primary key ("name")');
    });

    it("adding foreign key", function() {
      tableSql = new SchemaBuilder().createTable('accounts', function(table) {
        table.integer('account_id').references('users.id');
      }).toSQL();
      expect(tableSql[1].sql).to.equal('alter table "accounts" add constraint accounts_account_id_foreign foreign key ("account_id") references "users" ("id")');
    });

    it("adding unique key", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.unique('foo', 'bar');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add constraint bar unique ("foo")');
    });

    it("adding unique key fluently", function() {
      tableSql = new SchemaBuilder().createTable('users', function(table) {
        table.string('email').unique();
      }).toSQL();
      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal('create table "users" ("email" varchar(255))');
      expect(tableSql[1].sql).to.equal('alter table "users" add constraint users_email_unique unique ("email")');
    });

    it("adding index without value", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.index(['foo', 'bar']);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('create index users_foo_bar_index on "users" ("foo", "bar")');
    });

    it("adding index", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.index(['foo', 'bar'], 'baz');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('create index baz on "users" ("foo", "bar")');
    });

    it("adding index fluently", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.string('name').index();
      }).toSQL();
      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "name" varchar(255)');
      expect(tableSql[1].sql).to.equal('create index users_name_index on "users" ("name")');
    });

    it("adding incrementing id", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.increments('id');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "id" serial primary key');
    });

    it("adding big incrementing id", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.bigIncrements('id');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "id" bigserial primary key');
    });

    it("adding string", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.string('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(255)');
    });

    it("adding varchar with length", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.string('foo', 100);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(100)');
    });

    it("adding a string with a default", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.string('foo', 100).defaultTo('bar');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" varchar(100) default \'bar\'');
    });

    it("adding text", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.text('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" text');
    });

    it("adding big integer", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.bigInteger('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bigint');
    });

    it("tests a big integer as the primary autoincrement key", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.bigIncrements('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bigserial primary key');
    });

    it("adding integer", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.integer('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" integer');
    });

    it("adding autoincrement integer", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.increments('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" serial primary key');
    });

    it("adding medium integer", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.mediumint('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" integer');
    });

    it("adding tiny integer", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.tinyint('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" smallint');
    });

    it("adding small integer", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.smallint('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" smallint');
    });

    it("adding float", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.float('foo', 5, 2);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" real');
    });

    it("adding double", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.double('foo', 15, 8);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" double precision');
    });

    it("adding decimal", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.decimal('foo', 5, 2);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" decimal(5, 2)');
    });

    it("adding boolean", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.boolean('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" boolean');
    });

    it("adding enum", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.enum('foo', ['bar', 'baz']);
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" text check (foo in (\'bar\', \'baz\'))');
    });

    it("adding date", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.date('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" date');
    });

    it("adding date time", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.dateTime('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" timestamptz');
    });

    it("adding time", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.time('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" time');
    });

    it("adding timestamp", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.timestamp('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" timestamptz');
    });

    it("adding timestamps", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.timestamps();
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "created_at" timestamptz, add column "updated_at" timestamptz');
    });

    it("adding binary", function() {
      tableSql = new SchemaBuilder().table('users', function(table) {
        table.binary('foo');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bytea');
    });

    it('allows adding default json objects when the column is json', function() {
      tableSql = new SchemaBuilder().table('user', function(t) {
        t.json('preferences').defaultTo({}).notNullable();
      }).toSQL();
      expect(tableSql[0].sql).to.equal('alter table "user" add column "preferences" json not null {}');
    });

    it('sets specificType correctly', function() {
      tableSql = new SchemaBuilder().table('user', function(t) {
        t.specificType('email', 'CITEXT').unique().notNullable();
      }).toSQL();
      expect(tableSql[0].sql).to.equal('alter table "user" add column "email" CITEXT not null');
    });

  });

};
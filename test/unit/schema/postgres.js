/*global describe, expect, it*/

'use strict';

var tableSql;

var sinon = require('sinon');
var PG_Client = require('../../../lib/dialects/postgres');
var client    = new PG_Client({});
var knex = require('../../../knex');

var equal  = require('assert').equal;

describe('PostgreSQL Config', function() {
  var knexInstance;
  var version;
  var config = {
    client: 'pg',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test'
    }
  };
  describe('check version', function() {
    describe('check version < 9.2', function() {
      beforeEach(function () {
        version = '7.2';
        config.version = version;
        knexInstance = knex(config);
      });

      it('client.version', function(){
        expect(knexInstance.client.version).to.equal(version);
      });

      it('json', function() {
        tableSql = knexInstance.schema.table('public', function(t) {
          t.json('test_name');
        }).toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal('alter table "public" add column "test_name" text');
      });

      it('jsonb', function() {
        tableSql = knexInstance.schema.table('public', function (t) {
          t.jsonb('test_name');
        }).toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal('alter table "public" add column "test_name" text');
      });
    });

    describe('check version >= 9.2', function() {
      beforeEach(function() {
        version = '9.5';
        config.version = version;
        knexInstance = knex(config);
      });

      it('client.version', function(){
        expect(knexInstance.client.version).to.equal(version);
      });

      it('json', function() {
        tableSql = knexInstance.schema.table('public', function(t) {
          t.json('test_name');
        }).toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal('alter table "public" add column "test_name" json');
      });

      it('jsonb', function() {
        tableSql = knexInstance.schema.table('public', function(t) {
          t.jsonb('test_name');
        }).toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal('alter table "public" add column "test_name" jsonb');
      });
    });
  });
});

describe("PostgreSQL SchemaBuilder", function() {

  it("fixes memoization regression", function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.uuid('key');
      table.increments('id');
      table.string('email');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table "users" ("key" uuid, "id" serial primary key, "email" varchar(255))');
  });

  it("basic alter table", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.increments('id');
      table.string('email');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "id" serial primary key, add column "email" varchar(255)');
  });

  it('should alter columns with the alter flag', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo').notNullable().default('foo').alter();
      this.integer('bar').alter();
    }).toSQL();

    equal(8, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" alter column "foo" drop default');
    expect(tableSql[1].sql).to.equal('alter table "users" alter column "foo" drop not null');
    expect(tableSql[2].sql).to.equal('alter table "users" alter column "foo" type varchar(255) using ("foo"::varchar(255))');
    expect(tableSql[3].sql).to.equal('alter table "users" alter column "foo" set default \'foo\'');
    expect(tableSql[4].sql).to.equal('alter table "users" alter column "foo" set not null');
    expect(tableSql[5].sql).to.equal('alter table "users" alter column "bar" drop default');
    expect(tableSql[6].sql).to.equal('alter table "users" alter column "bar" drop not null');
    expect(tableSql[7].sql).to.equal('alter table "users" alter column "bar" type integer using ("bar"::integer)');
  });

  it("alter table with schema", function() {
    tableSql = client.schemaBuilder().withSchema('myschema').table('users', function(table) {
      table.increments('id');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "myschema"."users" add column "id" serial primary key');
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

  it("drop index", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropIndex('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "users_foo_index"');
  });

  it("drop index, custom", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.dropIndex(null, 'foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "foo"');
  });

  it("drop index, with schema", function() {
    tableSql = client.schemaBuilder().withSchema('mySchema').table('users', function(table) {
      table.dropIndex('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "mySchema"."users_foo_index"');
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

  it("rename column", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.renameColumn('foo', 'bar');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" rename "foo" to "bar"');
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
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('create table "users" ("name" varchar(255))');
    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "users_pkey" primary key ("name")');
  });

  it("adding foreign key", function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.foreign('foo_id').references('id').on('orders');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add constraint "users_foo_id_foreign" foreign key ("foo_id") references "orders" ("id")');

    tableSql = client.schemaBuilder().table('users', function() {
      this.integer('foo_id').references('id').on('orders');
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo_id" integer');
    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "users_foo_id_foreign" foreign key ("foo_id") references "orders" ("id")');
  });

  it('adding foreign key with specific identifier', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.foreign('foo_id', 'fk_foo').references('id').on('orders');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add constraint "fk_foo" foreign key ("foo_id") references "orders" ("id")');

    tableSql = client.schemaBuilder().table('users', function() {
      this.integer('foo_id').references('id').on('orders').withKeyName('fk_foo');
    }).toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo_id" integer');
    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "fk_foo" foreign key ("foo_id") references "orders" ("id")');
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

  it("adding index without value", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.index(['foo', 'bar']);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create index "users_foo_bar_index" on "users" ("foo", "bar")');
  });

  it("adding index", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.index(['foo', 'bar'], 'baz');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create index "baz" on "users" ("foo", "bar")');
  });

  it("adding index fluently", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.string('name').index();
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "name" varchar(255)');
    expect(tableSql[1].sql).to.equal('create index "users_name_index" on "users" ("name")');
  });

  it("adding index with an index type", function() {
     tableSql = client.schemaBuilder().table('users', function(table) {
      table.index(['foo', 'bar'], 'baz', 'gist');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('create index "baz" on "users" using gist ("foo", "bar")');
  });

  it("adding index with an index type fluently", function() {
     tableSql = client.schemaBuilder().table('users', function(table) {
      table.string('name').index('baz', 'gist');
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "name" varchar(255)');
    expect(tableSql[1].sql).to.equal('create index "baz" on "users" using gist ("name")');
  });

  it("adding index with an index type and default name fluently", function() {
     tableSql = client.schemaBuilder().table('users', function(table) {
      table.string('name').index(null, 'gist');
    }).toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "name" varchar(255)');
    expect(tableSql[1].sql).to.equal('create index "users_name_index" on "users" using gist ("name")');
  });

  it("adding incrementing id", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.increments('id');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "id" serial primary key');
  });

  it("adding big incrementing id", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.bigIncrements('id');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "id" bigserial primary key');
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
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" text');
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
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bigserial primary key');
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
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" serial primary key');
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

  it("adding decimal, variable precision", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.decimal('foo', null);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" decimal');
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
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" text check ("foo" in (\'bar\', \'baz\'))');
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
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "created_at" timestamptz, add column "updated_at" timestamptz');
  });

  it("adding timestamps with defaults", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.timestamps(false, true);
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "created_at" timestamptz not null default CURRENT_TIMESTAMP, add column "updated_at" timestamptz not null default CURRENT_TIMESTAMP');
  });

  it("adding binary", function() {
    tableSql = client.schemaBuilder().table('users', function(table) {
      table.binary('foo');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add column "foo" bytea');
  });

  it('adding jsonb', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.jsonb('preferences');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "user" add column "preferences" jsonb');
  });

  it('set comment', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.comment('Custom comment');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('comment on table "user" is \'Custom comment\'');
  });

  it('set empty comment', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.comment('');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('comment on table "user" is \'\'');
  });

  it('set comment to undefined', function() {
    expect(function() {
      client.schemaBuilder().table('user', function(t) {
        t.comment();
      }).toSQL();
    })
    .to.throw(TypeError);
  });

  it('set comment to null', function() {
    expect(function() {
      client.schemaBuilder().table('user', function(t) {
        t.comment(null);
      }).toSQL();
    })
    .to.throw(TypeError);
  });

  it('allows adding default json objects when the column is json', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.json('preferences').defaultTo({}).notNullable();
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "user" add column "preferences" json not null {}');
  });

  it('sets specificType correctly', function() {
    tableSql = client.schemaBuilder().table('user', function(t) {
      t.specificType('email', 'CITEXT').unique().notNullable();
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "user" add column "email" CITEXT not null');
  });

  it('allows creating an extension', function() {
    var sql = client.schemaBuilder().createExtension('test').toSQL();
    expect(sql[0].sql).to.equal('create extension "test"');
  });

  it('allows dropping an extension', function() {
    var sql = client.schemaBuilder().dropExtension('test').toSQL();
    expect(sql[0].sql).to.equal('drop extension "test"');
  });

  it('allows creating an extension only if it doesn\'t exist', function() {
    var sql = client.schemaBuilder().createExtensionIfNotExists('test').toSQL();
    expect(sql[0].sql).to.equal('create extension if not exists "test"');
  });

  it('allows dropping an extension only if it exists', function() {
    var sql = client.schemaBuilder().dropExtensionIfExists('test').toSQL();
    expect(sql[0].sql).to.equal('drop extension if exists "test"');
  });

  it('table inherits another table', function() {
    tableSql = client.schemaBuilder().createTable('inheriteeTable', function(t) {
      t.string('username');
      t.inherits('inheritedTable');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('create table "inheriteeTable" ("username" varchar(255)) inherits ("inheritedTable")');
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
      t.primary(['test1', 'test2'], 'testconstraintname');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('alter table "users" add constraint "testconstraintname" primary key ("test1", "test2")');

    tableSql = client.schemaBuilder().createTable('users', function(t) {
      t.string('test').primary('testconstraintname');
    }).toSQL();

    expect(tableSql[1].sql).to.equal('alter table "users" add constraint "testconstraintname" primary key ("test")');
  });

  describe('queryContext', function () {
    let spy;
    let originalWrapIdentifier;

    before(function () {
      spy = sinon.spy();
      originalWrapIdentifier = client.config.wrapIdentifier;
      client.config.wrapIdentifier = function (value, wrap, queryContext) {
        spy(value, queryContext);
        return wrap(value);
      };
    });

    beforeEach(function () {
      spy.reset();
    });

    after(function () {
      client.config.wrapIdentifier = originalWrapIdentifier;
    });

    it('SchemaCompiler passes queryContext to wrapIdentifier via TableCompiler', function () {
      client
        .schemaBuilder()
        .queryContext('table context')
        .createTable('users', function (table) {
          table.increments('id');
          table.string('email');
        })
        .toSQL();

      expect(spy.callCount).to.equal(3);
      expect(spy.firstCall.args).to.deep.equal(['id', 'table context']);
      expect(spy.secondCall.args).to.deep.equal(['email', 'table context']);
      expect(spy.thirdCall.args).to.deep.equal(['users', 'table context']);
    });

    it('TableCompiler passes queryContext to wrapIdentifier', function () {
      client
        .schemaBuilder()
        .createTable('users', function (table) {
          table.increments('id').queryContext('id context');
          table.string('email').queryContext('email context');
        })
        .toSQL();

      expect(spy.callCount).to.equal(3);
      expect(spy.firstCall.args).to.deep.equal(['id', 'id context']);
      expect(spy.secondCall.args).to.deep.equal(['email', 'email context']);
      expect(spy.thirdCall.args).to.deep.equal(['users', undefined]);
    });

    it('TableCompiler allows overwriting queryContext from SchemaCompiler', function () {
      client
        .schemaBuilder()
        .queryContext('schema context')
        .createTable('users', function (table) {
          table.queryContext('table context');
          table.increments('id');
          table.string('email');
        })
        .toSQL();

      expect(spy.callCount).to.equal(3);
      expect(spy.firstCall.args).to.deep.equal(['id', 'table context']);
      expect(spy.secondCall.args).to.deep.equal(['email', 'table context']);
      expect(spy.thirdCall.args).to.deep.equal(['users', 'table context']);
    });

    it('ColumnCompiler allows overwriting queryContext from TableCompiler', function () {
      client
        .schemaBuilder()
        .queryContext('schema context')
        .createTable('users', function (table) {
          table.queryContext('table context');
          table.increments('id').queryContext('id context');
          table.string('email').queryContext('email context');
        })
        .toSQL();

      expect(spy.callCount).to.equal(3);
      expect(spy.firstCall.args).to.deep.equal(['id', 'id context']);
      expect(spy.secondCall.args).to.deep.equal(['email', 'email context']);
      expect(spy.thirdCall.args).to.deep.equal(['users', 'table context']);
    });
  });

});

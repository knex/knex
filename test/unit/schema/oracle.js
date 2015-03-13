/*global it, describe, expect*/

'use strict';

module.exports = function(client) {

  var knex = require('../../../knex');

  client.initSchema();

  describe("Oracle SchemaBuilder", function() {

    client.initSchema();

    var tableSql;
    var SchemaBuilder = client.SchemaBuilder;
    var equal = require('assert').equal;

    it('test basic create table with charset and collate', function() {
      tableSql = new SchemaBuilder().createTable('users', function(table) {
        table.increments('id');
        table.string('email');
      });

      equal(3, tableSql.toSQL().length);
      expect(tableSql.toSQL()[0].sql).to.equal('create table "users" ("id" integer not null primary key, "email" varchar2(255))');
      expect(tableSql.toSQL()[1].sql).to.equal("begin execute immediate 'create sequence \"users_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;");
      expect(tableSql.toSQL()[2].sql).to.equal("create or replace trigger \"users_id_trg\" before insert on \"users\" for each row when (new.\"id\" is null)  begin select \"users_seq\".nextval into :new.\"id\" from dual; end;");
    });

    it('test basic create table if not exists', function() {
      tableSql = new SchemaBuilder().createTableIfNotExists('users', function(table) {
        table.increments('id');
        table.string('email');
      });

      equal(3, tableSql.toSQL().length);
      expect(tableSql.toSQL()[0].sql).to.equal("begin execute immediate 'create table \"users\" (\"id\" integer not null primary key, \"email\" varchar2(255))'; exception when others then if sqlcode != -955 then raise; end if; end;");
      expect(tableSql.toSQL()[1].sql).to.equal("begin execute immediate 'create sequence \"users_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;");
      expect(tableSql.toSQL()[2].sql).to.equal("create or replace trigger \"users_id_trg\" before insert on \"users\" for each row when (new.\"id\" is null)  begin select \"users_seq\".nextval into :new.\"id\" from dual; end;");
    });

    it('test drop table', function() {
      tableSql = new SchemaBuilder().dropTable('users').toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop table "users"');
      expect(tableSql[1].sql).to.equal("begin execute immediate 'drop sequence \"users_seq\"'; exception when others then if sqlcode != -2289 then raise; end if; end;");
    });

    it('test drop table if exists', function() {
      tableSql = new SchemaBuilder().dropTableIfExists('users').toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal("begin execute immediate 'drop table \"users\"'; exception when others then if sqlcode != -942 then raise; end if; end;");
      expect(tableSql[1].sql).to.equal("begin execute immediate 'drop sequence \"users_seq\"'; exception when others then if sqlcode != -2289 then raise; end if; end;");
    });

    it('test drop column', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropColumn('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop ("foo")');
    });

    it('drops multiple columns with an array', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropColumn(['foo', 'bar']);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop ("foo", "bar")');
    });

    it('drops multiple columns as multiple arguments', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropColumn('foo', 'bar');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop ("foo", "bar")');
    });

    it('test drop primary', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropPrimary();
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop primary key');
    });

    it('test drop unique', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropUnique('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "users_foo_unique"');
    });

    it('test drop unique, custom', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropUnique(null, 'foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "foo"');
    });

    it('test drop index', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropIndex('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop index "users_foo_index"');
    });

    it('test drop index, custom', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropIndex(null, 'foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop index "foo"');
    });

    it('test drop foreign', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropForeign('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "users_foo_foreign"');
    });

    it('test drop foreign, custom', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropForeign(null, 'foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop constraint "foo"');
    });

    it('test drop timestamps', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dropTimestamps();
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" drop ("created_at", "updated_at")');
    });

    it("rename table", function() {
      tableSql = new SchemaBuilder().renameTable('users', 'foo').toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('rename "users" to "foo"');
    });

    it('test adding primary key', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.primary('foo', 'bar');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add primary key ("foo")');
    });

    it('test adding unique key', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.unique('foo', 'bar');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add constraint "bar" unique ("foo")');
    });

    it('test adding index', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.index(['foo', 'bar'], 'baz');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('create index "baz" on "users" ("foo", "bar")');
    });

    it('test adding foreign key', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.foreign('foo_id').references('id').on('orders');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add constraint "users_foo_id_foreign" foreign key ("foo_id") references "orders" ("id")');
    });

    it("adds foreign key with onUpdate and onDelete", function() {
      tableSql = new SchemaBuilder().createTable('person', function(table) {
        table.integer('user_id').notNull().references('users.id').onDelete('SET NULL');
        table.integer('account_id').notNull().references('id').inTable('accounts').onUpdate('cascade');
      }).toSQL();
      equal(3, tableSql.length);
      expect(tableSql[1].sql).to.equal('alter table "person" add constraint "person_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete SET NULL');
      expect(tableSql[2].sql).to.equal('alter table "person" add constraint "person_account_id_foreign" foreign key ("account_id") references "accounts" ("id") on update cascade');
    });

    it('test adding incrementing id', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.increments('id');
      }).toSQL();

      equal(3, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "id" integer not null primary key');
      expect(tableSql[1].sql).to.equal("begin execute immediate 'create sequence \"users_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;");
      expect(tableSql[2].sql).to.equal("create or replace trigger \"users_id_trg\" before insert on \"users\" for each row when (new.\"id\" is null)  begin select \"users_seq\".nextval into :new.\"id\" from dual; end;");
    });

    it('test adding big incrementing id', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.bigIncrements('id');
      }).toSQL();

      equal(3, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "id" number(20, 0) not null primary key');
      expect(tableSql[1].sql).to.equal("begin execute immediate 'create sequence \"users_seq\"'; exception when others then if sqlcode != -955 then raise; end if; end;");
      expect(tableSql[2].sql).to.equal("create or replace trigger \"users_id_trg\" before insert on \"users\" for each row when (new.\"id\" is null)  begin select \"users_seq\".nextval into :new.\"id\" from dual; end;");
    });

    it('test rename column', function() {
      tableSql = new SchemaBuilder().table('users', function () {
        this.renameColumn('foo', 'bar');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" rename column "foo" to "bar"');
    });

    it('test adding string', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.string('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" varchar2(255)');
    });

    it('uses the varchar column constraint', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.string('foo', 100);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" varchar2(100)');
    });

    it('chains notNull and defaultTo', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.string('foo', 100).notNull().defaultTo('bar');
      }).toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" varchar2(100) default \'bar\' not null');
    });

    it('allows for raw values in the default field', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.string('foo', 100).nullable().defaultTo(knex.raw('CURRENT TIMESTAMP'));
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" varchar2(100) default CURRENT TIMESTAMP null');
    });

    it('test adding text', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.text('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" clob');
    });

    it('test adding big integer', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.bigInteger('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" number(20, 0)');
    });

    it('test adding integer', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.integer('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" integer');
    });

    it('test adding medium integer', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.mediumint('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" integer');
    });

    it('test adding small integer', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.smallint('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" smallint');
    });

    it('test adding tiny integer', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.tinyint('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" smallint');
    });

    it('test adding default float', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.float('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" float');
    });

    it('test adding float with precision', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.float('foo', 5);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" float(5)');
    });

    it('test adding double', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.double('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" number(8, 2)');
    });

    it('test adding double specifying precision', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.double('foo', 15, 8);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" number(15, 8)');
    });

    it('test adding decimal', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.decimal('foo', 5, 2);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" decimal(5, 2)');
    });

    it('test adding boolean', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.boolean('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" number(1, 0) check ("foo" in (\'0\', \'1\'))');
    });

    it('test adding enum', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.enum('foo', ['bar', 'baz']);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" varchar2(3) check ("foo" in (\'bar\', \'baz\'))');
    });

    it('test adding date', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.date('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" date');
    });

    it('test adding date time', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.dateTime('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" timestamp');
    });

    it('test adding time', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.time('foo');
      }).toSQL();

      // oracle does not support time

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" timestamp');
    });

    it('test adding time stamp', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.timestamp('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" timestamp');
    });

    it('test adding time stamps', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.timestamps();
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "created_at" timestamp, add "updated_at" timestamp');
    });

    it('test adding binary', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.binary('foo');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" blob');
    });

    it('test adding decimal', function() {
      tableSql = new SchemaBuilder().table('users', function() {
        this.decimal('foo', 2, 6);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "users" add "foo" decimal(2, 6)');
    });

    it('is possible to set raw statements in defaultTo, #146', function() {
      tableSql = new SchemaBuilder().createTable('default_raw_test', function(t) {
        t.timestamp('created_at').defaultTo(knex.raw('CURRENT_TIMESTAMP'));
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('create table "default_raw_test" ("created_at" timestamp default CURRENT_TIMESTAMP)');
    });

    it('allows dropping a unique compound index with too long generated name', function() {
      tableSql = new SchemaBuilder().table('composite_key_test', function(t) {
        t.dropUnique(['column_a', 'column_b']);
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "composite_key_test" drop constraint "zYmMt0VQwlLZ20XnrMicXZ0ufZk"');
    });

    it('allows dropping a unique compound index with specified name', function() {
      tableSql = new SchemaBuilder().table('composite_key_test', function(t) {
        t.dropUnique(['column_a', 'column_b'], 'ckt_unique');
      }).toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table "composite_key_test" drop constraint "ckt_unique"');
    });

  });
};

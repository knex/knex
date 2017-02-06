/*global describe, expect, it*/

'use strict';

var MSSQL_Client  = require('../../../lib/dialects/mssql');
var client = new MSSQL_Client();

describe("MSSQL SchemaBuilder", function() {

  var tableSql;
  var equal = require('assert').equal;

  it('test basic create table with charset and collate', function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.increments('id');
      table.string('email');
      table.charset('utf8');
      table.collate('utf8_unicode_ci');
    });

    equal(1, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal('CREATE TABLE [users] ([id] int identity(1,1) not null primary key, [email] nvarchar(255))');
    expect(tableSql.toQuery()).to.equal('CREATE TABLE [users] ([id] int identity(1,1) not null primary key, [email] nvarchar(255))');
  });

  it('basic create table without charset or collate', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.increments('id');
      this.string('email');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [id] int identity(1,1) not null primary key, [email] nvarchar(255)');
  });

  it('test drop table', function() {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('DROP TABLE [users]');
  });

  it('test drop table if exists', function() {
    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal("if object_id('[users]', 'U') is not null DROP TABLE [users]");
  });

  it('test drop column', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP COLUMN [foo]');
  });

  it('drops multiple columns with an array', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn(['foo', 'bar']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP COLUMN [foo], [bar]');
  });

  it('drops multiple columns as multiple arguments', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP COLUMN [foo], [bar]');
  });

  it('test drop primary', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropPrimary('testconstraintname');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP CONSTRAINT [testconstraintname]');
  });

  it('test drop unique', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropUnique('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP CONSTRAINT [users_foo_unique]');
  });

  it('should alter columns with the alter flag', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo').alter();
      this.string('bar');
    }).toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [bar] nvarchar(255)');
    expect(tableSql[1].sql).to.equal('ALTER TABLE [users] alter column [foo] nvarchar(255)');
  });

  it('test drop unique, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropUnique(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP CONSTRAINT [foo]');
  });

  it('test drop index', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropIndex('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('DROP INDEX [users_foo_index] ON [users]');
  });

  it('test drop index, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropIndex(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('DROP INDEX [foo] ON [users]');
  });

  it('test drop foreign', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropForeign('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP CONSTRAINT [users_foo_foreign]');
  });

  it('test drop foreign, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropForeign(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP CONSTRAINT [foo]');
  });

  it('test drop timestamps', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropTimestamps();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] DROP COLUMN [created_at], [updated_at]');
  });

  it('test rename table', function() {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('exec sp_rename ?, ?');
    expect(tableSql[0].bindings[0]).to.equal('users');
    expect(tableSql[0].bindings[1]).to.equal('foo');
  });

  it('test adding primary key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.primary('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD CONSTRAINT [bar] PRIMARY KEY ([foo])');
  });

  it('test adding unique key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.unique('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('CREATE UNIQUE INDEX [bar] ON [users] ([foo])');
  });

  it('test adding index', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.index(['foo', 'bar'], 'baz');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('CREATE INDEX [baz] ON [users] ([foo], [bar])');
  });

  it('test adding foreign key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.foreign('foo_id').references('id').on('orders');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD CONSTRAINT [users_foo_id_foreign] FOREIGN KEY ([foo_id]) REFERENCES [orders] ([id])');
  });

  it("adds foreign key with onUpdate and onDelete", function() {
    tableSql = client.schemaBuilder().createTable('person', function(table) {
      table.integer('user_id').notNull().references('users.id').onDelete('SET NULL');
      table.integer('account_id').notNull().references('id').inTable('accounts').onUpdate('cascade');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('CREATE TABLE [person] ([user_id] int not null, [account_id] int not null, CONSTRAINT [person_user_id_foreign] FOREIGN KEY ([user_id]) REFERENCES [users] ([id]) ON DELETE SET NULL, CONSTRAINT [person_account_id_foreign] FOREIGN KEY ([account_id]) REFERENCES [accounts] ([id]) ON UPDATE cascade)');
  });

  it('test adding incrementing id', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.increments('id');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [id] int identity(1,1) not null primary key');
  });

  it('test adding big incrementing id', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.bigIncrements('id');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [id] bigint identity(1,1) not null primary key');
  });

  it('test adding column after another column', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('name').after('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [name] nvarchar(255)');
  });

  it('test adding column on the first place', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('first_name').first();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [first_name] nvarchar(255)');
  });

  it('test adding string', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] nvarchar(255)');
  });

  it('uses the varchar column constraint', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo', 100);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] nvarchar(100)');
  });

  it('chains notNull and defaultTo', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo', 100).notNull().defaultTo('bar');
    }).toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] nvarchar(100) not null default \'bar\'');
  });

  it('allows for raw values in the default field', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.string('foo', 100).nullable().defaultTo(client.raw('CURRENT TIMESTAMP'));
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] nvarchar(100) null default CURRENT TIMESTAMP');
  });

  it('test adding text', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.text('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] nvarchar(max)');
  });

  it('test adding big integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.bigInteger('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] bigint');
  });

  it('test adding integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.integer('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] int');
  });

  it('test adding medium integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.mediumint('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] int');
  });

  it('test adding small integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.smallint('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] smallint');
  });

  it('test adding tiny integer', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.tinyint('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] tinyint');
  });

  it('test adding float', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.float('foo', 5, 2);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] decimal(5, 2)');
  });

  it('test adding double', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.double('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] decimal');
  });

  it('test adding double specifying precision', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.double('foo', 15, 8);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] decimal(15, 8)');
  });

  it('test adding decimal', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.decimal('foo', 5, 2);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] decimal(5, 2)');
  });

  it('test adding boolean', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.boolean('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] bit');
  });

  it('test adding enum', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.enum('foo', ['bar', 'baz']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] nvarchar(100)');
  });

  it('test adding date', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.date('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] date');
  });

  it('test adding date time', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dateTime('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] datetime');
  });

  it('test adding time', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.time('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] time');
  });

  it('test adding time stamp', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.timestamp('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] datetime');
  });

  it('test adding time stamps', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.timestamps();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [created_at] datetime, [updated_at] datetime');
  });

  it('test adding binary', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.binary('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] varbinary(max)');
  });

  it('test adding decimal', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.decimal('foo', 2, 6);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] decimal(2, 6)');
  });

  it('test adding multiple columns, #1348', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.integer('foo');
      this.integer('baa');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD [foo] int, [baa] int');
  });

  it('is possible to set raw statements in defaultTo, #146', function() {
    tableSql = client.schemaBuilder().createTable('default_raw_test', function(t) {
      t.timestamp('created_at').defaultTo(client.raw('GETDATE()'));
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('CREATE TABLE [default_raw_test] ([created_at] datetime default GETDATE())');
  });

  it('allows dropping a unique compound index', function() {
    tableSql = client.schemaBuilder().table('composite_key_test', function(t) {
      t.dropUnique(['column_a', 'column_b']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('ALTER TABLE [composite_key_test] DROP CONSTRAINT [composite_key_test_column_a_column_b_unique]');
  });

  it('allows default as alias for defaultTo', function() {
    tableSql = client.schemaBuilder().createTable('default_raw_test', function(t) {
      t.timestamp('created_at').default(client.raw('GETDATE()'));
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('CREATE TABLE [default_raw_test] ([created_at] datetime default GETDATE())');
  });


  it('#1430 - .primary & .dropPrimary takes columns and constraintName', function() {
    tableSql = client.schemaBuilder().table('users', function(t) {
      t.primary(['test1', 'test2'], 'testconstraintname');
    }).toSQL();
    expect(tableSql[0].sql).to.equal('ALTER TABLE [users] ADD CONSTRAINT [testconstraintname] PRIMARY KEY ([test1], [test2])');

    tableSql = client.schemaBuilder().createTable('users', function(t) {
      t.string('test').primary('testconstraintname');
    }).toSQL();

    expect(tableSql[0].sql).to.equal('CREATE TABLE [users] ([test] nvarchar(255), CONSTRAINT [testconstraintname] PRIMARY KEY ([test]))');
  });

});

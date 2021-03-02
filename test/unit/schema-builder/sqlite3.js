'use strict';

const { expect } = require('chai');

let tableSql;

const sinon = require('sinon');
const SQLite3_Client = require('../../../lib/dialects/sqlite3');
const client = new SQLite3_Client({ client: 'sqlite3' });
const SQLite3_DDL = require('../../../lib/dialects/sqlite3/schema/ddl');
const {
  parseCreateTable,
  parseCreateIndex,
} = require('../../../lib/dialects/sqlite3/schema/internal/parser');
const {
  compileCreateTable,
  compileCreateIndex,
} = require('../../../lib/dialects/sqlite3/schema/internal/compiler');

const _ = require('lodash');
const { equal, deepEqual } = require('assert');

describe('SQLite SchemaBuilder', function () {
  it('basic create table', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.increments('id');
        table.string('email');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`id` integer not null primary key autoincrement, `email` varchar(255))'
    );
  });

  it('create json table', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('user', function (table) {
        table.json('preferences');
      })
      .table('user', function (t) {})
      .toSQL();
    expect(tableSql[0].sql).to.equal(
      'create table `user` (`preferences` json)'
    );
  });

  it('basic create table without primary key', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.increments('id');
        table.increments('other_id', { primaryKey: false });
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`id` integer not null primary key autoincrement, `other_id` integer not null autoincrement)'
    );
  });

  it('basic alter table', function () {
    tableSql = client
      .schemaBuilder()
      .alterTable('users', function (table) {
        table.increments('id');
        table.string('email');
      })
      .toSQL();

    equal(2, tableSql.length);
    const expected = [
      'alter table `users` add column `id` integer not null primary key autoincrement',
      'alter table `users` add column `email` varchar(255)',
    ];
    expect(expected).to.eql(_.map(tableSql, 'sql'));
  });

  it('drop table', function () {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();
    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'drop table `users`');
  });

  it('drop table if exists', function () {
    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'drop table if exists `users`');
  });

  it('drop unique', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropUnique('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'drop index `users_foo_unique`');
  });

  it('drop unique, custom', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropUnique(null, 'foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'drop index `foo`');
  });

  it('drop index', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropIndex('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'drop index `users_foo_index`');
  });

  it('drop index, custom', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropIndex(null, 'foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'drop index `foo`');
  });

  it('rename table', function () {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` rename to `foo`');
  });

  it('adding primary key', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo');
        table.primary('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), primary key (`foo`))'
    );
  });

  it('adding primary key with specific identifier', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo');
        table.primary('foo', 'pk-users');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), constraint `pk-users` primary key (`foo`))'
    );
  });

  it('adding composite primary key', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo');
        table.string('order_id');
        table.primary(['foo', 'order_id']);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), `order_id` varchar(255), primary key (`foo`, `order_id`))'
    );
  });

  it('adding composite primary key with specific identifier', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo');
        table.string('order_id');
        table.primary(['foo', 'order_id'], 'pk-users');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), `order_id` varchar(255), constraint `pk-users` primary key (`foo`, `order_id`))'
    );
  });

  it('adding primary key fluently', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo').primary();
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), primary key (`foo`))'
    );
  });

  it('adding primary key fluently with specific identifier', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo').primary('pk-users');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), constraint `pk-users` primary key (`foo`))'
    );
  });

  it('adding foreign key', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo').primary();
        table.string('order_id');
        table.foreign('order_id').references('id').on('orders');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), `order_id` varchar(255), foreign key(`order_id`) references `orders`(`id`), primary key (`foo`))'
    );
  });

  it('adding foreign key with specific identifier', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo').primary();
        table.string('order_id');
        table
          .foreign('order_id', 'fk-users-orders')
          .references('id')
          .on('orders');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), `order_id` varchar(255), constraint `fk-users-orders` foreign key(`order_id`) references `orders`(`id`), primary key (`foo`))'
    );
  });

  it('adding foreign key fluently', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('foo').primary();
        table.string('order_id').references('id').on('orders');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`foo` varchar(255), `order_id` varchar(255), foreign key(`order_id`) references `orders`(`id`), primary key (`foo`))'
    );
  });

  it('adds a unique key with autogenerated name', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.unique('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'create unique index `users_foo_unique` on `users` (`foo`)'
    );
  });

  it('adding unique key with specific name', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.unique('foo', 'bar');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'create unique index `bar` on `users` (`foo`)');
  });

  it('adding index', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'create index `baz` on `users` (`foo`, `bar`)');
  });

  it('adding incrementing id', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.increments('id');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'alter table `users` add column `id` integer not null primary key autoincrement'
    );
  });

  it('adding big incrementing id', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.bigIncrements('id');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'alter table `users` add column `id` integer not null primary key autoincrement'
    );
  });

  it('adding big incrementing id without primary key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.bigIncrements('id', { primaryKey: false });
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'alter table `users` add column `id` integer not null autoincrement'
    );
  });

  it('adding string', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` varchar(255)');
  });

  it('allows setting a value in the string length, although unused by sqlite3', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo', 100);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` varchar(100)');
  });

  it('correctly interprets defaultTo(null)', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo').defaultTo(null);
      })
      .toSQL();

    equal(
      tableSql[0].sql,
      'alter table `users` add column `foo` varchar(255) default null'
    );
  });

  it('correctly escape singleQuotes passed to defaultTo()', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo').defaultTo("single 'quoted' value");
      })
      .toSQL();

    equal(
      tableSql[0].sql,
      "alter table `users` add column `foo` varchar(255) default 'single ''quoted'' value'"
    );
  });

  it('chains notNull and defaultTo', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo', 100).notNull().defaultTo('bar');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      "alter table `users` add column `foo` varchar(100) not null default 'bar'"
    );
  });

  it('adding text', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.text('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` text');
  });

  it('adding big integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.bigInteger('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` bigint');
  });

  it('bigincrements works the same as increments for sqlite3', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.bigIncrements('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'alter table `users` add column `foo` integer not null primary key autoincrement'
    );
  });

  it('adding integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.integer('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` integer');
  });

  it('adding autoincrements', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.increments('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      'alter table `users` add column `foo` integer not null primary key autoincrement'
    );
  });

  it('adding medium integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.mediumint('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` integer');
  });

  it('adding tiny integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.tinyint('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` tinyint');
  });

  it('adding small integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.smallint('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` integer');
  });

  it('adding float', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.float('foo', 5, 2);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` float');
  });

  it('adding double', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.double('foo', 15, 8);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` float');
  });

  it('adding decimal', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.decimal('foo', 5, 2);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` float');
  });

  it('test adding decimal, no precision', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.decimal('foo', null);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` float');
  });

  it('adding boolean', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.boolean('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` boolean');
  });

  it('adding enum', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.enum('foo', ['bar', 'baz']);
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(
      tableSql[0].sql,
      "alter table `users` add column `foo` text check (`foo` in ('bar', 'baz'))"
    );
  });

  it('adding date', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.date('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` date');
  });

  it('adding date time', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dateTime('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` datetime');
  });

  it('adding time', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.time('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` time');
  });

  it('adding time stamp', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.timestamp('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` datetime');
  });

  it('adding time stamps', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.timestamps();
      })
      .toSQL();

    equal(2, tableSql.length);
    const expected = [
      'alter table `users` add column `created_at` datetime',
      'alter table `users` add column `updated_at` datetime',
    ];
    deepEqual(expected, _.map(tableSql, 'sql'));
  });

  it('adding binary', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.binary('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    equal(tableSql[0].sql, 'alter table `users` add column `foo` blob');
  });

  it('allows for on delete cascade with foreign keys, #166', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table
          .string('user_id', 36)
          .index()
          .references('id')
          .inTable('user')
          .onDelete('CASCADE');
      })
      .toSQL();

    equal(2, tableSql.length);
    equal(
      tableSql[0].sql,
      'create table `users` (`user_id` varchar(36), foreign key(`user_id`) references `user`(`id`) on delete CASCADE)'
    );
  });

  describe('SQLite3_DDL.prototype._doReplace', function () {
    it('should not change a query that has no matches', function () {
      return client
        .schemaBuilder()
        .table('foo', function () {
          const doReplace = SQLite3_DDL.prototype._doReplace;

          const sql1 =
            'CREATE TABLE `foo` (`id` integer not null primary key autoincrement, ' +
            '"parent_id_test" integer, foreign key("parent_id") references `foo`(`id`))';
          const sql2 =
            'CREATE TABLE `foo` (`id` integer not null primary key autoincrement, ' +
            '"parent_id_test" integer, foreign key("parent_id") references `bar`(`id`))';

          const sql1b =
            'CREATE TABLE `foo` ("id_foo" integer not null primary key autoincrement, ' +
            '"parent_id_test" integer, foreign key("parent_id") references `foo`("id_foo"))';
          const sql2b =
            'CREATE TABLE `foo` ("id_foo" integer not null primary key autoincrement, ' +
            '"parent_id_test" integer, foreign key("parent_id") references `bar`(`id`))';

          expect(doReplace(sql1, '`bar`', '"lar"')).to.equal(sql1);
          expect(doReplace(sql1, '`id`', '"id_foo"')).to.equal(sql1b);
          expect(doReplace(sql2, '`id`', '"id_foo"')).to.equal(sql2b);
        })
        .toSQL();
    });
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
      spy.resetHistory();
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

describe('SQLite parser and compiler', function () {
  const wrap = (v) => `"${v}"`;

  describe('create table', function () {
    it('basic', function () {
      const sql = 'CREATE TABLE "users" ("foo")';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('temporary', function () {
      const sql = 'CREATE TEMP TABLE "users" ("foo")';
      const ast = {
        temporary: true,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('if not exists', function () {
      const sql = 'CREATE TABLE IF NOT EXISTS "users" ("foo")';
      const ast = {
        temporary: false,
        exists: true,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('schema', function () {
      const sql = 'CREATE TABLE "schema"."users" ("foo")';
      const ast = {
        temporary: false,
        exists: false,
        schema: 'schema',
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('rowid', function () {
      const sql = 'CREATE TABLE "users" ("foo") WITHOUT ROWID';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: true,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition type', function () {
      const sql = 'CREATE TABLE "users" ("foo" INTEGER)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: 'INTEGER',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition type one parameter', function () {
      const sql = 'CREATE TABLE "users" ("foo" VARYING CHARACTER(255))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: 'VARYING CHARACTER(255)',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition type two parameters', function () {
      const sql = 'CREATE TABLE "users" ("foo" DECIMAL(+10, -5))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: 'DECIMAL(+10, -5)',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition multiple type', function () {
      const sql = 'CREATE TABLE "users" ("foo" FLOAT, "bar" DECIMAL(4, 2))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: 'FLOAT',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'bar',
            type: 'DECIMAL(4, 2)',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition primary key', function () {
      const sql = 'CREATE TABLE "users" ("foo" PRIMARY KEY)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: {
                name: null,
                order: null,
                conflict: null,
                autoincrement: false,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition primary key order', function () {
      const sql = 'CREATE TABLE "users" ("foo" PRIMARY KEY ASC)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: {
                name: null,
                order: 'ASC',
                conflict: null,
                autoincrement: false,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition primary key conflict', function () {
      const sql = 'CREATE TABLE "users" ("foo" PRIMARY KEY ON CONFLICT ABORT)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: {
                name: null,
                order: null,
                conflict: 'ABORT',
                autoincrement: false,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition primary key autoincrement', function () {
      const sql = 'CREATE TABLE "users" ("foo" PRIMARY KEY AUTOINCREMENT)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: {
                name: null,
                order: null,
                conflict: null,
                autoincrement: true,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition primary key all', function () {
      const sql =
        'CREATE TABLE "users" ("foo" PRIMARY KEY DESC ON CONFLICT FAIL AUTOINCREMENT)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: {
                name: null,
                order: 'DESC',
                conflict: 'FAIL',
                autoincrement: true,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition not null', function () {
      const sql = 'CREATE TABLE "users" ("foo" NOT NULL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: {
                name: null,
                conflict: null,
              },
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition not null conflict', function () {
      const sql = 'CREATE TABLE "users" ("foo" NOT NULL ON CONFLICT IGNORE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: {
                name: null,
                conflict: 'IGNORE',
              },
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition null', function () {
      const sql = 'CREATE TABLE "users" ("foo" NULL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: {
                name: null,
                conflict: null,
              },
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition null conflict', function () {
      const sql = 'CREATE TABLE "users" ("foo" NULL ON CONFLICT ABORT)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: {
                name: null,
                conflict: 'ABORT',
              },
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition unique', function () {
      const sql = 'CREATE TABLE "users" ("foo" UNIQUE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: {
                name: null,
                conflict: null,
              },
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition unique conflict', function () {
      const sql = 'CREATE TABLE "users" ("foo" UNIQUE ON CONFLICT REPLACE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: {
                name: null,
                conflict: 'REPLACE',
              },
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition check', function () {
      const sql = 'CREATE TABLE "users" ("foo" CHECK ("foo" != 42))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: {
                name: null,
                expression: ['"foo"', '!=', '42'],
              },
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition default', function () {
      const sql = `CREATE TABLE "users" ("foo" DEFAULT 'bar')`;
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: {
                name: null,
                value: `'bar'`,
                expression: false,
              },
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition default signed number', function () {
      const sql = 'CREATE TABLE "users" ("foo" DEFAULT -42)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: {
                name: null,
                value: '-42',
                expression: false,
              },
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition default expression', function () {
      const sql = 'CREATE TABLE "users" ("foo" DEFAULT (random()))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: {
                name: null,
                value: ['random', []],
                expression: true,
              },
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition collate', function () {
      const sql = 'CREATE TABLE "users" ("foo" COLLATE RTRIM)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: {
                name: null,
                collation: 'RTRIM',
              },
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references', function () {
      const sql = 'CREATE TABLE "users" ("foo" REFERENCES "other")';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: [],
                delete: null,
                update: null,
                match: null,
                deferrable: null,
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references referenced column', function () {
      const sql = 'CREATE TABLE "users" ("foo" REFERENCES "other" ("bar"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: ['bar'],
                delete: null,
                update: null,
                match: null,
                deferrable: null,
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references multiple columns', function () {
      const sql =
        'CREATE TABLE "users" ("foo" REFERENCES "other" ("bar", "lar"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: ['bar', 'lar'],
                delete: null,
                update: null,
                match: null,
                deferrable: null,
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references on delete', function () {
      const sql =
        'CREATE TABLE "users" ("foo" REFERENCES "other" ON DELETE SET NULL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: [],
                delete: 'SET NULL',
                update: null,
                match: null,
                deferrable: null,
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references on update', function () {
      const sql =
        'CREATE TABLE "users" ("foo" REFERENCES "other" ON UPDATE CASCADE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: [],
                delete: null,
                update: 'CASCADE',
                match: null,
                deferrable: null,
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references match', function () {
      const sql = 'CREATE TABLE "users" ("foo" REFERENCES "other" MATCH FULL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: [],
                delete: null,
                update: null,
                match: 'FULL',
                deferrable: null,
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references deferrable', function () {
      const sql =
        'CREATE TABLE "users" ("foo" REFERENCES "other" NOT DEFERRABLE INITIALLY DEFERRED)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: [],
                delete: null,
                update: null,
                match: null,
                deferrable: {
                  not: true,
                  initially: 'DEFERRED',
                },
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition references all', function () {
      const sql =
        'CREATE TABLE "users" ("foo" REFERENCES "other" ("bar") ON DELETE RESTRICT ON UPDATE NO ACTION MATCH PARTIAL DEFERRABLE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: ['bar'],
                delete: 'RESTRICT',
                update: 'NO ACTION',
                match: 'PARTIAL',
                deferrable: {
                  not: false,
                  initially: null,
                },
              },
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition as', function () {
      const sql = 'CREATE TABLE "users" ("foo" AS (count(*)))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: {
                name: null,
                generated: false,
                expression: ['count', ['*']],
                mode: null,
              },
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition as generated always', function () {
      const sql =
        'CREATE TABLE "users" ("foo" GENERATED ALWAYS AS (length(foo)))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: {
                name: null,
                generated: true,
                expression: ['length', ['foo']],
                mode: null,
              },
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition as mode', function () {
      const sql = 'CREATE TABLE "users" ("foo" AS (length(foo)) VIRTUAL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: {
                name: null,
                generated: false,
                expression: ['length', ['foo']],
                mode: 'VIRTUAL',
              },
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition all', function () {
      const sql =
        'CREATE TABLE "users" ("foo" TEXT PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT NOT NULL ON CONFLICT FAIL NULL ON CONFLICT IGNORE UNIQUE ON CONFLICT REPLACE CHECK ("foo" != 42) DEFAULT NULL COLLATE BINARY REFERENCES "other" ("baz", "bar", "lar") ON UPDATE SET NULL MATCH SIMPLE NOT DEFERRABLE GENERATED ALWAYS AS (count(*)) STORED)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: 'TEXT',
            constraints: {
              primary: {
                name: null,
                order: 'DESC',
                conflict: 'ROLLBACK',
                autoincrement: true,
              },
              notnull: {
                name: null,
                conflict: 'FAIL',
              },
              null: {
                name: null,
                conflict: 'IGNORE',
              },
              unique: {
                name: null,
                conflict: 'REPLACE',
              },
              check: {
                name: null,
                expression: ['"foo"', '!=', '42'],
              },
              default: {
                name: null,
                value: 'NULL',
                expression: false,
              },
              collate: {
                name: null,
                collation: 'BINARY',
              },
              references: {
                name: null,
                table: 'other',
                columns: ['baz', 'bar', 'lar'],
                delete: null,
                update: 'SET NULL',
                match: 'SIMPLE',
                deferrable: {
                  not: true,
                  initially: null,
                },
              },
              as: {
                name: null,
                generated: true,
                expression: ['count', ['*']],
                mode: 'STORED',
              },
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition named', function () {
      const sql =
        'CREATE TABLE "users" ("foo" UNSIGNED BIG INT CONSTRAINT "primary_constraint" PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT CONSTRAINT "notnull_constraint" NOT NULL ON CONFLICT FAIL CONSTRAINT "null_constraint" NULL ON CONFLICT IGNORE CONSTRAINT "unique_constraint" UNIQUE ON CONFLICT REPLACE CONSTRAINT "check_constraint" CHECK ("foo" != 42) CONSTRAINT "default_constraint" DEFAULT NULL CONSTRAINT "collate_constraint" COLLATE BINARY CONSTRAINT "references_constraint" REFERENCES "other" ("baz", "bar", "lar") ON UPDATE SET NULL MATCH SIMPLE NOT DEFERRABLE CONSTRAINT "as_constraint" GENERATED ALWAYS AS (count(*)) STORED)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: 'UNSIGNED BIG INT',
            constraints: {
              primary: {
                name: 'primary_constraint',
                order: 'DESC',
                conflict: 'ROLLBACK',
                autoincrement: true,
              },
              notnull: {
                name: 'notnull_constraint',
                conflict: 'FAIL',
              },
              null: {
                name: 'null_constraint',
                conflict: 'IGNORE',
              },
              unique: {
                name: 'unique_constraint',
                conflict: 'REPLACE',
              },
              check: {
                name: 'check_constraint',
                expression: ['"foo"', '!=', '42'],
              },
              default: {
                name: 'default_constraint',
                value: 'NULL',
                expression: false,
              },
              collate: {
                name: 'collate_constraint',
                collation: 'BINARY',
              },
              references: {
                name: 'references_constraint',
                table: 'other',
                columns: ['baz', 'bar', 'lar'],
                delete: null,
                update: 'SET NULL',
                match: 'SIMPLE',
                deferrable: {
                  not: true,
                  initially: null,
                },
              },
              as: {
                name: 'as_constraint',
                generated: true,
                expression: ['count', ['*']],
                mode: 'STORED',
              },
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition multiple', function () {
      const sql =
        'CREATE TABLE "users" ("primary_column" BLOB CONSTRAINT "primary_constraint" PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT, "notnull_column" DOUBLE PRECISION NOT NULL ON CONFLICT FAIL, "null_column" NATIVE CHARACTER(70) NULL ON CONFLICT IGNORE, "unique_column" CONSTRAINT "unique_constraint" UNIQUE ON CONFLICT REPLACE, "check_column" CHECK ("foo" != 42), "default_column" INT8 DEFAULT NULL, "collate_column" CONSTRAINT "collate_constraint" COLLATE BINARY, "references_column" NUMERIC REFERENCES "other" ("baz", "bar", "lar") ON UPDATE SET NULL MATCH SIMPLE NOT DEFERRABLE, "as_column" CONSTRAINT "as_constraint" GENERATED ALWAYS AS (count(*)) STORED)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'primary_column',
            type: 'BLOB',
            constraints: {
              primary: {
                name: 'primary_constraint',
                order: 'DESC',
                conflict: 'ROLLBACK',
                autoincrement: true,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'notnull_column',
            type: 'DOUBLE PRECISION',
            constraints: {
              primary: null,
              notnull: {
                name: null,
                conflict: 'FAIL',
              },
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'null_column',
            type: 'NATIVE CHARACTER(70)',
            constraints: {
              primary: null,
              notnull: null,
              null: {
                name: null,
                conflict: 'IGNORE',
              },
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'unique_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: {
                name: 'unique_constraint',
                conflict: 'REPLACE',
              },
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'check_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: {
                name: null,
                expression: ['"foo"', '!=', '42'],
              },
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'default_column',
            type: 'INT8',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: {
                name: null,
                value: 'NULL',
                expression: false,
              },
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'collate_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: {
                name: 'collate_constraint',
                collation: 'BINARY',
              },
              references: null,
              as: null,
            },
          },
          {
            name: 'references_column',
            type: 'NUMERIC',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: ['baz', 'bar', 'lar'],
                delete: null,
                update: 'SET NULL',
                match: 'SIMPLE',
                deferrable: {
                  not: true,
                  initially: null,
                },
              },
              as: null,
            },
          },
          {
            name: 'as_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: {
                name: 'as_constraint',
                generated: true,
                expression: ['count', ['*']],
                mode: 'STORED',
              },
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint primary key', function () {
      const sql = 'CREATE TABLE "users" ("foo", PRIMARY KEY ("foo"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: null,
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
            ],
            conflict: null,
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint primary key conflict', function () {
      const sql =
        'CREATE TABLE "users" ("foo", PRIMARY KEY ("foo") ON CONFLICT ROLLBACK)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: null,
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
            ],
            conflict: 'ROLLBACK',
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint primary key column collation and order', function () {
      const sql =
        'CREATE TABLE "users" ("foo", PRIMARY KEY ("foo", "baz" COLLATE BINARY, "bar" ASC, "lar" COLLATE NOCASE DESC))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: null,
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
              {
                name: 'baz',
                expression: false,
                collation: 'BINARY',
                order: null,
              },
              {
                name: 'bar',
                expression: false,
                collation: null,
                order: 'ASC',
              },
              {
                name: 'lar',
                expression: false,
                collation: 'NOCASE',
                order: 'DESC',
              },
            ],
            conflict: null,
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint primary key column expression', function () {
      const sql =
        'CREATE TABLE "users" ("foo", PRIMARY KEY (abs(foo), random() COLLATE RTRIM, baz + bar ASC))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: null,
            columns: [
              {
                name: ['abs', ['foo']],
                expression: true,
                collation: null,
                order: null,
              },
              {
                name: ['random', []],
                expression: true,
                collation: 'RTRIM',
                order: null,
              },
              {
                name: ['baz', '+', 'bar'],
                expression: true,
                collation: null,
                order: 'ASC',
              },
            ],
            conflict: null,
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint unique', function () {
      const sql = 'CREATE TABLE "users" ("foo", UNIQUE ("foo"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'UNIQUE',
            name: null,
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
            ],
            conflict: null,
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint check', function () {
      const sql = 'CREATE TABLE "users" ("foo", CHECK ("foo" IS NULL))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'CHECK',
            name: null,
            expression: ['"foo"', 'IS', 'NULL'],
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other")';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: [],
              delete: null,
              update: null,
              match: null,
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key referenced column', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other" ("bar"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: ['bar'],
              delete: null,
              update: null,
              match: null,
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key multiple columns', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo", "baz") REFERENCES "other" ("bar", "lar"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo', 'baz'],
            references: {
              table: 'other',
              columns: ['bar', 'lar'],
              delete: null,
              update: null,
              match: null,
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key on delete', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other" ON DELETE SET NULL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: [],
              delete: 'SET NULL',
              update: null,
              match: null,
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key on update', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other" ON UPDATE CASCADE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: [],
              delete: null,
              update: 'CASCADE',
              match: null,
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key match', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other" MATCH FULL)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: [],
              delete: null,
              update: null,
              match: 'FULL',
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key deferrable', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other" NOT DEFERRABLE INITIALLY DEFERRED)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: [],
              delete: null,
              update: null,
              match: null,
              deferrable: {
                not: true,
                initially: 'DEFERRED',
              },
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint foreign key all', function () {
      const sql =
        'CREATE TABLE "users" ("foo", FOREIGN KEY ("foo") REFERENCES "other" ("bar") ON DELETE RESTRICT ON UPDATE NO ACTION MATCH PARTIAL DEFERRABLE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['foo'],
            references: {
              table: 'other',
              columns: ['bar'],
              delete: 'RESTRICT',
              update: 'NO ACTION',
              match: 'PARTIAL',
              deferrable: {
                not: false,
                initially: null,
              },
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint named', function () {
      const sql =
        'CREATE TABLE "users" ("foo", CONSTRAINT "primary_constraint" PRIMARY KEY ("foo"))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: 'primary_constraint',
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
            ],
            conflict: null,
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('table constraint multiple', function () {
      const sql =
        'CREATE TABLE "users" ("foo", PRIMARY KEY ("foo", "baz" DESC) ON CONFLICT IGNORE, CHECK ("foo" IS NULL), CONSTRAINT "check_42" CHECK (count(foo) < 42 AND bar = 42), CONSTRAINT "unique_bar" UNIQUE ("bar"), FOREIGN KEY ("bar") REFERENCES "other" ("foo") ON DELETE SET DEFAULT ON UPDATE SET DEFAULT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT "foreign_other_multiple" FOREIGN KEY ("bar", "lar") REFERENCES "other" MATCH SIMPLE NOT DEFERRABLE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: null,
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
              {
                name: 'baz',
                expression: false,
                collation: null,
                order: 'DESC',
              },
            ],
            conflict: 'IGNORE',
          },
          {
            type: 'CHECK',
            name: null,
            expression: ['"foo"', 'IS', 'NULL'],
          },
          {
            type: 'CHECK',
            name: 'check_42',
            expression: ['count', ['foo'], '<', '42', 'AND', 'bar', '=', '42'],
          },
          {
            type: 'UNIQUE',
            name: 'unique_bar',
            columns: [
              {
                name: 'bar',
                expression: false,
                collation: null,
                order: null,
              },
            ],
            conflict: null,
          },
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['bar'],
            references: {
              table: 'other',
              columns: ['foo'],
              delete: 'SET DEFAULT',
              update: 'SET DEFAULT',
              match: null,
              deferrable: {
                not: false,
                initially: 'IMMEDIATE',
              },
            },
          },
          {
            type: 'FOREIGN KEY',
            name: 'foreign_other_multiple',
            columns: ['bar', 'lar'],
            references: {
              table: 'other',
              columns: [],
              delete: null,
              update: null,
              match: 'SIMPLE',
              deferrable: {
                not: true,
                initially: null,
              },
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column definition multiple table constraint multiple', function () {
      const sql =
        'CREATE TABLE "users" ("primary_column" BLOB CONSTRAINT "primary_constraint" PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT, "notnull_column" DOUBLE PRECISION NOT NULL ON CONFLICT FAIL, "null_column" NATIVE CHARACTER(70) NULL ON CONFLICT IGNORE, "unique_column" CONSTRAINT "unique_constraint" UNIQUE ON CONFLICT REPLACE, "check_column" CHECK ("foo" != 42), "default_column" TEXT DEFAULT NULL, "collate_column" CONSTRAINT "collate_constraint" COLLATE BINARY, "references_column" NUMERIC REFERENCES "other" ("baz", "bar", "lar") ON UPDATE SET NULL MATCH SIMPLE NOT DEFERRABLE, "as_column" CONSTRAINT "as_constraint" GENERATED ALWAYS AS (count(*)) STORED, PRIMARY KEY ("foo", "baz" DESC) ON CONFLICT IGNORE, CHECK ("foo" IS NULL), CONSTRAINT "check_42" CHECK (count(foo) < 42 AND bar = 42), CONSTRAINT "unique_bar" UNIQUE ("bar"), FOREIGN KEY ("bar") REFERENCES "other" ("foo") ON DELETE SET DEFAULT ON UPDATE SET DEFAULT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT "foreign_other_multiple" FOREIGN KEY ("bar", "lar") REFERENCES "other" MATCH SIMPLE NOT DEFERRABLE)';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'primary_column',
            type: 'BLOB',
            constraints: {
              primary: {
                name: 'primary_constraint',
                order: 'DESC',
                conflict: 'ROLLBACK',
                autoincrement: true,
              },
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'notnull_column',
            type: 'DOUBLE PRECISION',
            constraints: {
              primary: null,
              notnull: {
                name: null,
                conflict: 'FAIL',
              },
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'null_column',
            type: 'NATIVE CHARACTER(70)',
            constraints: {
              primary: null,
              notnull: null,
              null: {
                name: null,
                conflict: 'IGNORE',
              },
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'unique_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: {
                name: 'unique_constraint',
                conflict: 'REPLACE',
              },
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'check_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: {
                name: null,
                expression: ['"foo"', '!=', '42'],
              },
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'default_column',
            type: 'TEXT',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: {
                name: null,
                value: 'NULL',
                expression: false,
              },
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'collate_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: {
                name: 'collate_constraint',
                collation: 'BINARY',
              },
              references: null,
              as: null,
            },
          },
          {
            name: 'references_column',
            type: 'NUMERIC',
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: {
                name: null,
                table: 'other',
                columns: ['baz', 'bar', 'lar'],
                delete: null,
                update: 'SET NULL',
                match: 'SIMPLE',
                deferrable: {
                  not: true,
                  initially: null,
                },
              },
              as: null,
            },
          },
          {
            name: 'as_column',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: {
                name: 'as_constraint',
                generated: true,
                expression: ['count', ['*']],
                mode: 'STORED',
              },
            },
          },
        ],
        constraints: [
          {
            type: 'PRIMARY KEY',
            name: null,
            columns: [
              {
                name: 'foo',
                expression: false,
                collation: null,
                order: null,
              },
              {
                name: 'baz',
                expression: false,
                collation: null,
                order: 'DESC',
              },
            ],
            conflict: 'IGNORE',
          },
          {
            type: 'CHECK',
            name: null,
            expression: ['"foo"', 'IS', 'NULL'],
          },
          {
            type: 'CHECK',
            name: 'check_42',
            expression: ['count', ['foo'], '<', '42', 'AND', 'bar', '=', '42'],
          },
          {
            type: 'UNIQUE',
            name: 'unique_bar',
            columns: [
              {
                name: 'bar',
                expression: false,
                collation: null,
                order: null,
              },
            ],
            conflict: null,
          },
          {
            type: 'FOREIGN KEY',
            name: null,
            columns: ['bar'],
            references: {
              table: 'other',
              columns: ['foo'],
              delete: 'SET DEFAULT',
              update: 'SET DEFAULT',
              match: null,
              deferrable: {
                not: false,
                initially: 'IMMEDIATE',
              },
            },
          },
          {
            type: 'FOREIGN KEY',
            name: 'foreign_other_multiple',
            columns: ['bar', 'lar'],
            references: {
              table: 'other',
              columns: [],
              delete: null,
              update: null,
              match: 'SIMPLE',
              deferrable: {
                not: true,
                initially: null,
              },
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('special character identifier', function () {
      const sql =
        'CREATE TABLE "$chem@"."users  table" (" ( ", "[`""foo""`]", " INTEGER ", " PRIMARY KEY ", " ) WITHOUT ROWID")';
      const ast = {
        temporary: false,
        exists: false,
        schema: '$chem@',
        table: 'users  table',
        columns: [
          {
            name: ' ( ',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: '[`""foo""`]',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: ' INTEGER ',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: ' PRIMARY KEY ',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: ' ) WITHOUT ROWID',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('no wrap', function () {
      const sql =
        'CREATE TABLE users (note, foo, CONSTRAINT foreign_constraint FOREIGN KEY (note, foo) REFERENCES other (baz, bar))';
      const ast = {
        temporary: false,
        exists: false,
        schema: null,
        table: 'users',
        columns: [
          {
            name: 'note',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
          {
            name: 'foo',
            type: null,
            constraints: {
              primary: null,
              notnull: null,
              null: null,
              unique: null,
              check: null,
              default: null,
              collate: null,
              references: null,
              as: null,
            },
          },
        ],
        constraints: [
          {
            type: 'FOREIGN KEY',
            name: 'foreign_constraint',
            columns: ['note', 'foo'],
            references: {
              table: 'other',
              columns: ['baz', 'bar'],
              delete: null,
              update: null,
              match: null,
              deferrable: null,
            },
          },
        ],
        rowid: false,
      };

      const parsed = parseCreateTable(sql);
      const compiled = compileCreateTable(ast);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('ordering', function () {
      const sql =
        'CREATE TABLE "users" ("foo" TEXT REFERENCES "other" ("baz", "bar", "lar") MATCH PARTIAL ON UPDATE NO ACTION ON DELETE RESTRICT DEFERRABLE CHECK ("foo" != 42) GENERATED ALWAYS AS (count(*)) STORED UNIQUE ON CONFLICT REPLACE NOT NULL ON CONFLICT FAIL PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT DEFAULT NULL COLLATE BINARY NULL ON CONFLICT IGNORE)';
      const newSql =
        'CREATE TABLE "users" ("foo" TEXT PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT NOT NULL ON CONFLICT FAIL NULL ON CONFLICT IGNORE UNIQUE ON CONFLICT REPLACE CHECK ("foo" != 42) DEFAULT NULL COLLATE BINARY REFERENCES "other" ("baz", "bar", "lar") ON DELETE RESTRICT ON UPDATE NO ACTION MATCH PARTIAL DEFERRABLE GENERATED ALWAYS AS (count(*)) STORED)';

      const parsedSql = compileCreateTable(parseCreateTable(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });

    it('lowercase', function () {
      const sql =
        'create table "users" ("primary_column" blob constraint "primary_constraint" primary key desc on conflict rollback autoincrement, "notnull_column" double precision not null on conflict fail, "null_column" native character(70) null on conflict ignore, "unique_column" constraint "unique_constraint" unique on conflict replace, "check_column" check ("foo" != 42), "default_column" text default null, "collate_column" constraint "collate_constraint" collate binary, "references_column" numeric references "other" ("baz", "bar", "lar") on update set null match simple not deferrable, "as_column" constraint "as_constraint" generated always as (count(*)) stored, primary key ("foo", "baz" desc) on conflict ignore, check ("foo" is null), constraint "check_42" check (count(foo) < 42 AND bar = 42), constraint "unique_bar" unique ("bar"), foreign key ("bar") references "other" ("foo") on delete set default on update set default deferrable initially immediate, constraint "foreign_other_multiple" foreign key ("bar", "lar") references "other" match simple not deferrable)';
      const newSql =
        'CREATE TABLE "users" ("primary_column" blob CONSTRAINT "primary_constraint" PRIMARY KEY DESC ON CONFLICT ROLLBACK AUTOINCREMENT, "notnull_column" double precision NOT NULL ON CONFLICT FAIL, "null_column" native character(70) NULL ON CONFLICT IGNORE, "unique_column" CONSTRAINT "unique_constraint" UNIQUE ON CONFLICT REPLACE, "check_column" CHECK ("foo" != 42), "default_column" text DEFAULT null, "collate_column" CONSTRAINT "collate_constraint" COLLATE binary, "references_column" numeric REFERENCES "other" ("baz", "bar", "lar") ON UPDATE SET NULL MATCH simple NOT DEFERRABLE, "as_column" CONSTRAINT "as_constraint" GENERATED ALWAYS AS (count(*)) STORED, PRIMARY KEY ("foo", "baz" DESC) ON CONFLICT IGNORE, CHECK ("foo" is null), CONSTRAINT "check_42" CHECK (count(foo) < 42 AND bar = 42), CONSTRAINT "unique_bar" UNIQUE ("bar"), FOREIGN KEY ("bar") REFERENCES "other" ("foo") ON DELETE SET DEFAULT ON UPDATE SET DEFAULT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT "foreign_other_multiple" FOREIGN KEY ("bar", "lar") REFERENCES "other" MATCH simple NOT DEFERRABLE)';

      const parsedSql = compileCreateTable(parseCreateTable(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });

    it('whitespaces', function () {
      const sql =
        'CREATE  TABLE   "users  table"("foo",\t"bar"CHECK("foo"\n!=\t42),    CONSTRAINT\r\n"foreign_constraint" \t FOREIGN \n KEY("foo","bar")REFERENCES \r\n "other"("baz","bar"))';
      const newSql =
        'CREATE TABLE "users  table" ("foo", "bar" CHECK ("foo" != 42), CONSTRAINT "foreign_constraint" FOREIGN KEY ("foo", "bar") REFERENCES "other" ("baz", "bar"))';

      const parsedSql = compileCreateTable(parseCreateTable(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });

    it('wrap', function () {
      const sql =
        'CREATE TABLE "schema".users (`foo`, [bar], CONSTRAINT [foreign_constraint] FOREIGN KEY (foo, `bar`) REFERENCES other ([baz], "bar"))';
      const newSql =
        'CREATE TABLE "schema"."users" ("foo", "bar", CONSTRAINT "foreign_constraint" FOREIGN KEY ("foo", "bar") REFERENCES "other" ("baz", "bar"))';

      const parsedSql = compileCreateTable(parseCreateTable(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });
  });

  describe('create index', function () {
    it('basic', function () {
      const sql = 'CREATE INDEX "users_index" on "users" ("foo")';
      const ast = {
        unique: false,
        exists: false,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          { name: 'foo', expression: false, collation: null, order: null },
        ],
        where: null,
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('unique', function () {
      const sql = 'CREATE UNIQUE INDEX "users_index" on "users" ("foo")';
      const ast = {
        unique: true,
        exists: false,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          { name: 'foo', expression: false, collation: null, order: null },
        ],
        where: null,
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('if not exists', function () {
      const sql = 'CREATE INDEX IF NOT EXISTS "users_index" on "users" ("foo")';
      const ast = {
        unique: false,
        exists: true,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          { name: 'foo', expression: false, collation: null, order: null },
        ],
        where: null,
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('schema', function () {
      const sql = 'CREATE INDEX "schema"."users_index" on "users" ("foo")';
      const ast = {
        unique: false,
        exists: false,
        schema: 'schema',
        index: 'users_index',
        table: 'users',
        columns: [
          { name: 'foo', expression: false, collation: null, order: null },
        ],
        where: null,
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('where', function () {
      const sql =
        'CREATE INDEX "users_index" on "users" ("foo") where foo IS NOT NULL AND bar = 42';
      const ast = {
        unique: false,
        exists: false,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          { name: 'foo', expression: false, collation: null, order: null },
        ],
        where: ['foo', 'IS', 'NOT', 'NULL', 'AND', 'bar', '=', '42'],
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column collation and order', function () {
      const sql =
        'CREATE INDEX "users_index" on "users" ("foo", "baz" COLLATE BINARY, "bar" ASC, "lar" COLLATE NOCASE DESC)';
      const ast = {
        unique: false,
        exists: false,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          {
            name: 'foo',
            expression: false,
            collation: null,
            order: null,
          },
          {
            name: 'baz',
            expression: false,
            collation: 'BINARY',
            order: null,
          },
          {
            name: 'bar',
            expression: false,
            collation: null,
            order: 'ASC',
          },
          {
            name: 'lar',
            expression: false,
            collation: 'NOCASE',
            order: 'DESC',
          },
        ],
        where: null,
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('column expression', function () {
      const sql =
        'CREATE INDEX "users_index" on "users" (abs(foo), random() COLLATE RTRIM, baz + bar ASC)';
      const ast = {
        unique: false,
        exists: false,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          {
            name: ['abs', ['foo']],
            expression: true,
            collation: null,
            order: null,
          },
          {
            name: ['random', []],
            expression: true,
            collation: 'RTRIM',
            order: null,
          },
          {
            name: ['baz', '+', 'bar'],
            expression: true,
            collation: null,
            order: 'ASC',
          },
        ],
        where: null,
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('special character identifier', function () {
      const sql =
        'CREATE INDEX "$chema"."users  index" on "use-rs" (" ( ", " COLLATE ", " ""foo"" " ASC, "``b a z``" DESC, "[[``""bar""``]]") where foo IS NOT NULL';
      const ast = {
        unique: false,
        exists: false,
        schema: '$chema',
        index: 'users  index',
        table: 'use-rs',
        columns: [
          {
            name: ' ( ',
            expression: false,
            collation: null,
            order: null,
          },
          {
            name: ' COLLATE ',
            expression: false,
            collation: null,
            order: null,
          },
          {
            name: ' ""foo"" ',
            expression: false,
            collation: null,
            order: 'ASC',
          },
          {
            name: '``b a z``',
            expression: false,
            collation: null,
            order: 'DESC',
          },
          {
            name: '[[``""bar""``]]',
            expression: false,
            collation: null,
            order: null,
          },
        ],
        where: ['foo', 'IS', 'NOT', 'NULL'],
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast, wrap);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('no wrap', function () {
      const sql =
        'CREATE INDEX users_index on users (note COLLATE BINARY ASC) where foo IS NOT NULL';
      const ast = {
        unique: false,
        exists: false,
        schema: null,
        index: 'users_index',
        table: 'users',
        columns: [
          {
            name: 'note',
            expression: false,
            collation: 'BINARY',
            order: 'ASC',
          },
        ],
        where: ['foo', 'IS', 'NOT', 'NULL'],
      };

      const parsed = parseCreateIndex(sql);
      const compiled = compileCreateIndex(ast);

      expect(parsed).to.deep.equal(ast);
      expect(compiled).to.equal(sql);
    });

    it('lowercase', function () {
      const sql =
        'create index "users_index" ON "users" ("foo" collate BINARY asc) WHERE "foo" is not null';
      const newSql =
        'CREATE INDEX "users_index" on "users" ("foo" COLLATE BINARY ASC) where "foo" is not null';

      const parsedSql = compileCreateIndex(parseCreateIndex(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });

    it('whitespaces', function () {
      const sql =
        'CREATE  INDEX   "users  index"\non\t"users"("foo"    COLLATE\tBINARY\nASC)\r\nwhere     "foo"\n  IS\tNOT\r\nNULL';
      const newSql =
        'CREATE INDEX "users  index" on "users" ("foo" COLLATE BINARY ASC) where "foo" IS NOT NULL';

      const parsedSql = compileCreateIndex(parseCreateIndex(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });

    it('wrap', function () {
      const sql =
        'CREATE INDEX "schema".[users index] on `users` ("foo " ASC, [b a z] DESC, ` bar`)';
      const newSql =
        'CREATE INDEX "schema"."users index" on "users" ("foo " ASC, "b a z" DESC, " bar")';

      const parsedSql = compileCreateIndex(parseCreateIndex(sql), wrap);

      expect(parsedSql).to.equal(newSql);
    });
  });
});

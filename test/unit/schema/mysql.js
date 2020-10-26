const { expect } = require('chai');

const sinon = require('sinon');
const MySQL_Client = require('../../../lib/dialects/mysql');
const MySQL2_Client = require('../../../lib/dialects/mysql2');

module.exports = function (dialect) {
  describe(dialect + ' SchemaBuilder', function () {
    let client;
    switch (dialect) {
      case 'mysql':
        client = new MySQL_Client({ client: 'mysql' });
        break;
      case 'mysql2':
        client = new MySQL2_Client({ client: 'mysql2' });
        break;
    }

    let tableSql;
    const equal = require('assert').equal;

    it('basic create table with column collate', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('users', function (table) {
          table.increments('id');
          table.string('email').collate('utf8_unicode_ci');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255) collate 'utf8_unicode_ci')"
      );
    });

    it('test basic create table with charset and collate', function () {
      tableSql = client.schemaBuilder().createTable('users', function (table) {
        table.increments('id');
        table.string('email');
        table.charset('utf8');
        table.collate('utf8_unicode_ci');
      });

      equal(1, tableSql.toSQL().length);
      expect(tableSql.toSQL()[0].sql).to.equal(
        'create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255)) default character set utf8 collate utf8_unicode_ci'
      );
      expect(tableSql.toQuery()).to.equal(
        'create table `users` (`id` int unsigned not null auto_increment primary key, `email` varchar(255)) default character set utf8 collate utf8_unicode_ci'
      );
    });

    it('basic create table without charset or collate', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.increments('id');
          this.string('email');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `id` int unsigned not null auto_increment primary key, add `email` varchar(255)'
      );
    });

    it('adding json', function () {
      tableSql = client
        .schemaBuilder()
        .table('user', function (t) {
          t.json('preferences');
        })
        .toSQL();
      expect(tableSql[0].sql).to.equal(
        'alter table `user` add `preferences` json'
      );
    });

    it('adding jsonb', function () {
      tableSql = client
        .schemaBuilder()
        .table('user', function (t) {
          t.jsonb('preferences');
        })
        .toSQL();
      expect(tableSql[0].sql).to.equal(
        'alter table `user` add `preferences` json'
      );
    });

    it('test drop table', function () {
      tableSql = client.schemaBuilder().dropTable('users').toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop table `users`');
    });

    it('test drop table if exists', function () {
      tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop table if exists `users`');
    });

    it('test drop column', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropColumn('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` drop `foo`');
    });

    it('drops multiple columns with an array', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropColumn(['foo', 'bar']);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop `foo`, drop `bar`'
      );
    });

    it('drops multiple columns as multiple arguments', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropColumn('foo', 'bar');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop `foo`, drop `bar`'
      );
    });

    it('test drop primary', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropPrimary();
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` drop primary key');
    });

    it('test drop unique', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropUnique('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop index `users_foo_unique`'
      );
    });

    it('test drop unique, custom', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropUnique(null, 'foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` drop index `foo`');
    });

    it('test drop index', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropIndex('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop index `users_foo_index`'
      );
    });

    it('test drop index, custom', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropIndex(null, 'foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` drop index `foo`');
    });

    it('test drop foreign', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropForeign('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop foreign key `users_foo_foreign`'
      );
    });

    it('test drop foreign, custom', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropForeign(null, 'foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop foreign key `foo`'
      );
    });

    it('test drop timestamps', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.dropTimestamps();
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` drop `created_at`, drop `updated_at`'
      );
    });

    it('test rename table', function () {
      tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('rename table `users` to `foo`');
    });

    it('test adding primary key', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.primary('foo', 'bar');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add primary key `bar`(`foo`)'
      );
    });

    it('test adding unique key', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.unique('foo', 'bar');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add unique `bar`(`foo`)'
      );
    });

    it('test adding index', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.index(['foo', 'bar'], 'baz');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add index `baz`(`foo`, `bar`)'
      );
    });

    it('test adding index with an index type', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.index(['foo', 'bar'], 'baz', 'FULLTEXT');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add FULLTEXT index `baz`(`foo`, `bar`)'
      );
    });

    it('test adding foreign key', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.foreign('foo_id').references('id').on('orders');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add constraint `users_foo_id_foreign` foreign key (`foo_id`) references `orders` (`id`)'
      );

      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.integer('foo_id').references('id').on('orders');
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo_id` int');
      expect(tableSql[1].sql).to.equal(
        'alter table `users` add constraint `users_foo_id_foreign` foreign key (`foo_id`) references `orders` (`id`)'
      );
    });

    it('adding foreign key with specific identifier', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.foreign('foo_id', 'fk_foo').references('id').on('orders');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add constraint `fk_foo` foreign key (`foo_id`) references `orders` (`id`)'
      );

      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.integer('foo_id')
            .references('id')
            .on('orders')
            .withKeyName('fk_foo');
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo_id` int');
      expect(tableSql[1].sql).to.equal(
        'alter table `users` add constraint `fk_foo` foreign key (`foo_id`) references `orders` (`id`)'
      );
    });

    it('adds foreign key with onUpdate and onDelete', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('person', function (table) {
          table
            .integer('user_id')
            .notNull()
            .references('users.id')
            .onDelete('SET NULL');
          table
            .integer('account_id')
            .notNull()
            .references('id')
            .inTable('accounts')
            .onUpdate('cascade');
        })
        .toSQL();
      equal(3, tableSql.length);
      expect(tableSql[1].sql).to.equal(
        'alter table `person` add constraint `person_user_id_foreign` foreign key (`user_id`) references `users` (`id`) on delete SET NULL'
      );
      expect(tableSql[2].sql).to.equal(
        'alter table `person` add constraint `person_account_id_foreign` foreign key (`account_id`) references `accounts` (`id`) on update cascade'
      );
    });

    it('test adding incrementing id', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.increments('id');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `id` int unsigned not null auto_increment primary key'
      );
    });

    it('test adding big incrementing id', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.bigIncrements('id');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `id` bigint unsigned not null auto_increment primary key'
      );
    });

    it('test adding column after another column', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('name').after('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `name` varchar(255) after `foo`'
      );
    });

    it('test adding column after another column with comment', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('name').after('foo').comment('bar');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "alter table `users` add `name` varchar(255) comment 'bar' after `foo`"
      );
    });

    it('test adding column on the first place', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('first_name').first();
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `first_name` varchar(255) first'
      );
    });

    it('test adding column on the first place with comment', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('first_name').first().comment('bar');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "alter table `users` add `first_name` varchar(255) comment 'bar' first"
      );
    });

    it('test adding string', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` varchar(255)'
      );
    });

    it('uses the varchar column constraint', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('foo', 100);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` varchar(100)'
      );
    });

    it('chains notNull and defaultTo', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('foo', 100).notNull().defaultTo('bar');
        })
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "alter table `users` add `foo` varchar(100) not null default 'bar'"
      );
    });

    it('allows for raw values in the default field', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('foo', 100)
            .nullable()
            .defaultTo(client.raw('CURRENT TIMESTAMP'));
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` varchar(100) null default CURRENT TIMESTAMP'
      );
    });

    it('test adding text', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.text('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` text');
    });

    it('test adding big integer', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.bigInteger('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` bigint');
    });

    it('test adding integer', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.integer('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` int');
    });

    it('test adding medium integer', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.mediumint('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` mediumint'
      );
    });

    it('test adding small integer', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.smallint('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` smallint'
      );
    });

    it('test adding tiny integer', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.tinyint('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` tinyint');
    });

    it('test adding float', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.float('foo', 5, 2);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` float(5, 2)'
      );
    });

    it('test adding double', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.double('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` double');
    });

    it('test adding double specifying precision', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.double('foo', 15, 8);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` double(15, 8)'
      );
    });

    it('test adding decimal', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.decimal('foo', 5, 2);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` decimal(5, 2)'
      );
    });

    it('test adding decimal, no precision', function () {
      expect(() => {
        tableSql = client
          .schemaBuilder()
          .table('users', function () {
            this.decimal('foo', null);
          })
          .toSQL();
      }).to.throw(
        'Specifying no precision on decimal columns is not supported'
      );
    });

    it('test adding boolean', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.boolean('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` boolean');
    });

    it('test adding enum', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.enum('foo', ['bar', 'baz']);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "alter table `users` add `foo` enum('bar', 'baz')"
      );
    });

    it('test adding date', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.date('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` date');
    });

    it('test adding date time', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.dateTime('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` datetime'
      );
    });

    it('test adding date time with options object', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.dateTime('foo', { precision: 3 });
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` datetime(3)'
      );
    });

    it('test adding time', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.time('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` time');
    });

    it('test adding time with options object', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.time('foo', { precision: 3 });
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` time(3)');
    });

    it('test adding time stamp', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.timestamp('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` timestamp'
      );
    });

    it('test adding time stamp with options object', () => {
      tableSql = client
        .schemaBuilder()
        .table('users', (table) => {
          table.timestamp('foo', { precision: 3 });
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` timestamp(3)'
      );
    });

    it('test adding time stamps', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.timestamps();
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `created_at` datetime, add `updated_at` datetime'
      );
    });

    it('test adding precise timestamp', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.timestamp('foo', 6);
        })
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` timestamp(6)'
      );
    });

    it('test adding precise datetime', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.datetime('foo', 6);
        })
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` datetime(6)'
      );
    });

    it('test adding binary', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.binary('foo');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('alter table `users` add `foo` blob');
    });

    it('test adding decimal', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.decimal('foo', 2, 6);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` decimal(2, 6)'
      );
    });

    it('test set comment', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function (t) {
          t.comment('Custom comment');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "alter table `users` comment = 'Custom comment'"
      );
    });

    it('test set empty comment', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function (t) {
          t.comment('');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal("alter table `users` comment = ''");
    });

    it('test column comment with quotes', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('test', (t) => {
          t.text('column1').comment(
            "The table's first column and it's escaped"
          );
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "create table `test` (`column1` text comment 'The table\\'s first column and it\\'s escaped')"
      );
    });

    it('test column comment with pre-escaped quotes', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('test', (t) => {
          t.text('column1').comment(
            "The table\\'s first column and it\\'s escaped"
          );
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        "create table `test` (`column1` text comment 'The table\\'s first column and it\\'s escaped')"
      );
    });

    it('set comment to undefined', function () {
      expect(function () {
        client
          .schemaBuilder()
          .table('user', function (t) {
            t.comment();
          })
          .toSQL();
      }).to.throw(TypeError);
    });

    it('set comment to null', function () {
      expect(function () {
        client
          .schemaBuilder()
          .table('user', function (t) {
            t.comment(null);
          })
          .toSQL();
      }).to.throw(TypeError);
    });

    it('should alter columns with the alter flag', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.string('foo').alter();
          this.string('bar');
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `bar` varchar(255)'
      );
      expect(tableSql[1].sql).to.equal(
        'alter table `users` modify `foo` varchar(255)'
      );
    });

    it('is possible to set raw statements in defaultTo, #146', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('default_raw_test', function (t) {
          t.timestamp('created_at').defaultTo(client.raw('CURRENT_TIMESTAMP'));
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `default_raw_test` (`created_at` timestamp default CURRENT_TIMESTAMP)'
      );
    });

    it('allows dropping a unique compound index', function () {
      tableSql = client
        .schemaBuilder()
        .table('composite_key_test', function (t) {
          t.dropUnique(['column_a', 'column_b']);
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `composite_key_test` drop index `composite_key_test_column_a_column_b_unique`'
      );
    });

    it('allows default as alias for defaultTo', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('default_raw_test', function (t) {
          t.timestamp('created_at').default(client.raw('CURRENT_TIMESTAMP'));
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `default_raw_test` (`created_at` timestamp default CURRENT_TIMESTAMP)'
      );
    });

    it('sets myISAM engine', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('users', function (t) {
          t.string('username');
          t.engine('myISAM');
        })
        .toSQL();
      expect(tableSql[0].sql).to.equal(
        'create table `users` (`username` varchar(255)) engine = myISAM'
      );
    });

    it('#1430 - .primary & .dropPrimary takes columns and constraintName', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function (t) {
          t.primary(['test1', 'test2'], 'testconstraintname');
        })
        .toSQL();
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add primary key `testconstraintname`(`test1`, `test2`)'
      );

      tableSql = client
        .schemaBuilder()
        .createTable('users', function (t) {
          t.string('test').primary('testconstraintname');
        })
        .toSQL();

      expect(tableSql[1].sql).to.equal(
        'alter table `users` add primary key `testconstraintname`(`test`)'
      );
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
          .queryContext('schema context')
          .createTable('users', function (table) {
            table.increments('id');
            table.string('email');
          })
          .toSQL();

        expect(spy.callCount).to.equal(3);
        expect(spy.firstCall.args).to.deep.equal(['id', 'schema context']);
        expect(spy.secondCall.args).to.deep.equal(['email', 'schema context']);
        expect(spy.thirdCall.args).to.deep.equal(['users', 'schema context']);
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
};

const { expect } = require('chai');

const sinon = require('sinon');
const MySQL_Client = require('../../../lib/dialects/mysql');
const MySQL2_Client = require('../../../lib/dialects/mysql2');
const knex = require('../../../knex');

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

    it('create table like another', function () {
      tableSql = client
        .schemaBuilder()
        .createTableLike('users_like', 'users')
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `users_like` like `users`'
      );
    });

    it('create table like another with additionnal columns', function () {
      tableSql = client
        .schemaBuilder()
        .createTableLike('users_like', 'users', function (table) {
          table.text('add_col');
          table.integer('numeric_col');
        })
        .toSQL();
      expect(tableSql.length).to.equal(2);
      expect(tableSql[0].sql).to.equal(
        'create table `users_like` like `users`'
      );
      expect(tableSql[1].sql).to.equal(
        'alter table `users_like` add `add_col` text, add `numeric_col` int'
      );
    });

    it('test basic create table with incrementing without primary key', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('users', function (table) {
          table.increments('id');
          // In MySQL a autoincrement column is always a primary key
          table.increments('other_id', { primaryKey: false });
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `users` (`id` int unsigned not null auto_increment primary key, `other_id` int unsigned not null)'
      );
    });

    it('test basic create table with composite key on incrementing column + other', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('users', function (table) {
          table.primary(['userId', 'name']);
          table.increments('userId');
          table.string('name');
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `users` (`userId` int unsigned not null, `name` varchar(255), primary key (`userId`, `name`))'
      );
      expect(tableSql[1].sql).to.equal(
        'alter table `users` modify column `userId` int unsigned not null auto_increment'
      );
    });

    it('test basic create table with inline primary key creation', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('users', function (table) {
          table.string('id', 24).primary();
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `users` (`id` varchar(24), primary key (`id`))'
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

    describe('views', function () {
      let knexMysql;

      before(function () {
        knexMysql = knex({
          client: 'mysql2',
          connection: {},
        });
      });

      it('basic create view', async function () {
        const viewSql = client
          .schemaBuilder()
          .createView('adults', function (view) {
            view.columns(['name']);
            view.as(knexMysql('users').select('name').where('age', '>', '18'));
          })
          .toSQL();
        equal(1, viewSql.length);
        expect(viewSql[0].sql).to.equal(
          "create view `adults` (`name`) as select `name` from `users` where `age` > '18'"
        );
      });

      it('basic create view without columns', async function () {
        const viewSql = client
          .schemaBuilder()
          .createView('adults', function (view) {
            view.as(knexMysql('users').select('name').where('age', '>', '18'));
          })
          .toSQL();
        equal(1, viewSql.length);
        expect(viewSql[0].sql).to.equal(
          "create view `adults` as select `name` from `users` where `age` > '18'"
        );
      });

      it('create view or replace', async function () {
        const viewSql = client
          .schemaBuilder()
          .createViewOrReplace('adults', function (view) {
            view.columns(['name']);
            view.as(knexMysql('users').select('name').where('age', '>', '18'));
          })
          .toSQL();
        expect(viewSql.length).to.equal(1);
        expect(viewSql[0].sql).to.equal(
          "create or replace view `adults` (`name`) as select `name` from `users` where `age` > '18'"
        );
      });

      it('create view or replace without columns', async function () {
        const viewSql = client
          .schemaBuilder()
          .createViewOrReplace('adults', function (view) {
            view.as(knexMysql('users').select('name').where('age', '>', '18'));
          })
          .toSQL();
        expect(viewSql.length).to.equal(1);
        expect(viewSql[0].sql).to.equal(
          "create or replace view `adults` as select `name` from `users` where `age` > '18'"
        );
      });

      it('create view with check options', async function () {
        const viewSqlLocalCheck = client
          .schemaBuilder()
          .createView('adults', function (view) {
            view.columns(['name']);
            view.as(knexMysql('users').select('name').where('age', '>', '18'));
            view.localCheckOption();
          })
          .toSQL();
        equal(1, viewSqlLocalCheck.length);
        expect(viewSqlLocalCheck[0].sql).to.equal(
          "create view `adults` (`name`) as select `name` from `users` where `age` > '18' with local check option"
        );

        const viewSqlCascadedCheck = client
          .schemaBuilder()
          .createView('adults', function (view) {
            view.columns(['name']);
            view.as(knexMysql('users').select('name').where('age', '>', '18'));
            view.cascadedCheckOption();
          })
          .toSQL();
        equal(1, viewSqlCascadedCheck.length);
        expect(viewSqlCascadedCheck[0].sql).to.equal(
          "create view `adults` (`name`) as select `name` from `users` where `age` > '18' with cascaded check option"
        );
      });

      it('drop view', function () {
        tableSql = client.schemaBuilder().dropView('users').toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal('drop view `users`');
      });

      it('drop view with schema', function () {
        tableSql = client
          .schemaBuilder()
          .withSchema('myschema')
          .dropView('users')
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal('drop view `myschema`.`users`');
      });

      it('rename and change default of column of view', function () {
        expect(() => {
          tableSql = client
            .schemaBuilder()
            .view('users', function (view) {
              view.column('oldName').rename('newName').defaultTo('10');
            })
            .toSQL();
        }).to.throw('rename column of views is not supported by this dialect.');
      });

      it('rename view', function () {
        tableSql = client
          .schemaBuilder()
          .renameView('old_view', 'new_view')
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'rename table `old_view` to `new_view`'
        );
      });

      it('create materialized view', function () {
        expect(() => {
          tableSql = client
            .schemaBuilder()
            .createMaterializedView('mat_view', function (view) {
              view.columns(['name']);
              view.as(
                knexMysql('users').select('name').where('age', '>', '18')
              );
            })
            .toSQL();
        }).to.throw('materialized views are not supported by this dialect.');
      });

      it('refresh view', function () {
        expect(() => {
          tableSql = client
            .schemaBuilder()
            .refreshMaterializedView('view_to_refresh')
            .toSQL();
        }).to.throw('materialized views are not supported by this dialect.');
      });
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

    it('test adding unique key with storage engine index type', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.unique('foo', {
            indexName: 'bar',
            storageEngineIndexType: 'HASH',
          });
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add unique `bar`(`foo`) using HASH'
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

      expect(tableSql.length).to.equal(1);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add FULLTEXT index `baz`(`foo`, `bar`)'
      );
    });

    it('test adding index with an index type and storage engine index type', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          this.index(['foo', 'bar'], 'baz', {
            indexType: 'UNIQUE',
            storageEngineIndexType: 'BTREE',
          });
        })
        .toSQL();

      expect(tableSql.length).to.equal(1);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add UNIQUE index `baz`(`foo`, `bar`) using BTREE'
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

    it('adds foreign key with deferred throw error ', function () {
      const addDeferredConstraint = () => {
        client
          .schemaBuilder()
          .createTable('person', function (table) {
            table
              .integer('user_id')
              .notNull()
              .references('users.id')
              .deferrable('immediate');
          })
          .toSQL();
      };
      expect(addDeferredConstraint).to.throw(
        'mysql does not support deferrable'
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

    it('test adding big incrementing id without primary key', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function () {
          // In MySQL a autoincrement column is always a primary key
          this.bigIncrements('id', { primaryKey: false });
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `id` bigint unsigned not null'
      );
    });

    it('test basic create table with composite key on big incrementing column + other', function () {
      tableSql = client
        .schemaBuilder()
        .createTable('users', function (table) {
          table.primary(['userId', 'name']);
          table.bigincrements('userId');
          table.string('name');
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create table `users` (`userId` bigint unsigned not null, `name` varchar(255), primary key (`userId`, `name`))'
      );
      expect(tableSql[1].sql).to.equal(
        'alter table `users` modify column `userId` bigint unsigned not null auto_increment'
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

    it('adding uuid', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function (table) {
          table.uuid('foo');
        })
        .toSQL();

      expect(tableSql.length).to.equal(1);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` char(36)'
      );
    });

    it('adding binary uuid', function () {
      tableSql = client
        .schemaBuilder()
        .table('users', function (table) {
          table.uuid('foo', { useBinaryUuid: true });
        })
        .toSQL();

      expect(tableSql.length).to.equal(1);
      expect(tableSql[0].sql).to.equal(
        'alter table `users` add `foo` binary(16)'
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

    it('set comment to old comment limit (size 60+) #4863', function () {
      const warnMessages = [];
      client.logger = {
        warn: (msg) => {
          warnMessages.push(msg);
        },
      };
      client
        .schemaBuilder()
        .createTable('user', function (t) {
          t.comment(
            "A big comment. If we write more than 60 characters here it shouldn't trigger any warning since mysql and mariaDB maximum length is 1024 characters. Please fix this warning, it's annoying when a migration is taking place with multiple long comments."
          );
        })
        .toSQL();
      expect(warnMessages.length).to.equal(0);
    });

    it('set comment to current comment limit (size 1024+) #4863', function () {
      const warnMessages = [];
      client.logger = {
        warn: (msg) => {
          warnMessages.push(msg);
        },
      };
      client
        .schemaBuilder()
        .createTable('users', function (t) {
          t.comment('big comment'.repeat(100));
        })
        .toSQL();
      expect(warnMessages[0]).to.equal(
        'The max length for a table comment is 1024 characters'
      );
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

    describe('Checks tests', function () {
      it('allows adding checks positive', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.integer('price').checkPositive();
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          'alter table `user` add `price` int check (`price` > 0)'
        );
      });

      it('allows adding checks negative', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.integer('price').checkNegative();
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          'alter table `user` add `price` int check (`price` < 0)'
        );
      });

      it('allows adding checks in', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.string('animal').checkIn(['cat', 'dog']);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          "alter table `user` add `animal` varchar(255) check (`animal` in ('cat','dog'))"
        );
      });

      it('allows adding checks not in', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.string('animal').checkNotIn(['cat', 'dog']);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          "alter table `user` add `animal` varchar(255) check (`animal` not in ('cat','dog'))"
        );
      });

      it('allows adding checks between', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.integer('price').checkBetween([10, 15]);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          'alter table `user` add `price` int check (`price` between 10 and 15)'
        );
      });

      it('allows adding checks between with multiple intervals', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.integer('price').checkBetween([
              [10, 15],
              [20, 25],
            ]);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          'alter table `user` add `price` int check (`price` between 10 and 15 or `price` between 20 and 25)'
        );
      });

      it('allows adding checks between strings', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.integer('price').checkBetween(['banana', 'orange']);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          "alter table `user` add `price` int check (`price` between 'banana' and 'orange')"
        );
      });

      it('allows length equals', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.varchar('phone').checkLength('=', 8);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          'alter table `user` add `phone` varchar(255) check (length(`phone`) = 8)'
        );
      });

      it('check regexp', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.varchar('phone').checkRegex('[0-9]{8}');
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          "alter table `user` add `phone` varchar(255) check (`phone` REGEXP '[0-9]{8}')"
        );
      });

      it('drop checks', function () {
        tableSql = client
          .schemaBuilder()
          .table('user', function (t) {
            t.dropChecks(['check_constraint1', 'check_constraint2']);
          })
          .toSQL();
        expect(tableSql[0].sql).to.equal(
          'alter table `user` drop constraint check_constraint1, drop constraint check_constraint2'
        );
      });
    });
  });
};

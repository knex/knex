/* eslint max-len:0 */
'use strict';

const { expect } = require('chai');

let tableSql;

const Redshift_Client = require('../../../lib/dialects/redshift');
const knex = require('../../../knex');
const FunctionHelper = require('../../../lib/knex-builder/FunctionHelper');
const client = new Redshift_Client({ client: 'redshift' });

const equal = require('assert').equal;

describe('Redshift SchemaBuilder', function () {
  it('fixes memoization regression', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.uuid('key');
        table.increments('id');
        table.string('email');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users" ("key" char(36), "id" integer identity(1,1) primary key not null, "email" varchar(255))'
    );
  });

  it('create table like another', function () {
    tableSql = client
      .schemaBuilder()
      .createTableLike('users_like', 'users')
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users_like" (like "users")'
    );
  });

  it('create table like another with additional columns', function () {
    tableSql = client
      .schemaBuilder()
      .createTableLike('users_like', 'users', function (table) {
        table.text('add_col');
        table.integer('add_num_col');
      })
      .toSQL();
    expect(tableSql.length).to.equal(3);
    expect(tableSql[0].sql).to.equal(
      'create table "users_like" (like "users")'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users_like" add column "add_col" varchar(max)'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "users_like" add column "add_num_col" integer'
    );
  });

  it('basic alter table', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.increments('id');
        table.string('email');
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "id" integer identity(1,1) primary key not null'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "email" varchar(255)'
    );
  });

  describe('views', function () {
    let knexRedShift;

    before(function () {
      knexRedShift = knex({
        client: 'redshift',
        connection: {},
      });
    });

    it('basic create view', async function () {
      const viewSql = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      expect(viewSql.length).to.equal(1);
      expect(viewSql[0].sql).to.equal(
        'create view "adults" ("name") as select "name" from "users" where "age" > \'18\''
      );
    });

    it('basic create view without columns', async function () {
      const viewSql = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      expect(viewSql.length).to.equal(1);
      expect(viewSql[0].sql).to.equal(
        'create view "adults" as select "name" from "users" where "age" > \'18\''
      );
    });

    it('create view or replace', async function () {
      const viewSql = client
        .schemaBuilder()
        .createViewOrReplace('adults', function (view) {
          view.columns(['name']);
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      expect(viewSql.length).to.equal(1);
      expect(viewSql[0].sql).to.equal(
        'create or replace view "adults" ("name") as select "name" from "users" where "age" > \'18\''
      );
    });

    it('create view or replace without columns', async function () {
      const viewSql = client
        .schemaBuilder()
        .createViewOrReplace('adults', function (view) {
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      expect(viewSql.length).to.equal(1);
      expect(viewSql[0].sql).to.equal(
        'create or replace view "adults" as select "name" from "users" where "age" > \'18\''
      );
    });

    it('create view with check options', async function () {
      const viewSqlLocalCheck = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
          view.localCheckOption();
        })
        .toSQL();
      expect(viewSqlLocalCheck.length).to.equal(1);
      expect(viewSqlLocalCheck[0].sql).to.equal(
        'create view "adults" ("name") as select "name" from "users" where "age" > \'18\' with local check option'
      );

      const viewSqlCascadedCheck = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
          view.cascadedCheckOption();
        })
        .toSQL();
      expect(viewSqlCascadedCheck.length).to.equal(1);
      expect(viewSqlCascadedCheck[0].sql).to.equal(
        'create view "adults" ("name") as select "name" from "users" where "age" > \'18\' with cascaded check option'
      );
    });

    it('drop view', function () {
      tableSql = client.schemaBuilder().dropView('users').toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop view "users"');
    });

    it('drop view with schema', function () {
      tableSql = client
        .schemaBuilder()
        .withSchema('myschema')
        .dropView('users')
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal('drop view "myschema"."users"');
    });

    it('rename and change default of column of view', function () {
      tableSql = client
        .schemaBuilder()
        .view('users', function (view) {
          view.column('oldName').rename('newName').defaultTo('10');
        })
        .toSQL();
      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter view "users" rename "oldName" to "newName"'
      );
      expect(tableSql[1].sql).to.equal(
        'alter view "users" alter "oldName" set default 10'
      );
    });

    it('rename view', function () {
      tableSql = client
        .schemaBuilder()
        .renameView('old_view', 'new_view')
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter view "old_view" rename to "new_view"'
      );
    });

    it('create materialized view', function () {
      tableSql = client
        .schemaBuilder()
        .createMaterializedView('mat_view', function (view) {
          view.columns(['name']);
          view.as(knexRedShift('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'create materialized view "mat_view" ("name") as select "name" from "users" where "age" > \'18\''
      );
    });

    it('refresh view', function () {
      tableSql = client
        .schemaBuilder()
        .refreshMaterializedView('view_to_refresh')
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'refresh materialized view "view_to_refresh"'
      );
    });
  });

  it('alter table with schema', function () {
    tableSql = client
      .schemaBuilder()
      .withSchema('myschema')
      .table('users', function (table) {
        table.increments('id');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "myschema"."users" add column "id" integer identity(1,1) primary key not null'
    );
  });

  it('drop table', function () {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table "users"');
  });

  it('drop table with schema', function () {
    tableSql = client
      .schemaBuilder()
      .withSchema('myschema')
      .dropTable('users')
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table "myschema"."users"');
  });

  it('drop table if exists', function () {
    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table if exists "users"');
  });

  it('drop table if exists with schema', function () {
    tableSql = client
      .schemaBuilder()
      .withSchema('myschema')
      .dropTableIfExists('users')
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table if exists "myschema"."users"');
  });

  it('drop column', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropColumn('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop column "foo"');
  });

  it('drop multiple columns', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropColumn(['foo', 'bar']);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop column "foo", drop column "bar"'
    );
  });

  it('drop multiple columns with arguments', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropColumn('foo', 'bar');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop column "foo", drop column "bar"'
    );
  });

  it('drop primary', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropPrimary();
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "users_pkey"'
    );
  });

  it('drop unique', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropUnique('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "users_foo_unique"'
    );
  });

  it('drop unique, custom', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropUnique(null, 'foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "foo"'
    );
  });

  it('drop index should be a no-op', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropIndex('foo');
      })
      .toSQL();
    equal(0, tableSql.length);
  });

  it('drop foreign', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropForeign('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "users_foo_foreign"'
    );
  });

  it('drop foreign', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropForeign(null, 'foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "foo"'
    );
  });

  it('drop timestamps', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropTimestamps();
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop column "created_at", drop column "updated_at"'
    );
  });

  it('rename table', function () {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" rename to "foo"');
  });

  it('adding primary key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.primary('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add constraint "users_pkey" primary key ("foo")'
    );
  });

  it('adding primary key fluently', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('name').primary();
        table.string('foo');
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users" ("name" varchar(255) not null, "foo" varchar(255))'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add constraint "users_pkey" primary key ("name")'
    );
  });

  it('adding foreign key', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('accounts', function (table) {
        table.integer('account_id').references('users.id');
      })
      .toSQL();
    expect(tableSql[1].sql).to.equal(
      'alter table "accounts" add constraint "accounts_account_id_foreign" foreign key ("account_id") references "users" ("id")'
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
      'alter table "person" add constraint "person_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete SET NULL'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "person" add constraint "person_account_id_foreign" foreign key ("account_id") references "accounts" ("id") on update cascade'
    );
  });

  it('adding unique key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.unique('foo', 'bar');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add constraint "bar" unique ("foo")'
    );
  });

  it('adding unique key fluently', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (table) {
        table.string('email').unique();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users" ("email" varchar(255))'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add constraint "users_email_unique" unique ("email")'
    );
  });

  it('adding index should be a no-op', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz');
      })
      .toSQL();
    equal(0, tableSql.length);
  });

  it('adding incrementing id', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.increments('id');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "id" integer identity(1,1) primary key not null'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "id" bigint identity(1,1) primary key not null'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" varchar(255)'
    );
  });

  it('adding varchar with length', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo', 100);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" varchar(100)'
    );
  });

  it('adding a string with a default', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('foo', 100).defaultTo('bar');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" varchar(100) default \'bar\''
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" varchar(max)'
    );
  });

  it('adding big integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.bigInteger('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" bigint'
    );
  });

  it('tests a big integer as the primary autoincrement key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.bigIncrements('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" bigint identity(1,1) primary key not null'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" integer'
    );
  });

  it('adding autoincrement integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.increments('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" integer identity(1,1) primary key not null'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" integer'
    );
  });

  it('adding tiny integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.tinyint('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" smallint'
    );
  });

  it('adding small integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.smallint('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" smallint'
    );
  });

  it('adding float', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.float('foo', 5, 2);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" real'
    );
  });

  it('adding double', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.double('foo', 15, 8);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" double precision'
    );
  });

  it('adding decimal', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.decimal('foo', 5, 2);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" decimal(5, 2)'
    );
  });

  it('adding boolean', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.boolean('foo').defaultTo(false);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" boolean default \'0\''
    );
  });

  it('adding enum', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.enum('foo', ['bar', 'baz']);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" varchar(255)'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" date'
    );
  });

  it('adding date time', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dateTime('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding time', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.time('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" time'
    );
  });

  it('adding timestamp', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.timestamp('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding timestamps', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.timestamps();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "created_at" timestamptz'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "updated_at" timestamptz'
    );
  });

  it('adding timestamps with defaults', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.timestamps(false, true);
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "created_at" timestamptz not null default CURRENT_TIMESTAMP'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "updated_at" timestamptz not null default CURRENT_TIMESTAMP'
    );
  });

  it('adding binary', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.binary('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" varchar(max)'
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
      'alter table "user" add column "preferences" varchar(max)'
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
      'alter table "users" add column "foo" char(36)'
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
      'alter table "users" add column "foo" binary(16)'
    );
  });

  it('redshift doesnt have a uuid function', function () {
    const helperFunctions = new FunctionHelper(client);

    expect(() => helperFunctions.uuid()).to.throw(
      `${client.driverName} does not have a uuid function`
    );
  });

  it('allows adding default json objects when the column is json', function () {
    tableSql = client
      .schemaBuilder()
      .table('user', function (t) {
        t.json('preferences').defaultTo({}).notNullable();
      })
      .toSQL();
    expect(tableSql[0].sql).to.equal(
      'alter table "user" add column "preferences" varchar(max) not null default \'{}\''
    );
  });

  it('sets specificType correctly', function () {
    tableSql = client
      .schemaBuilder()
      .table('user', function (t) {
        t.specificType('email', 'CITEXT').unique().notNullable();
      })
      .toSQL();
    expect(tableSql[0].sql).to.equal(
      'alter table "user" add column "email" CITEXT not null'
    );
  });

  it('allows creating an extension', function () {
    const sql = client.schemaBuilder().createExtension('test').toSQL();
    expect(sql[0].sql).to.equal('create extension "test"');
  });

  it('allows dropping an extension', function () {
    const sql = client.schemaBuilder().dropExtension('test').toSQL();
    expect(sql[0].sql).to.equal('drop extension "test"');
  });

  it("allows creating an extension only if it doesn't exist", function () {
    const sql = client
      .schemaBuilder()
      .createExtensionIfNotExists('test')
      .toSQL();
    expect(sql[0].sql).to.equal('create extension if not exists "test"');
  });

  it('allows dropping an extension only if it exists', function () {
    const sql = client.schemaBuilder().dropExtensionIfExists('test').toSQL();
    expect(sql[0].sql).to.equal('drop extension if exists "test"');
  });

  it('does not support table inheritance', function () {
    expect(() => {
      client
        .schemaBuilder()
        .createTable('inheriteeTable', function (t) {
          t.string('username');
          t.inherits('inheritedTable');
        })
        .toSQL();
    }).to.throw('Knex only supports inherits statement with postgresql');
  });

  it('should throw on usage of disallowed method', function () {
    expect(() => {
      client
        .schemaBuilder()
        .createTable('users', function (t) {
          t.string('username');
          t.engine('myISAM');
        })
        .toSQL();
    }).to.throw('Knex only supports engine statement with mysql');
  });

  it('#1430 - .primary & .dropPrimary takes columns and constraintName', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (t) {
        // t.string('test1').notNullable();
        t.string('test1');
        t.string('test2').notNullable();
        t.primary(['test1', 'test2'], 'testconstraintname');
      })
      .toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "test1" varchar(255)'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "test2" varchar(255) not null'
    );

    tableSql = client
      .schemaBuilder()
      .table('users', function (t) {
        t.string('test1').notNullable();
        t.string('test2').notNullable();
        t.primary(['test1', 'test2'], 'testconstraintname');
      })
      .toSQL();

    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "test1" varchar(255) not null'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "test2" varchar(255) not null'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "users" add constraint "testconstraintname" primary key ("test1", "test2")'
    );

    tableSql = client
      .schemaBuilder()
      .createTable('users', function (t) {
        t.string('test').primary('testconstraintname');
      })
      .toSQL();

    expect(tableSql[0].sql).to.equal(
      'create table "users" ("test" varchar(255) not null)'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add constraint "testconstraintname" primary key ("test")'
    );
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
        'alter table "user" add column "price" integer check ("price" > 0)'
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
        'alter table "user" add column "price" integer check ("price" < 0)'
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
        'alter table "user" add column "animal" varchar(255) check ("animal" in (\'cat\',\'dog\'))'
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
        'alter table "user" add column "animal" varchar(255) check ("animal" not in (\'cat\',\'dog\'))'
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
        'alter table "user" add column "price" integer check ("price" between 10 and 15)'
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
        'alter table "user" add column "price" integer check ("price" between 10 and 15 or "price" between 20 and 25)'
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
        'alter table "user" add column "price" integer check ("price" between \'banana\' and \'orange\')'
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
        'alter table "user" add column "phone" varchar(255) check (length("phone") = 8)'
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
        'alter table "user" add column "phone" varchar(255) check ("phone" ~ \'[0-9]{8}\')'
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
        'alter table "user" drop constraint check_constraint1, drop constraint check_constraint2'
      );
    });
  });
});

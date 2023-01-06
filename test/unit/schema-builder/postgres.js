const { expect } = require('chai');

let tableSql;

const sinon = require('sinon');
const PG_Client = require('../../../lib/dialects/postgres');
const client = new PG_Client({ client: 'pg' });
const knex = require('../../../knex');

const equal = require('chai').assert.equal;

describe('PostgreSQL Config', function () {
  let knexInstance;
  let version;
  const config = {
    client: 'pg',
    connection: {
      user: 'postgres',
      password: '',
      host: '127.0.0.1',
      database: 'knex_test',
    },
  };
  describe('check version', function () {
    describe('check version < 9.2', function () {
      beforeEach(function () {
        version = '7.2';
        config.version = version;
        knexInstance = knex(config);
      });

      it('client.version', function () {
        expect(knexInstance.client.version).to.equal(version);
      });

      it('json', function () {
        tableSql = knexInstance.schema
          .table('public', function (t) {
            t.json('test_name');
          })
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'alter table "public" add column "test_name" text'
        );
      });

      it('jsonb', function () {
        tableSql = knexInstance.schema
          .table('public', function (t) {
            t.jsonb('test_name');
          })
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'alter table "public" add column "test_name" text'
        );
      });
    });

    describe('check version >= 9.2', function () {
      beforeEach(function () {
        version = '9.5';
        config.version = version;
        knexInstance = knex(config);
      });

      it('client.version', function () {
        expect(knexInstance.client.version).to.equal(version);
      });

      it('json', function () {
        tableSql = knexInstance.schema
          .table('public', function (t) {
            t.json('test_name');
          })
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'alter table "public" add column "test_name" json'
        );
      });

      it('jsonb', function () {
        tableSql = knexInstance.schema
          .table('public', function (t) {
            t.jsonb('test_name');
          })
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'alter table "public" add column "test_name" jsonb'
        );
      });
    });

    describe('check custom pg client', function () {
      it('jsonb as text', function () {
        knexInstance = knex({
          ...config,
          version: 'custom-pg',
          jsonbSupport: false,
        });
        tableSql = knexInstance.schema
          .table('public', function (t) {
            t.jsonb('test_name');
          })
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'alter table "public" add column "test_name" text'
        );
      });
      it('jsonb', function () {
        knexInstance = knex({
          ...config,
          version: 'custom-pg',
          jsonbSupport: true,
        });
        tableSql = knexInstance.schema
          .table('public', function (t) {
            t.jsonb('test_name');
          })
          .toSQL();
        equal(1, tableSql.length);
        expect(tableSql[0].sql).to.equal(
          'alter table "public" add column "test_name" jsonb'
        );
      });
    });
  });
});

describe('PostgreSQL SchemaBuilder', function () {
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
      'create table "users" ("key" uuid, "id" serial primary key, "email" varchar(255))'
    );
  });

  it('create table like another', function () {
    tableSql = client
      .schemaBuilder()
      .createTableLike('users_like', 'users')
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users_like" (like "users" including all)'
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
    expect(tableSql.length).to.equal(1);
    expect(tableSql[0].sql).to.equal(
      'create table "users_like" (like "users" including all, "add_col" text, "numeric_col" integer)'
    );
  });

  it('create table with uuid primary key in one go', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('uuid_primary', function (table) {
        table.uuid('id', { primaryKey: true });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "uuid_primary" ("id" uuid primary key)'
    );
  });

  it('should create a table with inline uuid primary key creation', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('uuids', function (table) {
        table.uuid('id').primary();
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "uuids" ("id" uuid, constraint "uuids_pkey" primary key ("id"))'
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
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "id" serial primary key, add column "email" varchar(255)'
    );
  });

  it('should alter columns with the alter flag', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.string('foo').notNullable().default('foo').alter();
        this.integer('bar').alter();
      })
      .toSQL();

    equal(8, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" alter column "foo" drop default'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" alter column "foo" drop not null'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "users" alter column "foo" type varchar(255) using ("foo"::varchar(255))'
    );
    expect(tableSql[3].sql).to.equal(
      'alter table "users" alter column "foo" set default \'foo\''
    );
    expect(tableSql[4].sql).to.equal(
      'alter table "users" alter column "foo" set not null'
    );
    expect(tableSql[5].sql).to.equal(
      'alter table "users" alter column "bar" drop default'
    );
    expect(tableSql[6].sql).to.equal(
      'alter table "users" alter column "bar" drop not null'
    );
    expect(tableSql[7].sql).to.equal(
      'alter table "users" alter column "bar" type integer using ("bar"::integer)'
    );
  });

  it('should not alter nullable when alterNullable is false', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.string('foo').default('foo').alter({ alterNullable: false });
      })
      .toSQL();

    equal(3, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" alter column "foo" drop default'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" alter column "foo" type varchar(255) using ("foo"::varchar(255))'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "users" alter column "foo" set default \'foo\''
    );
  });

  it('should alter nullable when alterNullable is true', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.string('foo').default('foo').alter({ alterNullable: true });
      })
      .toSQL();

    equal(4, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" alter column "foo" drop default'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" alter column "foo" drop not null'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "users" alter column "foo" type varchar(255) using ("foo"::varchar(255))'
    );
    expect(tableSql[3].sql).to.equal(
      'alter table "users" alter column "foo" set default \'foo\''
    );
  });

  it('should not alter type when alterType is false', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.string('foo').default('foo').alter({ alterType: false });
      })
      .toSQL();

    equal(3, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" alter column "foo" drop default'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" alter column "foo" drop not null'
    );
    expect(tableSql[2].sql).to.equal(
      'alter table "users" alter column "foo" set default \'foo\''
    );
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
      'alter table "myschema"."users" add column "id" serial primary key'
    );
  });

  it('alter table with checks', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.integer('price').checkPositive();
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "price" integer check ("price" > 0)'
    );
  });

  it('drop table', function () {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table "users"');
  });

  describe('views', function () {
    let knexPg;

    before(function () {
      knexPg = knex({
        client: 'postgresql',
        version: '10.5',
        connection: {
          pool: {},
        },
      });
    });

    it('basic create view', async function () {
      const viewSql = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexPg('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      equal(1, viewSql.length);
      expect(viewSql[0].sql).to.equal(
        'create view "adults" ("name") as select "name" from "users" where "age" > \'18\''
      );
    });

    it('basic create view without columns', async function () {
      const viewSql = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.as(knexPg('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      equal(1, viewSql.length);
      expect(viewSql[0].sql).to.equal(
        'create view "adults" as select "name" from "users" where "age" > \'18\''
      );
    });

    it('create view or replace', async function () {
      const viewSql = client
        .schemaBuilder()
        .createViewOrReplace('adults', function (view) {
          view.columns(['name']);
          view.as(knexPg('users').select('name').where('age', '>', '18'));
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
          view.as(knexPg('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      equal(1, viewSql.length);
      expect(viewSql[0].sql).to.equal(
        'create or replace view "adults" as select "name" from "users" where "age" > \'18\''
      );
    });

    it('create view with check options', async function () {
      const viewSqlLocalCheck = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexPg('users').select('name').where('age', '>', '18'));
          view.localCheckOption();
        })
        .toSQL();
      equal(1, viewSqlLocalCheck.length);
      expect(viewSqlLocalCheck[0].sql).to.equal(
        'create view "adults" ("name") as select "name" from "users" where "age" > \'18\' with local check option'
      );

      const viewSqlCascadedCheck = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexPg('users').select('name').where('age', '>', '18'));
          view.cascadedCheckOption();
        })
        .toSQL();
      equal(1, viewSqlCascadedCheck.length);
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
          view.as(knexPg('users').select('name').where('age', '>', '18'));
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

    it('refresh view concurrently', function () {
      tableSql = client
        .schemaBuilder()
        .refreshMaterializedView('view_to_refresh', true)
        .toSQL();
      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'refresh materialized view concurrently "view_to_refresh"'
      );
    });
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

  it('drop primary takes constraint name', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropPrimary('testconstraintname');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "testconstraintname"'
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

  it('drop index', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropIndex('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "users_foo_index"');
  });

  it('drop index, custom', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.dropIndex(null, 'foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "foo"');
  });

  it('drop index, with schema', function () {
    tableSql = client
      .schemaBuilder()
      .withSchema('mySchema')
      .table('users', function (table) {
        table.dropIndex('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "mySchema"."users_foo_index"');
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

  it('adds foreign key with deferrable initially immediate', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('person', function (table) {
        table
          .integer('user_id')
          .notNull()
          .references('users.id')
          .deferrable('immediate');
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[1].sql).to.equal(
      'alter table "person" add constraint "person_user_id_foreign" foreign key ("user_id") references "users" ("id") deferrable initially immediate '
    );
  });

  it('adds unique constraint with deferrable initially immediate', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('person', function (table) {
        table
          .integer('user_id')
          .unique({ indexName: 'user_id_index', deferrable: 'immediate' });
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[1].sql).to.equal(
      'alter table "person" add constraint "user_id_index" unique ("user_id") deferrable initially immediate'
    );
  });

  it('adds primary constraint with deferrable initially immediate', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('person', function (table) {
        table.integer('user_id').primary({
          constraintName: 'user_id_primary',
          deferrable: 'immediate',
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "person" ("user_id" integer, constraint "user_id_primary" primary key ("user_id") deferrable initially immediate)'
    );
  });

  it('rename table', function () {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" rename to "foo"');
  });

  it('rename column', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.renameColumn('foo', 'bar');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" rename "foo" to "bar"'
    );
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
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users" ("name" varchar(255), constraint "users_pkey" primary key ("name"))'
    );
  });

  it('adding foreign key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.foreign('foo_id').references('id').on('orders');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add constraint "users_foo_id_foreign" foreign key ("foo_id") references "orders" ("id")'
    );

    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.integer('foo_id').references('id').on('orders');
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo_id" integer'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add constraint "users_foo_id_foreign" foreign key ("foo_id") references "orders" ("id")'
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
      'alter table "users" add constraint "fk_foo" foreign key ("foo_id") references "orders" ("id")'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo_id" integer'
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add constraint "fk_foo" foreign key ("foo_id") references "orders" ("id")'
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

  it('adding unique index', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.unique('foo', {
          indexName: 'bar',
          useConstraint: false,
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create unique index "bar" on "users" ("foo")'
    );
  });

  it('adding index without value', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar']);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create index "users_foo_bar_index" on "users" ("foo", "bar")'
    );
  });

  it('adding index', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create index "baz" on "users" ("foo", "bar")'
    );
  });

  it('adding index fluently', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('name').index();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "name" varchar(255)'
    );
    expect(tableSql[1].sql).to.equal(
      'create index "users_name_index" on "users" ("name")'
    );
  });

  it('adding index with an index type', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz', 'gist');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create index "baz" on "users" using gist ("foo", "bar")'
    );
  });

  it('adding index with an index type fluently', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('name').index('baz', 'gist');
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "name" varchar(255)'
    );
    expect(tableSql[1].sql).to.equal(
      'create index "baz" on "users" using gist ("name")'
    );
  });

  it('adding index with an index type and default name fluently', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.string('name').index(null, { indexType: 'gist' });
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "name" varchar(255)'
    );
    expect(tableSql[1].sql).to.equal(
      'create index "users_name_index" on "users" using gist ("name")'
    );
  });

  it('adding index with a predicate', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz', {
          predicate: client.queryBuilder().whereRaw('email = "foo@bar"'),
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create index "baz" on "users" ("foo", "bar") where email = "foo@bar"'
    );
  });

  it('adding index with an index type and a predicate', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz', {
          indexType: 'gist',
          predicate: client.queryBuilder().whereRaw('email = "foo@bar"'),
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create index "baz" on "users" using gist ("foo", "bar") where email = "foo@bar"'
    );
  });

  it('adding index with a where not null predicate', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.index(['foo', 'bar'], 'baz', {
          predicate: client.queryBuilder().whereNotNull('email'),
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create index "baz" on "users" ("foo", "bar") where "email" is not null'
    );
  });

  it('adding unique index with a predicate', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.unique(['foo', 'bar'], {
          indexName: 'baz',
          predicate: client.queryBuilder().whereRaw('email = "foo@bar"'),
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create unique index "baz" on "users" ("foo", "bar") where email = "foo@bar"'
    );
  });

  it('adding unique index with a where not null predicate', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.unique(['foo', 'bar'], {
          indexName: 'baz',
          predicate: client.queryBuilder().whereNotNull('email'),
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create unique index "baz" on "users" ("foo", "bar") where "email" is not null'
    );
  });

  it('throws when adding unique constraint with a predicate', function () {
    expect(() => {
      client
        .schemaBuilder()
        .table('users', function (table) {
          table.unique(['foo', 'bar'], {
            indexName: 'baz',
            useConstraint: true,
            predicate: client.queryBuilder().whereNotNull('email'),
          });
        })
        .toSQL();
    }).to.throw('postgres cannot create constraint with predicate');
  });

  it('throws when adding unique index with deferrable set', function () {
    expect(() => {
      client
        .schemaBuilder()
        .table('users', function (table) {
          table.unique(['foo', 'bar'], {
            indexName: 'baz',
            useConstraint: false,
            deferrable: 'immediate',
          });
        })
        .toSQL();
    }).to.throw('postgres cannot create deferrable index');
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
      'alter table "users" add column "id" serial primary key'
    );
  });

  it('adding incrementing id without primary key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.increments('id', { primaryKey: false });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "id" serial'
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
      'alter table "users" add column "id" bigserial primary key'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "id" bigserial'
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
      'alter table "users" add column "foo" text'
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
      'alter table "users" add column "foo" bigserial primary key'
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
      'alter table "users" add column "foo" serial primary key'
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

  it('adding decimal, variable precision', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.decimal('foo', null);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" decimal'
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
      'alter table "users" add column "foo" text check ("foo" in (\'bar\', \'baz\'))'
    );
  });

  it('adding enum with useNative', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table
          .enu('foo', ['bar', 'baz'], {
            useNative: true,
            enumName: 'foo_type',
          })
          .notNullable();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      "create type \"foo_type\" as enum ('bar', 'baz')"
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "foo" "foo_type" not null'
    );
  });

  it('adding enum with useNative and withSchema', function () {
    const schema = 'test';
    const enumName = 'foo_type';

    tableSql = client
      .schemaBuilder()
      .withSchema(schema)
      .table('users', function (table) {
        table
          .enu('foo', ['bar', 'baz'], {
            useNative: true,
            schema: true,
            enumName,
          })
          .notNullable();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      `create type "${schema}"."${enumName}" as enum ('bar', 'baz')`
    );
    expect(tableSql[1].sql).to.equal(
      `alter table "${schema}"."users" add column "foo" "${schema}"."${enumName}" not null`
    );
  });

  it('adding enum with useNative and existingType', function () {
    tableSql = client
      .schemaBuilder()
      .raw("create type \"foo_type\" as enum ('bar', 'baz')")
      .table('users', function (table) {
        table
          .enu('foo', ['bar', 'baz'], {
            useNative: true,
            existingType: true,
            enumName: 'foo_type',
          })
          .notNullable();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      "create type \"foo_type\" as enum ('bar', 'baz')"
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "foo" "foo_type" not null'
    );
  });

  it('adding enum with useNative and existingType works without enum values', function () {
    tableSql = client
      .schemaBuilder()
      .raw("create type \"foo_type\" as enum ('bar', 'baz')")
      .table('users', function (table) {
        table
          .enu('foo', undefined, {
            useNative: true,
            existingType: true,
            enumName: 'foo_type',
          })
          .notNullable();
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      "create type \"foo_type\" as enum ('bar', 'baz')"
    );
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add column "foo" "foo_type" not null'
    );
  });

  it('adding enum with useNative, from manually defined schema and withSchema', function () {
    const tableSchema = 'table_schema';
    const tableName = 'table_name';
    const typeSchema = 'type_schema';
    const typeName = 'type_name';
    const columnName = 'column_name';

    tableSql = client
      .schemaBuilder()
      .withSchema(tableSchema)
      .table(tableName, function (table) {
        table.enu(columnName, ['foo', 'bar', 'baz'], {
          useNative: true,
          schemaName: typeSchema,
          enumName: typeName,
        });
      })
      .toSQL();
    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      `create type "${typeSchema}"."${typeName}" as enum ('foo', 'bar', 'baz')`
    );
    expect(tableSql[1].sql).to.equal(
      `alter table "${tableSchema}"."${tableName}" add column "${columnName}" "${typeSchema}"."${typeName}"`
    );
  });

  it('adding enum with useNative and existingType, from manually defined schema and withSchema', function () {
    const tableSchema = 'table_schema';
    const tableName = 'table_name';
    const typeSchema = 'type_schema';
    const typeName = 'type_name';
    const columnName = 'column_name';

    tableSql = client
      .schemaBuilder()
      .withSchema(tableSchema)
      .table(tableName, function (table) {
        table.enu(columnName, null, {
          useNative: true,
          schemaName: typeSchema,
          enumName: typeName,
          existingType: true,
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      `alter table "${tableSchema}"."${tableName}" add column "${columnName}" "${typeSchema}"."${typeName}"`
    );
  });

  it('adding enum with useNative and alter', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table
          .enu('foo', ['bar', 'baz'], {
            useNative: true,
            enumName: 'foo_type',
          })
          .notNullable()
          .alter();
      })
      .toSQL();
    equal(5, tableSql.length);

    const expectedSql = [
      "create type \"foo_type\" as enum ('bar', 'baz')",
      'alter table "users" alter column "foo" drop default',
      'alter table "users" alter column "foo" drop not null',
      'alter table "users" alter column "foo" type "foo_type" using ("foo"::text::"foo_type")',
      'alter table "users" alter column "foo" set not null',
    ];

    for (let i = 0; i < tableSql.length; i++) {
      expect(tableSql[i].sql).to.equal(expectedSql[i]);
    }
  });

  it('adding multiple useNative enums with some alters', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table
          .enu('foo', ['bar', 'baz'], {
            useNative: true,
            enumName: 'foo_type',
          })
          .notNullable()
          .alter();

        table.enu('bar', ['foo', 'baz'], {
          useNative: true,
          enumName: 'bar_type',
        });

        table
          .enu('baz', ['foo', 'bar'], {
            useNative: true,
            enumName: 'baz_type',
          })
          .defaultTo('foo')
          .alter();
      })
      .toSQL();
    equal(12, tableSql.length);

    const expectedSql = [
      "create type \"baz_type\" as enum ('foo', 'bar')",
      "create type \"foo_type\" as enum ('bar', 'baz')",
      "create type \"bar_type\" as enum ('foo', 'baz')",

      'alter table "users" add column "bar" "bar_type"',

      'alter table "users" alter column "foo" drop default',
      'alter table "users" alter column "foo" drop not null',
      'alter table "users" alter column "foo" type "foo_type" using ("foo"::text::"foo_type")',
      'alter table "users" alter column "foo" set not null',

      'alter table "users" alter column "baz" drop default',
      'alter table "users" alter column "baz" drop not null',
      'alter table "users" alter column "baz" type "baz_type" using ("baz"::text::"baz_type")',
      'alter table "users" alter column "baz" set default \'foo\'',
    ];

    for (let i = 0; i < tableSql.length; i++) {
      expect(tableSql[i].sql).to.equal(expectedSql[i]);
    }
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

  it('adding date time', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.dateTime('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding time', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.time('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" time'
    );
  });

  it('adding default timestamp', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding default datetime', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding timestamp with timezone', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', false);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding datetime with timezone', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', false);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding timestamp without timezone', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', true);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamp'
    );
  });

  it('adding datetime without timezone', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', true);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamp'
    );
  });

  it('adding timestamp with precision', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', undefined, 2);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz(2)'
    );
  });

  it('adding datetime with precision', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', undefined, 3);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz(3)'
    );
  });

  it('adding timestamp with options object', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', { useTz: false, precision: 3 });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamp(3)'
    );
  });

  it('adding timestamp with options object but no timestamp', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', { precision: 3 });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz(3)'
    );
  });

  it('adding timestamp with empty options object', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', {});
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding timestamp with options object but precision 0 - #4784', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamp('foo', { useTz: false, precision: 0 });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamp(0)'
    );
  });

  it('adding datetime with options object', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', { useTz: false, precision: 3 });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamp(3)'
    );
  });

  it('adding datetime with options object but no timestamp', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', { precision: 3 });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz(3)'
    );
  });

  it('adding datetime with empty options object', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', {});
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamptz'
    );
  });

  it('adding datetime with options object but precision 0 - #4784', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.datetime('foo', { useTz: false, precision: 0 });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "foo" timestamp(0)'
    );
  });

  it('adding timestamps', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamps();
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "created_at" timestamptz, add column "updated_at" timestamptz'
    );
  });

  it('adding timestamps with defaults', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamps(false, true);
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "created_at" timestamptz not null default CURRENT_TIMESTAMP, add column "updated_at" timestamptz not null default CURRENT_TIMESTAMP'
    );
  });

  it('adding timestamps with options object', () => {
    tableSql = client
      .schemaBuilder()
      .table('users', (table) => {
        table.timestamps({
          useTimestamps: true,
          defaultToNow: true,
          useCamelCase: true,
        });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add column "createdAt" timestamptz not null default CURRENT_TIMESTAMP, add column "updatedAt" timestamptz not null default CURRENT_TIMESTAMP'
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
      'alter table "users" add column "foo" bytea'
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
      'alter table "user" add column "preferences" jsonb'
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
      'alter table "users" add column "foo" uuid'
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
      'alter table "users" add column "foo" uuid'
    );
  });

  it('set comment', function () {
    tableSql = client
      .schemaBuilder()
      .table('user', function (t) {
        t.comment('Custom comment');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'comment on table "user" is \'Custom comment\''
    );
  });

  it('set empty comment', function () {
    tableSql = client
      .schemaBuilder()
      .table('user', function (t) {
        t.comment('');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('comment on table "user" is \'\'');
  });

  it('test column comment with quotes', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('test', (t) => {
        t.text('column1').comment("The table's first column and it's escaped");
      })
      .toSQL();

    equal(tableSql.length, 2);
    expect(tableSql[1].sql).to.equal(
      "comment on column \"test\".\"column1\" is 'The table''s first column and it''s escaped'"
    );
  });

  it('test column comment with pre-escaped quotes', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('test', (t) => {
        t.text('column1').comment(
          "The table''s first column and it''s escaped"
        );
      })
      .toSQL();

    equal(tableSql.length, 2);
    expect(tableSql[1].sql).to.equal(
      "comment on column \"test\".\"column1\" is 'The table''s first column and it''s escaped'"
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

  it('allows adding default json objects when the column is json', function () {
    tableSql = client
      .schemaBuilder()
      .table('user', function (t) {
        t.json('preferences').defaultTo({}).notNullable();
      })
      .toSQL();
    expect(tableSql[0].sql).to.equal(
      'alter table "user" add column "preferences" json not null default \'{}\''
    );
  });

  it('allows adding default jsonb objects when the column is json', function () {
    tableSql = client
      .schemaBuilder()
      .table('user', function (t) {
        t.jsonb('preferences').defaultTo({}).notNullable();
      })
      .toSQL();
    expect(tableSql[0].sql).to.equal(
      'alter table "user" add column "preferences" jsonb not null default \'{}\''
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

  it('table inherits another table', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('inheriteeTable', function (t) {
        t.string('username');
        t.inherits('inheritedTable');
      })
      .toSQL();
    expect(tableSql[0].sql).to.equal(
      'create table "inheriteeTable" ("username" varchar(255)) inherits ("inheritedTable")'
    );
  });

  it('should warn on disallowed method', function () {
    expect(() => {
      tableSql = client
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
      .createTable('users', function (t) {
        t.string('test1');
        t.string('test2');
        t.primary(['test1', 'test2'], 'testconstraintname');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "users" ("test1" varchar(255), "test2" varchar(255), constraint "testconstraintname" primary key ("test1", "test2"))'
    );

    tableSql = client
      .schemaBuilder()
      .createTable('users', function (t) {
        t.string('test').primary('testconstraintname');
      })
      .toSQL();

    expect(tableSql[0].sql).to.equal(
      'create table "users" ("test" varchar(255), constraint "testconstraintname" primary key ("test"))'
    );
  });

  describe('alter with primary', function () {
    it('liquid argument', function () {
      tableSql = client
        .schemaBuilder()
        .alterTable('users', function (t) {
          t.string('test').primary();
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table "users" add column "test" varchar(255)'
      );
      expect(tableSql[1].sql).to.equal(
        'alter table "users" add constraint "users_pkey" primary key ("test")'
      );
    });
    it('liquid argument with name', function () {
      tableSql = client
        .schemaBuilder()
        .alterTable('users', function (t) {
          t.string('test').primary('testname');
        })
        .toSQL();

      equal(2, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table "users" add column "test" varchar(255)'
      );
      expect(tableSql[1].sql).to.equal(
        'alter table "users" add constraint "testname" primary key ("test")'
      );
    });
    it('call on table with columns and name', function () {
      tableSql = client
        .schemaBuilder()
        .alterTable('users', function (t) {
          t.primary(['test1', 'test2'], 'testconstraintname');
        })
        .toSQL();

      equal(1, tableSql.length);
      expect(tableSql[0].sql).to.equal(
        'alter table "users" add constraint "testconstraintname" primary key ("test1", "test2")'
      );
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

    it('TableCompiler calls wrapIdentifier when altering column', function () {
      client
        .schemaBuilder()
        .table('users', function (table) {
          table.queryContext('table context');
          table
            .string('email')
            .notNull()
            .alter()
            .queryContext('email alter context');
        })
        .toSQL();

      expect(spy.callCount).to.equal(3);
      expect(spy.thirdCall.args).to.deep.equal([
        'email',
        'email alter context',
      ]);
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

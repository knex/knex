'use strict';

const { expect } = require('chai');

const sinon = require('sinon');
const Oracle_Client = require('../../../lib/dialects/oracledb');
const knex = require('../../../knex');
const FunctionHelper = require('../../../lib/knex-builder/FunctionHelper');
const client = new Oracle_Client({ client: 'oracledb', version: '18.0' });

describe('OracleDb SchemaBuilder', function () {
  let tableSql;
  const equal = require('assert').equal;

  it('test basic create table with charset and collate', function () {
    tableSql = client.schemaBuilder().createTable('users', function (table) {
      table.increments('id');
      table.string('email');
    });

    equal(2, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal(
      'create table "users" ("id" integer not null primary key, "email" varchar2(255))'
    );
    expect(tableSql.toSQL()[1].sql).to.equal(
      'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "users_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'users\';  execute immediate (\'create or replace trigger "users_autoinc_trg"  BEFORE INSERT on "users"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "users_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "users"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;'
    );
  });

  it('test basic create table like', function () {
    tableSql = client.schemaBuilder().createTableLike('users_like', 'users');

    equal(1, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal(
      'create table "users_like" as (select * from "users" where 0=1)'
    );
  });

  it('test create table like with additionnal columns', function () {
    tableSql = client
      .schemaBuilder()
      .createTableLike('users_like', 'users', function (table) {
        table.text('add_col');
        table.integer('add_num_col');
      });

    expect(tableSql.toSQL().length).to.equal(2);
    expect(tableSql.toSQL()[0].sql).to.equal(
      'create table "users_like" as (select * from "users" where 0=1)'
    );
    expect(tableSql.toSQL()[1].sql).to.equal(
      'alter table "users_like" add ("add_col" clob, "add_num_col" integer)'
    );
  });

  describe('views', function () {
    let knexOracleDb;

    before(function () {
      knexOracleDb = knex({
        client: 'oracledb',
        version: '18.0',
        connection: {},
      });
    });

    it('basic create view', async function () {
      const viewSql = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexOracleDb('users').select('name').where('age', '>', '18'));
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
          view.as(knexOracleDb('users').select('name').where('age', '>', '18'));
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
          view.as(knexOracleDb('users').select('name').where('age', '>', '18'));
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
          view.as(knexOracleDb('users').select('name').where('age', '>', '18'));
        })
        .toSQL();
      expect(viewSql.length).to.equal(1);
      expect(viewSql[0].sql).to.equal(
        'create or replace view "adults" as select "name" from "users" where "age" > \'18\''
      );
    });

    it('create view with check options', async function () {
      tableSql = client
        .schemaBuilder()
        .createView('adults', function (view) {
          view.columns(['name']);
          view.as(knexOracleDb('users').select('name').where('age', '>', '18'));
          view.checkOption();
        })
        .toSQL();
      expect(tableSql.length).to.equal(1);
      expect(tableSql[0].sql).to.equal(
        'create view "adults" ("name") as select "name" from "users" where "age" > \'18\' with check option'
      );

      expect(() => {
        client
          .schemaBuilder()
          .createView('adults', function (view) {
            view.columns(['name']);
            view.as(
              knexOracleDb('users').select('name').where('age', '>', '18')
            );
            view.cascadedCheckOption();
          })
          .toSQL();
      }).to.throw('check option definition is not supported by this dialect.');
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
      expect(() => {
        tableSql = client
          .schemaBuilder()
          .renameView('old_view', 'new_view')
          .toSQL();
      }).to.throw(
        'rename view is not supported by this dialect (instead drop then create another view).'
      );
    });

    it('create materialized view', function () {
      tableSql = client
        .schemaBuilder()
        .createMaterializedView('mat_view', function (view) {
          view.columns(['name']);
          view.as(knexOracleDb('users').select('name').where('age', '>', '18'));
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
        "BEGIN DBMS_MVIEW.REFRESH('view_to_refresh'); END;"
      );
    });
  });

  it('test basic create table if not exists', function () {
    tableSql = client
      .schemaBuilder()
      .createTableIfNotExists('users', function (table) {
        table.increments('id');
        table.string('email');
      });

    equal(2, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal(
      'begin execute immediate \'create table "users" ("id" integer not null primary key, "email" varchar2(255))\'; exception when others then if sqlcode != -955 then raise; end if; end;'
    );
    expect(tableSql.toSQL()[1].sql).to.equal(
      'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "users_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'users\';  execute immediate (\'create or replace trigger "users_autoinc_trg"  BEFORE INSERT on "users"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "users_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "users"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;'
    );
  });

  it('test basic create table with incrementing without primary key', function () {
    tableSql = client
      .schemaBuilder()
      .createTableIfNotExists('users', function (table) {
        table.increments('id', { primaryKey: false });
      });

    equal(2, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal(
      'begin execute immediate \'create table "users" ("id" integer not null)\'; exception when others then if sqlcode != -955 then raise; end if; end;'
    );
  });

  it('test drop table', function () {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop table "users"');
    expect(tableSql[1].sql).to.equal(
      'begin execute immediate \'drop sequence "users_seq"\'; exception when others then if sqlcode != -2289 then raise; end if; end;'
    );
  });

  it('test drop table if exists', function () {
    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'begin execute immediate \'drop table "users"\'; exception when others then if sqlcode != -942 then raise; end if; end;'
    );
    expect(tableSql[1].sql).to.equal(
      'begin execute immediate \'drop sequence "users_seq"\'; exception when others then if sqlcode != -2289 then raise; end if; end;'
    );
  });

  it('test drop column', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dropColumn('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop ("foo")');
  });

  it('drops multiple columns with an array', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dropColumn(['foo', 'bar']);
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop ("foo", "bar")');
  });

  it('drops multiple columns as multiple arguments', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dropColumn('foo', 'bar');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" drop ("foo", "bar")');
  });

  it('test drop primary', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dropPrimary();
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "users_pkey"'
    );
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
      'alter table "users" drop constraint "users_foo_unique"'
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
    expect(tableSql[0].sql).to.equal(
      'alter table "users" drop constraint "foo"'
    );
  });

  it('test drop index', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dropIndex('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "users_foo_index"');
  });

  it('test drop index, custom', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dropIndex(null, 'foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('drop index "foo"');
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
      'alter table "users" drop constraint "users_foo_foreign"'
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
      'alter table "users" drop constraint "foo"'
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
      'alter table "users" drop ("created_at", "updated_at")'
    );
  });

  it('rename table', function () {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'DECLARE PK_NAME VARCHAR(200); IS_AUTOINC NUMBER := 0; BEGIN  EXECUTE IMMEDIATE (\'RENAME "users" TO "foo"\');  SELECT COUNT(*) INTO IS_AUTOINC from "USER_TRIGGERS" where trigger_name = \'users_autoinc_trg\';  IF (IS_AUTOINC > 0) THEN    EXECUTE IMMEDIATE (\'DROP TRIGGER "users_autoinc_trg"\');    EXECUTE IMMEDIATE (\'RENAME "users_seq" TO "foo_seq"\');    SELECT cols.column_name INTO PK_NAME    FROM all_constraints cons, all_cons_columns cols    WHERE cons.constraint_type = \'P\'    AND cons.constraint_name = cols.constraint_name    AND cons.owner = cols.owner    AND cols.table_name = \'foo\';    EXECUTE IMMEDIATE (\'create or replace trigger "foo_autoinc_trg"    BEFORE INSERT on "foo" for each row      declare      checking number := 1;      begin        if (:new."\' || PK_NAME || \'" is null) then          while checking >= 1 loop            select "foo_seq".nextval into :new."\' || PK_NAME || \'" from dual;            select count("\' || PK_NAME || \'") into checking from "foo"            where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";          end loop;        end if;      end;\');  end if;END;'
    );
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
      'alter table "users" add constraint "bar" primary key ("foo")'
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
      'alter table "users" add constraint "bar" unique ("foo")'
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
      'create index "baz" on "users" ("foo", "bar")'
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
      'alter table "users" add "foo_id" integer'
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
      'alter table "users" add "foo_id" integer'
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
    equal(2, tableSql.length);
    expect(tableSql[1].sql).to.equal(
      'alter table "person" add constraint "user_id_primary" primary key ("user_id") deferrable initially immediate'
    );
  });

  it('test adding incrementing id', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.increments('id');
      })
      .toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "id" integer not null primary key'
    );
    expect(tableSql[1].sql).to.equal(
      'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "users_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'users\';  execute immediate (\'create or replace trigger "users_autoinc_trg"  BEFORE INSERT on "users"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "users_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "users"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;'
    );
  });

  it('test adding big incrementing id', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.bigIncrements('id');
      })
      .toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "id" number(20, 0) not null primary key'
    );
    expect(tableSql[1].sql).to.equal(
      'DECLARE PK_NAME VARCHAR(200); BEGIN  EXECUTE IMMEDIATE (\'CREATE SEQUENCE "users_seq"\');  SELECT cols.column_name INTO PK_NAME  FROM all_constraints cons, all_cons_columns cols  WHERE cons.constraint_type = \'P\'  AND cons.constraint_name = cols.constraint_name  AND cons.owner = cols.owner  AND cols.table_name = \'users\';  execute immediate (\'create or replace trigger "users_autoinc_trg"  BEFORE INSERT on "users"  for each row  declare  checking number := 1;  begin    if (:new."\' || PK_NAME || \'" is null) then      while checking >= 1 loop        select "users_seq".nextval into :new."\' || PK_NAME || \'" from dual;        select count("\' || PK_NAME || \'") into checking from "users"        where "\' || PK_NAME || \'" = :new."\' || PK_NAME || \'";      end loop;    end if;  end;\'); END;'
    );
  });

  it('test adding big incrementing id without primary key', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.bigIncrements('id', { primaryKey: false });
      })
      .toSQL();

    equal(2, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "id" number(20, 0) not null'
    );
  });

  it('test rename column', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.renameColumn('foo', 'bar');
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'DECLARE PK_NAME VARCHAR(200); IS_AUTOINC NUMBER := 0; BEGIN  EXECUTE IMMEDIATE (\'ALTER TABLE "users" RENAME COLUMN "foo" TO "bar"\');  SELECT COUNT(*) INTO IS_AUTOINC from "USER_TRIGGERS" where trigger_name = \'users_autoinc_trg\';  IF (IS_AUTOINC > 0) THEN    SELECT cols.column_name INTO PK_NAME    FROM all_constraints cons, all_cons_columns cols    WHERE cons.constraint_type = \'P\'    AND cons.constraint_name = cols.constraint_name    AND cons.owner = cols.owner    AND cols.table_name = \'users\';    IF (\'bar\' = PK_NAME) THEN      EXECUTE IMMEDIATE (\'DROP TRIGGER "users_autoinc_trg"\');      EXECUTE IMMEDIATE (\'create or replace trigger "users_autoinc_trg"      BEFORE INSERT on "users" for each row        declare        checking number := 1;        begin          if (:new."bar" is null) then            while checking >= 1 loop              select "users_seq".nextval into :new."bar" from dual;              select count("bar") into checking from "users"              where "bar" = :new."bar";            end loop;          end if;        end;\');    end if;  end if;END;'
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
      'alter table "users" add "foo" varchar2(255)'
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
      'alter table "users" add "foo" varchar2(100)'
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
      'alter table "users" add "foo" varchar2(100) default \'bar\' not null'
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
      'alter table "users" add "foo" varchar2(100) default CURRENT TIMESTAMP null'
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
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" clob');
  });

  it('test adding big integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.bigInteger('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" number(20, 0)'
    );
  });

  it('test adding integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.integer('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" integer');
  });

  it('test adding medium integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.mediumint('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" integer');
  });

  it('test adding small integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.smallint('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" smallint');
  });

  it('test adding tiny integer', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.tinyint('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" smallint');
  });

  it('test adding default float', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.float('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" float');
  });

  it('test adding float with precision', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.float('foo', 5);
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" float(5)');
  });

  it('test adding double', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.double('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" number(8, 2)'
    );
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
      'alter table "users" add "foo" number(15, 8)'
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
      'alter table "users" add "foo" decimal(5, 2)'
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
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" decimal');
  });

  it('test adding boolean', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.boolean('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" number(1, 0) check ("foo" in (\'0\', \'1\'))'
    );
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
      'alter table "users" add "foo" varchar2(3) check ("foo" in (\'bar\', \'baz\'))'
    );
  });

  it('test adding date', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.date('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" date');
  });

  it('test adding date time', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dateTime('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" timestamp with local time zone'
    );
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dateTime('foo', { useTz: true });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" timestamp with local time zone'
    );
  });

  it('test adding date time without time zone', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dateTime('foo', true);
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" timestamp');
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.dateTime('foo', { useTz: false });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" timestamp');
  });

  it('test adding time', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.time('foo');
      })
      .toSQL();

    // oracle does not support time

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" timestamp with local time zone'
    );
  });

  it('test adding time stamp', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.timestamp('foo');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "users" add "foo" timestamp with local time zone'
    );
  });

  it('test adding time stamp without time zone', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function () {
        this.timestamp('foo', true);
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" timestamp');
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
      'alter table "users" add ("created_at" timestamp with local time zone, "updated_at" timestamp with local time zone)'
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
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" blob');
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
      'alter table "users" add "foo" decimal(2, 6)'
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
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" char(36)');
  });

  it('adding binary uuid', function () {
    tableSql = client
      .schemaBuilder()
      .table('users', function (table) {
        table.uuid('foo', { useBinaryUuid: true });
      })
      .toSQL();

    expect(tableSql.length).to.equal(1);
    expect(tableSql[0].sql).to.equal('alter table "users" add "foo" raw(16)');
  });

  it('should allow using .fn.uuid to create raw statements', function () {
    // Integration tests doesnt cover for oracle
    const helperFunctions = new FunctionHelper(client);

    expect(helperFunctions.uuid().toQuery()).to.equal('(random_uuid())');
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
      'comment on table "users" is \'Custom comment\''
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
    expect(tableSql[0].sql).to.equal('comment on table "users" is \'\'');
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
      'alter table "user" add "preferences" varchar2(4000) default \'{}\' not null check ("preferences" is json)'
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
      'alter table "user" add "preferences" varchar2(4000) default \'{}\' not null check ("preferences" is json)'
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
      'create table "default_raw_test" ("created_at" timestamp with local time zone default CURRENT_TIMESTAMP)'
    );
  });

  it('allows dropping a unique compound index with too long generated name', function () {
    tableSql = new Oracle_Client({ client: 'oracledb', version: '12.0' })
      .schemaBuilder()
      .table('composite_key_test', function (t) {
        t.dropUnique(['column_a', 'column_b']);
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "composite_key_test" drop constraint "zYmMt0VQwlLZ20XnrMicXZ0ufZk"'
    );
  });

  it('allows dropping a unique compound index with specified name', function () {
    tableSql = client
      .schemaBuilder()
      .table('composite_key_test', function (t) {
        t.dropUnique(['column_a', 'column_b'], 'ckt_unique');
      })
      .toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'alter table "composite_key_test" drop constraint "ckt_unique"'
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
      'alter table "users" add constraint "testconstraintname" primary key ("test1", "test2")'
    );
    tableSql = client
      .schemaBuilder()
      .createTable('users', function (t) {
        t.string('test').primary('testconstraintname');
      })
      .toSQL();
    expect(tableSql[1].sql).to.equal(
      'alter table "users" add constraint "testconstraintname" primary key ("test")'
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

  it('test converting a sql wrapped with catch to string, #4045', function () {
    tableSql = client.schemaBuilder().dropTableIfExists('book');

    expect(tableSql.toQuery()).to.equal(
      'begin execute immediate \'drop table "book"\'; exception when others then if sqlcode != -942 then raise; end if; end;\nbegin execute immediate \'drop sequence "book_seq"\'; exception when others then if sqlcode != -2289 then raise; end if; end;'
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
        'alter table "user" add "price" integer check ("price" > 0)'
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
        'alter table "user" add "price" integer check ("price" < 0)'
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
        'alter table "user" add "animal" varchar2(255) check ("animal" in (\'cat\', \'dog\'))'
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
        'alter table "user" add "animal" varchar2(255) check ("animal" not in (\'cat\',\'dog\'))'
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
        'alter table "user" add "price" integer check ("price" between 10 and 15)'
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
        'alter table "user" add "price" integer check ("price" between 10 and 15 or "price" between 20 and 25)'
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
        'alter table "user" add "price" integer check ("price" between \'banana\' and \'orange\')'
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
        'alter table "user" add "phone" varchar2(255) check (length("phone") = 8)'
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
        'alter table "user" add "phone" varchar2(255) check (REGEXP_LIKE("phone",\'[0-9]{8}\'))'
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

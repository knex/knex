/*global describe, expect, it*/

'use strict';

var Firebird_Client  = require('../../../lib/dialects/firebird');
var client = new Firebird_Client();

describe("Firebird SchemaBuilder", function() {

  var tableSql;
  var equal = require('assert').equal;

  it('test basic create table with charset and collate', function() {
    tableSql = client.schemaBuilder().createTable('users', function(table) {
      table.increments('id');
      table.string('email');
    });

    equal(1, tableSql.toSQL().length);
    expect(tableSql.toSQL()[0].sql).to.equal('create table users (id int not null primary key, email varchar(255)  CHARACTER SET UTF8)');
    expect(tableSql.toQuery()).to.equal('create table users (id int not null primary key, email varchar(255)  CHARACTER SET UTF8)');
  });

  it('basic create table without charset or collate', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.increments('id');
      this.string('email');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users add id int not null primary key, add email varchar(255)  CHARACTER SET UTF8');
  });

  it('test drop table', function() {
    tableSql = client.schemaBuilder().dropTable('users').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('DROP TABLE users');
  });

//  it('test drop table if exists', function() {
//    tableSql = client.schemaBuilder().dropTableIfExists('users').toSQL();
//
//    equal(1, tableSql.length);
//    var dropIsSql = 'execute block ' +
//                    'as ' +
//                    'begin ' +
//                    '    if (exists(select 1 from RDB$RELATION_FIELDS where RDB$SYSTEM_FLAG=0 AND RDB$RELATION_NAME = UPPER(\'user\'))) then ' +
//                    '        execute statement \'drop table user\' ' +
//                    '        WITH AUTONOMOUS TRANSACTION; ' + 
//                    'end; ';
//            
//    expect(tableSql[0].sql).to.equal(dropIsSql);
//  });

  it('test drop column', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop foo');
  });

  it('drops multiple columns with an array', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn(['foo', 'bar']);
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop foo, drop bar');
  });

  it('drops multiple columns as multiple arguments', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropColumn('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop foo, drop bar');
  });

  it('test drop primary', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropPrimary();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop primary key');
  });

  it('test drop unique', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropUnique('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop index users_foo_unique');
  });

  it('test drop unique, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropUnique(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop index foo');
  });

  it('test drop index', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropIndex('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop index users_foo_index');
  });

  it('test drop index, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropIndex(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop index foo');
  });

  it('test drop foreign', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropForeign('foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop foreign key users_foo_foreign');
  });

  it('test drop foreign, custom', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropForeign(null, 'foo');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop foreign key foo');
  });

  it('test drop timestamps', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.dropTimestamps();
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users drop created_at, drop updated_at');
  });

  it('test rename table', function() {
    tableSql = client.schemaBuilder().renameTable('users', 'foo').toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('rename table users to foo');
    //expect(tableSql[0].bindings[0]).to.equal('users');
    //expect(tableSql[0].bindings[1]).to.equal('foo');
  });

  it('test adding primary key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.primary('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users add primary key bar(foo)');
  });

  it('test adding unique key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.unique('foo', 'bar');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users add unique bar(foo)');
  });

  it('test adding index', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.index(['foo', 'bar'], 'baz');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users add index baz(foo, bar)');
  });

  it('test adding foreign key', function() {
    tableSql = client.schemaBuilder().table('users', function() {
      this.foreign('foo_id').references('id').on('orders');
    }).toSQL();

    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal('alter table users add constraint users_foo_id_foreign foreign key (foo_id) references orders (id)');
  });

//  it("adds foreign key with onUpdate and onDelete", function() {
//    tableSql = client.schemaBuilder().createTable('person', function(table) {
//      table.integer('user_id').notNull().references('users.id').onDelete('SET NULL');
//      table.integer('account_id').notNull().references('id').inTable('accounts').onUpdate('cascade');
//    }).toSQL();
//    equal(1, tableSql.length);
//    expect(tableSql[0].sql).to.equal('create table person (user_id int not null, account_id int not null)');
//  });
  
});
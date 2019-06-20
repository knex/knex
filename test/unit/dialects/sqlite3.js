// global it, describe, expect

'use strict';
const sinon = require('sinon');
const DDL = require('../../../src/dialects/sqlite3/schema/ddl');

it('[backwards compatible] can rename column with double quotes', function() {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about" varchar(24))';

  const newSql = ddl._doReplace(sql, '`about`', '`about_me`');
  newSql.should.eql(
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about_me" varchar(24))'
  );
});

it('[backwards compatible] can rename column with double quotes', function() {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about" varchar(24))';

  const newSql = ddl._doReplace(sql, '"about"', '"about_me"');
  newSql.should.eql(
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about_me" varchar(24))'
  );
});

it('[backwards compatible] can rename column with double quotes', function() {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about" varchar(24))';

  const newSql = ddl._doReplace(sql, '"about"', '`about_me`');
  newSql.should.eql(
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about_me" varchar(24))'
  );
});

it('can rename column with back sticks', function() {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE `accounts` (`id` varchar(24) not null primary key, `about` varchar(24))';

  const newSql = ddl._doReplace(sql, '`about`', '`about_me`');
  newSql.should.eql(
    'CREATE TABLE `accounts` (`id` varchar(24) not null primary key, `about_me` varchar(24))'
  );
});

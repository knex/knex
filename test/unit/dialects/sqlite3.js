'use strict';

const { expect } = require('chai');

const sinon = require('sinon');
const DDL = require('../../../lib/dialects/sqlite3/schema/ddl');

it('[backwards compatible] can rename column with double quotes', function () {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about" varchar(24))';

  const newSql = ddl._doReplace(sql, '`about`', '`about_me`');
  expect(newSql).to.eql(
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, `about_me` varchar(24))'
  );
});

it('[backwards compatible] can rename column with double quotes', function () {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about" varchar(24))';

  const newSql = ddl._doReplace(sql, '"about"', '"about_me"');
  expect(newSql).to.eql(
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about_me" varchar(24))'
  );
});

it('[backwards compatible] can rename column with double quotes', function () {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, "about" varchar(24))';

  const newSql = ddl._doReplace(sql, '"about"', '`about_me`');
  expect(newSql).to.eql(
    'CREATE TABLE "accounts" ("id" varchar(24) not null primary key, `about_me` varchar(24))'
  );
});

it('can rename column with back sticks', function () {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE `accounts` (`id` varchar(24) not null primary key, `about` varchar(24))';

  const newSql = ddl._doReplace(sql, '`about`', '`about_me`');
  expect(newSql).to.eql(
    'CREATE TABLE `accounts` (`id` varchar(24) not null primary key, `about_me` varchar(24))'
  );
});

it('can rename column with multiline and tabulated sql statement', function () {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE `accounts` (\n\n`id`\tvarchar(24) not null primary key,\r\n`about`\t \t\t \tvarchar(24)\n\n)';

  const newSql = ddl._doReplace(sql, '`about`', '`about_me`');
  expect(newSql).to.eql(
    'CREATE TABLE `accounts` (`id` varchar(24) not null primary key, `about_me` varchar(24))'
  );
});

it('can drop column with multiline and tabulated sql statement', function () {
  const client = sinon.stub();
  const tableCompiler = sinon.stub();
  const pragma = sinon.stub();
  const connection = sinon.stub();
  const ddl = new DDL(client, tableCompiler, pragma, connection);

  const sql =
    'CREATE TABLE `accounts` (\n\n`id`\tvarchar(24) not null primary key,\r\n`about`\t \tvarchar(24)\n)';

  const newSql = ddl._doReplace(sql, '`about`', '');
  expect(newSql).to.eql(
    'CREATE TABLE `accounts` (`id` varchar(24) not null primary key)'
  );
});

const { expect } = require('chai');

let tableSql;

const sinon = require('sinon');
const PG_Client = require('../../../lib/dialects/postgres');
const client = new PG_Client({ client: 'pg' });
const knex = require('../../../knex');

const equal = require('chai').assert.equal;

describe('CockroachDB SchemaBuilder', function () {
  it('create table with uuid primary key in one go', function () {
    tableSql = client
      .schemaBuilder()
      .createTable('uuid_primary', function (table) {
        table.uuid('id', { primaryKey: true });
      })
      .toSQL();
    equal(1, tableSql.length);
    expect(tableSql[0].sql).to.equal(
      'create table "uuid_primary" ("id" uuid primary key default gen_random_uuid())'
    );
  });
});

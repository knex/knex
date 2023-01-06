'use strict';

const expect = require('chai').expect;
const MySQL_Client = require('../../../lib/dialects/mysql');
const knex = require('../../../knex');
describe('SchemaBuilder Extensions', () => {
  const client = new MySQL_Client({ client: 'mysql' });

  const equal = require('assert').equal;
  const functionToExtend = () => true;
  knex.SchemaBuilder.extend('tryCreateTable', functionToExtend);
  knex.TableBuilder.extend('testCol', functionToExtend);
  knex.ColumnBuilder.extend('testCol', functionToExtend);
  knex.ViewBuilder.extend('testCol', functionToExtend);

  it('schemabuilder has method', () => {
    equal(client.schemaBuilder().tryCreateTable, functionToExtend);
    expect(client.schemaBuilder().tryCreateTable()).to.be.true;
  });

  it('tablebuilder has method', () => {
    client
      .schemaBuilder()
      .createTable('users', function (table) {
        equal(table.testCol, functionToExtend);
      })
      .toSQL();
  });

  it('columnbuilder has method', () => {
    client
      .schemaBuilder()
      .createTable('users', function (table) {
        equal(table.string('t').testCol, functionToExtend);
      })
      .toSQL();
  });

  it('viewbuilder has method', () => {
    client
      .schemaBuilder()
      .createView('users', function (view) {
        equal(view.testCol, functionToExtend);
        view.as(
          knex('users')
            .join('user_roles', 'users.user_id', 'user_roles.user_id')
            .select('users.*', 'user_roles.role_code')
        );
      })
      .toSQL();
  });

  it('querybuilder has method', () => {
    knex.QueryBuilder.extend('testQueryBuilderExt', () => true);
    expect(client.queryBuilder().testQueryBuilderExt()).to.be.true;
  });

  it('should throw when querybuilder method exists', () => {
    expect(() => knex.QueryBuilder.extend('upsert', () => true)).to.throw();
  });

  it('should not throw when querybuilder method exists and force option is given', () => {
    knex.QueryBuilder.extend('upsert', () => true, { force: true });
    expect(client.queryBuilder().upsert()).to.be.true;
  });
});

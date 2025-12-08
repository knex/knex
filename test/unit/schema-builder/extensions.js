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
});

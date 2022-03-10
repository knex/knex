'use strict';

const expect = require('chai').expect;
const MySQL_Client = require('../../../lib/dialects/mysql');
const knex = require('../../../knex');
describe('SchemaBuilder Extensions', () => {
  let client = new MySQL_Client({ client: 'mysql' });

  const equal = require('assert').equal;

  it('has method', () => {
    const functionToExtend = () => true;
    knex.SchemaBuilder.extend('tryCreateTable', functionToExtend);
    equal(client.schemaBuilder().tryCreateTable, functionToExtend);
    expect(client.schemaBuilder().tryCreateTable()).to.be.true;
  });
});

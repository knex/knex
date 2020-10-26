const { expect } = require('chai');
const Knex = require('../../../lib/index');
const sqliteConfig = require('../../knexfile').sqlite3;

describe('schemaBuilder', () => {
  it('correctly converts empty value with toQuery', async () => {
    const knex = Knex({
      ...sqliteConfig,
      connection: ':memory:',
    });

    let builder = knex.schema;
    const convertedValue = builder.toQuery();
    expect(convertedValue).to.eql('');
  });
});

const { expect } = require('chai');
const Knex = require('../../../../lib');
const sqliteConfig = require('../../../knexfile').sqlite3;

describe('schemaBuilder', () => {
  let knex;
  beforeEach(() => {
    knex = Knex({
      ...sqliteConfig,
      connection: ':memory:',
    });
  });

  afterEach(() => {
    return knex.destroy();
  });

  it('correctly converts empty value with toQuery', async () => {
    const builder = knex.schema;
    const convertedValue = builder.toQuery();
    expect(convertedValue).to.eql('');
  });

  it('correctly converts non-empty value with toQuery', async () => {
    const builder = knex.schema.dropTableIfExists('dummy_table');
    const convertedValue = builder.toQuery();
    expect(convertedValue).to.eql('drop table if exists `dummy_table`');
  });
});

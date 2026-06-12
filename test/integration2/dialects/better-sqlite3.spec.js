const { expect } = require('chai');
require('../../util/chai-setup');
const { getKnexForBetterSqlite } = require('../util/knex-instance-provider');

describe('better-sqlite3 safeIntegers', () => {
  // eslint-disable-next-line no-undef
  const BIGINT = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
  const NUMBER = Number(BIGINT);

  const tests = [
    {
      name: 'factory: true, query: true -> expected: BIGINT',
      factory: true,
      query: true,
      expected: BIGINT,
    },
    {
      name: 'factory: true, query: undefined -> expected: BIGINT',
      factory: true,
      query: undefined,
      expected: BIGINT,
    },
    {
      name: 'factory: false, query: true -> expected: BIGINT',
      factory: false,
      query: true,
      expected: BIGINT,
    },
    {
      name: 'factory: undefined, query: true -> expected: BIGINT',
      factory: undefined,
      query: true,
      expected: BIGINT,
    },
    {
      name: 'factory: true, query: false -> expected: NUMBER',
      factory: true,
      query: false,
      expected: NUMBER,
    },
    {
      name: 'factory: false, query: false -> expected: NUMBER',
      factory: false,
      query: false,
      expected: NUMBER,
    },
    {
      name: 'factory: false, query: undefined -> expected: NUMBER',
      factory: false,
      query: undefined,
      expected: NUMBER,
    },
    {
      name: 'factory: undefined, query: false -> expected: NUMBER',
      factory: undefined,
      query: false,
      expected: NUMBER,
    },
    {
      name: 'factory: undefined, query: undefined -> expected: NUMBER',
      factory: undefined,
      query: undefined,
      expected: NUMBER,
    },
  ];

  for (const test of tests) {
    it(test.name, async () => {
      const knexConfig = {
        connection: {
          filename: ':memory:',
        },
      };

      if (test.factory !== undefined) {
        knexConfig.connection.options = { safeIntegers: test.factory };
      }

      const knex = getKnexForBetterSqlite(false, knexConfig);

      try {
        await knex.schema.createTable('test_table', (table) => {
          table.bigInteger('id').primary();
          table.bigInteger('value');
        });

        await knex('test_table').insert({ id: 1n, value: BIGINT });

        let queryBuilder = knex('test_table').select('*');

        if (test.query !== undefined) {
          queryBuilder = queryBuilder.options({ safeIntegers: test.query });
        }

        const result = await queryBuilder.first();

        expect(typeof result.value).to.equal(typeof test.expected);
        expect(result.value).to.equal(test.expected);
      } finally {
        await knex.destroy();
      }
    });
  }
});

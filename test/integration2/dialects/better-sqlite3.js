/** @typedef {import('../../../types/index').knex} KnexFactory */
/** @typedef {import('../../../types/index').Knex} KnexInstance */
/** @typedef {import('../../../types/index').Knex.Config} KnexConfig */

const { expect } = require('chai');
const makeKnex = require('../../../lib');

describe('better-sqlite3 dialect', () => {
  describe('safeIntegers', async () => {
    const toobig = 2n ** 54n + 1n;
    const overflowed = Number(toobig);

    // ensure our constants _do_ demonstrate overflow, so the tests can
    // be expected to do the right thing
    expect(BigInt(overflowed)).not.to.eql(toobig);

    const tests = [
      { safeIntegers: true, expected: toobig },
      { safeIntegers: false, expected: overflowed },
      { safeIntegers: undefined, expected: overflowed },
    ];

    for (const { safeIntegers, expected } of tests) {
      describe(`knex instance: options.safeIntegers=${safeIntegers}`, () => {
        /** @type {KnexInstance} */
        let knex;

        before(async () => {
          knex = makeKnex({
            client: 'better-sqlite3',
            connection: {
              filename: ':memory:',
              options: { safeIntegers },
            },
            useNullAsDefault: true,
          });
        });

        after(async () => {
          await knex.destroy();
          knex = undefined;
        });

        it(`query returns numbers as ${typeof expected} by default`, async () => {
          const res = await knex.raw(`SELECT ${String(toobig)} as num`);
          expect(res[0].num).to.eql(expected);
        });

        for (const { safeIntegers, expected } of tests) {
          if (safeIntegers === undefined) continue;

          it(`query.options({ safeIntegers: ${safeIntegers} }) returns numbers as ${typeof expected}`, async () => {
            const res = await knex
              .raw(`SELECT ${String(toobig)} as num`)
              .options({ safeIntegers });
            expect(res[0].num).to.eql(expected);
          });
        }
      });
    }
  });
});

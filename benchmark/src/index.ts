import type { knex as KnexFactory } from '../../types/index.js';
import _Knex from '../../knex.js';
const Knex = _Knex as unknown as typeof KnexFactory;

import {
  type k_state,
  bench,
  boxplot,
  do_not_optimize,
  lineplot,
  run,
  summary,
} from 'mitata';

import assert from 'node:assert';

const knex = Knex({
  client: 'better-sqlite3',
  connection: {
    filename: ':memory:',
  },
  useNullAsDefault: true,
});

const rnd = (): bigint =>
  BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));

const mockRows = {
  mixed: () => ({ a: rnd(), b: 'foo', c: rnd(), d: rnd(), e: 'bar' }),
};

const tableData = new Array(2000).fill(0).map(mockRows.mixed);

await (async () => {
  await knex.schema.createTable('bench', (tb) => {
    tb.bigInteger('a');
    tb.string('b');
    tb.bigInteger('c');
    tb.bigInteger('d');
    tb.string('e');
  });
})();

await (async () => {
  for (let i = 0; i < 2000; i += 200) {
    const data = tableData.slice(i, i + 200);

    await knex('bench').insert(data);
  }
})();

const selectOptIn = (numRows: number) =>
  knex('bench')
    .options({ safeIntegers: true })
    .select('a', 'b', 'c', 'd', 'e')
    .limit(numRows);
const selectOptOut = (numRows: number) =>
  knex('bench')
    .options({ safeIntegers: false })
    .select('a', 'b', 'c', 'd', 'e')
    .limit(numRows);
const selectUnspecified = (numRows: number) =>
  knex('bench').select('a', 'b', 'c', 'd', 'e').from('bench').limit(numRows);
const selectCast = (numRows: number) =>
  knex('bench')
    .select('a', 'b', 'c', 'd', 'e')
    // welp, will have to make sure it actually runs!
    .cast({ a: 'bigint', c: 'number' })
    .limit(numRows);

// spot check that the data and queries seem sane
await (async () => {
  const optin = await selectOptIn(1).first();
  assert.deepStrictEqual(optin, {
    a: BigInt(optin.a),
    b: optin.b,
    c: BigInt(optin.c),
    d: BigInt(optin.d),
    e: optin.e,
  });
  const optout = await selectOptOut(1).first();
  assert.deepStrictEqual(optout, {
    a: Number(optin.a),
    b: optin.b,
    c: Number(optin.c),
    d: Number(optin.d),
    e: optin.e,
  });
  const unspecified = await selectUnspecified(1).first();
  assert.deepStrictEqual(unspecified, {
    a: Number(optin.a),
    b: optin.b,
    c: Number(optin.c),
    d: Number(optin.d),
    e: optin.e,
  });
  const casted = await selectCast(1).first();
  assert.deepStrictEqual(casted, {
    a: BigInt(optin.a),
    b: optin.b,
    c: Number(optin.c),
    d: BigInt(optin.d),
    e: optin.e,
  });
})();

boxplot(() => {
  summary(() => {
    lineplot(() => {
      bench('knex safeIntegers: true', function* (state: k_state) {
        yield async () => {
          return do_not_optimize(await selectOptIn(state.get('limit')));
        };
      }).args({
        limit: [20, 220, 420, 620, 820, 1020],
      });

      bench('knex safeIntegers: false', function* (state: k_state) {
        yield async () => {
          return do_not_optimize(await selectOptIn(state.get('limit')));
        };
      }).args({
        limit: [20, 220, 420, 620, 820, 1020],
      });

      bench('knex safeIntegers: undefined', function* (state: k_state) {
        yield async () => {
          return do_not_optimize(await selectOptIn(state.get('limit')));
        };
      }).args({
        limit: [20, 220, 420, 620, 820, 1020],
      });
    });
  });
});

await run();
await knex.destroy();

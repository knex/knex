'use strict';

const knexfile = require('../knexfile');
const makeKnex = require('../../knex');
const test = require('tape');
const _ = require('lodash');

const originalConfig = knexfile['sqlite3'];
const originalConnection = _.cloneDeep(originalConfig.connection);

test('static config works without a provider', async function(t) {
  await runTwoConcurrentTransactions(originalConnection);
  t.pass('static config used successfully');
  t.end();
});

test('by default, the same async-resolved config is used for all connections', async function(t) {
  let providerCallCount = 0;
  const connectionConfig = () => {
    ++providerCallCount;
    return Promise.resolve(originalConnection);
  };
  await runTwoConcurrentTransactions(connectionConfig);
  t.equal(providerCallCount, 1);
  t.end();
});

test('by default, the same sync-resolved config is used for all connections', async function(t) {
  let providerCallCount = 0;
  const connectionConfig = () => {
    ++providerCallCount;
    return originalConnection;
  };
  await runTwoConcurrentTransactions(connectionConfig);
  t.equal(providerCallCount, 1);
  t.end();
});

test('when not yet expired, a resolved config is reused', async function(t) {
  let providerCallCount = 0;
  const connectionConfig = () => {
    ++providerCallCount;
    return Promise.resolve(
      Object.assign(_.cloneDeep(originalConnection), {
        expirationChecker: () => false,
      })
    );
  };
  await runTwoConcurrentTransactions(connectionConfig);
  t.equal(providerCallCount, 1);
  t.end();
});

test('when expired, a resolved config is replaced', async function(t) {
  let providerCallCount = 0;
  const connectionConfig = () => {
    ++providerCallCount;
    return Promise.resolve(
      Object.assign(_.cloneDeep(originalConnection), {
        expirationChecker: () => true,
      })
    );
  };
  await runTwoConcurrentTransactions(connectionConfig);
  t.equal(providerCallCount, 2);
  t.end();
});

async function runTwoConcurrentTransactions(connectionConfig) {
  const config = _.cloneDeep(originalConfig);
  config.connection = connectionConfig;
  config.pool.max = 2;
  const knex = makeKnex(config);
  await knex.transaction(async (trx) => {
    await trx.select(1);
    await knex.transaction(async (trx2) => {
      await trx2.select(2);
    });
  });
  await knex.destroy();
}

const {
  getAllDbs,
  getKnexForDb,
} = require('./integration2/util/knex-instance-provider');
const { isCockroachDB } = require('./util/db-helpers');
const { expect } = require('chai');

async function prepCRDB(knex) {
  const dbname = 'test';
  const configured = knex.client.connectionSettings.database;
  expect(configured).eq(dbname);
  if (configured === dbname) {
    await knex.raw(`DROP DATABASE IF EXISTS "${dbname}"`);
    await knex.raw(`CREATE DATABASE "${dbname}"`);
  }
}

// Out of the box, the CockroachDB docker container does not have the database that all
// the integration tests use. The code doesn't create it, so all the crdb tests fail.
// I've extracted this logic to a separate file so that it puts the requirements in
// place for both the "integration" and the "integration2" workflows
before(async () => {
  for (const db of getAllDbs()) {
    const knex = getKnexForDb(db);

    if (isCockroachDB(knex)) await prepCRDB(knex);
  }
});

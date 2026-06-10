const {
  getAllDbs,
  getKnexForDb,
} = require('./integration2/util/knex-instance-provider');
const { prepDB } = require('./prep-db');

// install as a global root hook
before(async () => {
  for (const db of getAllDbs()) {
    const knex = getKnexForDb(db);
    await prepDB(knex);
  }
});

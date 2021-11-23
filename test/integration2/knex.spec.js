const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('./util/knex-instance-provider');

describe('knex', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      before(() => {
        knex = getKnexForDb(db);
      });

      after(() => {
        return knex.destroy();
      });

      describe('destroy', () => {
        it('works correctly when called multiple times', async () => {
          await knex.destroy();
          await knex.destroy();
        });
      });

      if (db === 'postgres') {
        describe('initialize', () => {
          it('actually uses provided new config', async () => {
            const q1 = await knex.raw('select "current_user"();');
            expect(q1.rows[0][0]).to.equal('postgres');

            // create new role
            const user = 'user2';
            const password = 'user2';

            await createRoleIfNotExists(knex, { user, password });

            // prepare new config based off the current one
            const oldConfig = knex.client.config;
            const newConfig = {
              ...oldConfig,
              connection: {
                ...oldConfig.connection,
                user,
                password,
              },
            };

            // switch role
            await knex.destroy();
            knex.initialize(newConfig);

            const q2 = await knex.raw('select "current_user"();');
            expect(q2.rows[0][0]).to.equal('user2');

            // cleanup
            await knex.destroy();
            await knex.initialize(oldConfig);
            await dropRole(knex, { user });
          });
        });
      }
    });
  });
});

async function createRoleIfNotExists(knex, { user, password }) {
  try {
    return await knex.raw(
      `CREATE ROLE ${user} WITH LOGIN PASSWORD '${password}';`
    );
  } catch (error) {
    if (error.code !== '42710') {
      // role already exists
      throw error;
    }
  }
}

async function dropRole(knex, { user }) {
  return await knex.raw(`DROP ROLE ${user}`);
}

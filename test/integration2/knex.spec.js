const { expect } = require('chai');
const { getAllDbs, getKnexForDb } = require('./util/knex-instance-provider');
const { isPostgreSQL, isMysql, isMssql } = require('../util/db-helpers');

describe('knex', () => {
  getAllDbs().forEach((db) => {
    describe(db, () => {
      let knex;
      beforeEach(() => {
        knex = getKnexForDb(db);
      });

      afterEach(() => {
        return knex.destroy();
      });

      describe('destroy', () => {
        it('works correctly when called multiple times', async () => {
          await knex.destroy();
          await knex.destroy();
        });
      });

      describe('initialize', function () {
        beforeEach(async function () {
          if (!isPostgreSQL(knex)) {
            this.skip();
          }
          await dropRole(knex, 'user2');
        });

        it('actually uses provided new config', async function () {
          let currentUserQuery = '';

          // at this time only work on Postgres because of access denied in
          // all other databases when creating roles.
          // TODO : fix this for all other database.
          if (!isPostgreSQL(knex)) {
            this.skip();
          }
          if (isMysql(knex)) {
            currentUserQuery = 'select CURRENT_USER();';
          } else if (isMssql(knex)) {
            currentUserQuery = 'select SYSTEM_USER';
          } else {
            currentUserQuery = 'select "current_user"();';
          }

          const q1 = await knex.raw(currentUserQuery);

          let userName;

          if (isMysql(knex)) {
            userName = q1[0][0]['CURRENT_USER()'].slice(0, -2);
          } else if (isMssql(knex)) {
            userName = Object.values(q1[0])[0];
          } else {
            userName = q1.rows[0].current_user;
          }

          expect(userName).to.equal(knex.client.config.connection.user);
          // create new role
          const user = 'user2';
          const password = 'user2';

          await createRoleIfNotExists(knex, user, password);

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

          const q2 = await knex.raw(currentUserQuery);
          expect(q2.rows[0].current_user).to.equal('user2');

          // cleanup
          await knex.destroy();
          await knex.initialize(oldConfig);
        });
      });
    });
  });
});

async function createRoleIfNotExists(knex, user, password) {
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

async function dropRole(knex, user) {
  return await knex.raw(`DROP ROLE IF EXISTS ${user}`);
}

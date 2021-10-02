const { TEST_TIMESTAMP } = require('../util/constants');

async function insertAccount(knex, overrides) {
  return await knex('accounts').insert(
    {
      ...{
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: TEST_TIMESTAMP,
        updated_at: TEST_TIMESTAMP,
      },
      ...overrides,
    },
    'id'
  );
}

module.exports = {
  insertAccount,
};

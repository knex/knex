const { TEST_TIMESTAMP } = require('../util/constants');

function insertTestTableTwoData(knex) {
  return knex('test_table_two').insert(
    [
      {
        account_id: 1,
        details:
          'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 0,
      },
      {
        account_id: 2,
        details:
          'Lorem ipsum Minim nostrud Excepteur consectetur enim ut qui sint in veniam in nulla anim do cillum sunt voluptate Duis non incididunt.',
        status: 1,
      },
      {
        account_id: 3,
        details: '',
        status: 1,
      },
    ],
    'id'
  );
}

async function insertAccounts(knex) {
  await knex('accounts').insert(
    {
      first_name: 'Test',
      last_name: 'User',
      email: 'test1@example.com',
      logins: 1,
      about: 'Lorem ipsum Dolore labore incididunt enim.',
      created_at: TEST_TIMESTAMP,
      updated_at: TEST_TIMESTAMP,
    },
    'id'
  );

  await knex('accounts').insert(
    [
      {
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: TEST_TIMESTAMP,
        updated_at: TEST_TIMESTAMP,
      },
      {
        first_name: 'Test',
        last_name: 'User',
        email: 'test3@example.com',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: TEST_TIMESTAMP,
        updated_at: TEST_TIMESTAMP,
      },
    ],
    'id'
  );

  await knex('accounts').insert(
    [
      {
        first_name: 'Test',
        last_name: 'User',
        email: 'test4@example.com',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: TEST_TIMESTAMP,
        updated_at: TEST_TIMESTAMP,
      },
      {
        first_name: 'Test',
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        logins: 2,
        created_at: TEST_TIMESTAMP,
        updated_at: TEST_TIMESTAMP,
        last_name: 'User',
        email: 'test5@example.com',
      },
    ],
    'id'
  );

  await knex('accounts').insert(
    {
      first_name: 'Test',
      last_name: 'User',
      email: 'test6@example.com',
      about: 'Lorem ipsum Dolore labore incididunt enim.',
      logins: 2,
      created_at: TEST_TIMESTAMP,
      updated_at: TEST_TIMESTAMP,
    },
    'id'
  );
}

function insertAccount(knex, overrides) {
  return knex('accounts').insert(
    {
      ...{
        first_name: 'Test',
        last_name: 'User',
        email: 'test1@example.com',
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
  insertAccounts,
  insertTestTableTwoData,
};

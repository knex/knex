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

  await knex('accounts').insert(
    {
      first_name: 'Test2',
      last_name: 'User2',
      email: 'test7@example.com',
      about: 'Lorem ipsum Dolore labore incididunt enim.',
      logins: 2,
      created_at: TEST_TIMESTAMP,
      updated_at: TEST_TIMESTAMP,
    },
    'id'
  );

  await knex('accounts').insert(
    {
      first_name: 'Test2',
      last_name: 'User2',
      email: 'test8@example.com',
      about: 'Lorem ipsum Dolore labore incididunt enim.',
      logins: 3,
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

async function insertCities(knex) {
  await knex('cities').insert({
    name: 'Paris',
    population: {
      current: {
        value: 10000000,
      },
      minMax: {
        min: 50000,
        max: 12000000,
      },
    },
    descriptions: {
      type: 'bigcity',
      short: 'beautiful city',
      long: 'beautiful and dirty city',
    },
    statistics: {
      size: 1000000,
      buildings: 1232121,
      roads: {
        min: 1234,
        max: 1333,
      },
      statisticId: '6qITEHRUNJ4bdAmA0lk82',
    },
    temperature: {
      desc: 'cold',
    },
  });
  await knex('cities').insert({
    name: 'Milan',
    population: {
      current: {
        value: 1500000,
      },
      minMax: {
        min: 44000,
        max: 1200000,
      },
    },
    descriptions: {
      type: 'bigcity',
      short: 'large city',
      long: 'large and sunny city',
    },
    statistics: {
      size: 1200000,
      buildings: 12121,
      roads: {
        min: 1455,
        max: 1655,
      },
      hotYears: [2012, 2015, 2021],
      statisticId: '-4mZkPL-ZzRyEed00RQTQ',
    },
    temperature: {
      desc: 'warm',
    },
  });
  await knex('cities').insert({
    name: 'Oslo',
    population: {
      current: {
        value: 1456478,
      },
      minMax: {
        min: 44000,
        max: 1450000,
      },
    },
    descriptions: {
      type: 'city',
      short: 'cold city',
      long: 'cold and cool city',
    },
    statistics: {
      size: 4500000,
      buildings: 44454,
      roads: {
        min: 140,
        max: 156,
      },
      hotYears: [2016],
      statisticId: '6bBGzpyL3sTRrxWs5gXTa',
    },
    temperature: {
      desc: 'verycold',
      desc2: 'very cold',
    },
  });
}

async function insertCountry(knex) {
  await knex('country').insert({
    name: 'France',
    climate: {
      type: 'cold',
    },
  });
  await knex('country').insert({
    name: 'Italy',
    climate: {
      type: 'warm',
    },
  });
}

module.exports = {
  insertAccount,
  insertAccounts,
  insertTestTableTwoData,
  insertCities,
  insertCountry,
};

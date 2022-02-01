const { isMysql, isOracle } = require('../util/db-helpers');

function createDefaultTable(knex, isSecond = false) {
  return knex.schema.createTable(
    isSecond ? 'test_default_table2' : 'test_default_table',
    (qb) => {
      qb.increments().primary();
      qb.string('string').defaultTo('hello');
      qb.tinyint('tinyint').defaultTo(0);
      qb.text('text').nullable();
    }
  );
}

async function createTestTableTwo(knex, withJsonData = false) {
  await knex.schema.createTable('test_table_two', (table) => {
    if (isMysql(knex)) {
      table.engine('InnoDB');
    }
    table.increments();
    table.integer('account_id');
    if (isOracle(knex)) {
      // use string instead to force varchar2 to avoid later problems with join and union
      // e.g. where email (varchar2) = details (clob) does not work
      table.string('details', 4000);
    } else {
      table.text('details');
    }
    if (withJsonData) {
      table.json('json_data', true);
    }
    table.tinyint('status');
  });
}

async function createUsers(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('key');
    table.increments('id');
    table.string('email');
  });
}

function createDataType(knex) {
  return knex.schema.createTable('datatype_test', (table) => {
    table.enum('enum_value', ['a', 'b', 'c']);
    table.uuid('uuid').notNull();
  });
}

async function createAccounts(
  knex,
  withAccountId = false,
  indexFirstName = true
) {
  await knex.schema.createTable('accounts', (table) => {
    table.bigIncrements('id');

    if (withAccountId && !isMysql(knex)) {
      table.integer('account_id').references('users.id');
    }

    const firstNameTable = table.string('first_name');
    if (indexFirstName) {
      firstNameTable.index();
    }

    table.string('last_name');
    table.string('phone').nullable();
    table.string('email').unique().nullable();
    table.integer('logins').defaultTo(1).index().comment();
    table.float('balance').defaultTo(0);
    table.text('about');
    table.timestamps();
  });
}

async function createCompositeKeyTable(knex) {
  await knex.schema.createTable('composite_key_test', (table) => {
    table.integer('column_a');
    table.integer('column_b');
    table.text('details');
    table.tinyint('status');
    table.unique(['column_a', 'column_b']);
  });
}

async function createParentAndChildTables(knex) {
  await knex.schema.createTable('parent', (table) => {
    table.integer('id').primary();
  });
  await knex.schema.createTable('child', (table) => {
    table.integer('id').primary();
    table.integer('parent_id').references('parent.id');
  });
}

async function createCities(knex) {
  await knex.schema.createTable('cities', (table) => {
    table.string('name');
    table.jsonb('population');
    table.jsonb('descriptions');
    table.jsonb('statistics');
    table.jsonb('temperature');
  });
}

async function createCountry(knex) {
  await knex.schema.createTable('country', (table) => {
    table.string('name');
    table.jsonb('climate');
  });
}

async function dropTables(knex) {
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('test_default_table');
  await knex.schema.dropTableIfExists('test_default_table2');
  await knex.schema.dropTableIfExists('composite_key_test');
  await knex.schema.dropTableIfExists('test_table_two');
  await knex.schema.dropTableIfExists('datatype_test');
  await knex.schema.dropTableIfExists('test_default_table');
  await knex.schema.dropTableIfExists('test_default_table2');
  await knex.schema.dropTableIfExists('child');
  await knex.schema.dropTableIfExists('parent');
}

module.exports = {
  createAccounts,
  createCompositeKeyTable,
  createDataType,
  createDefaultTable,
  createUsers,
  createTestTableTwo,
  createParentAndChildTables,
  createCities,
  createCountry,
  dropTables,
};

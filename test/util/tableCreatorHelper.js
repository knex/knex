const { isMysql, isOracle } = require('../util/db-helpers');

async function createTestTableTwo(knex) {
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

async function createAccounts(knex, withAccountId = false) {
  await knex.schema.createTable('accounts', (table) => {
    table.bigIncrements('id');

    if (withAccountId) {
      table.integer('account_id').references('users.id');
    }

    table.string('first_name').index();
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

async function dropTables(knex) {
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('test_default_table');
  await knex.schema.dropTableIfExists('test_default_table2');
  await knex.schema.dropTableIfExists('composite_key_test');
  await knex.schema.dropTableIfExists('test_table_two');
}

module.exports = {
  createAccounts,
  createCompositeKeyTable,
  createUsers,
  createTestTableTwo,
  dropTables,
};


module.exports = {

  mysql: {
    database: 'knex_test',
    user: 'root',
    encoding: 'utf8'
  },

  postgres: {
    adapter:  'postgresql',
    database: 'knex_test',
    user: 'postgres'
  },

  sqlite3: {
    database: ':memory:'
  }

};
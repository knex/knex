module.exports = {
  'should truncate a table with truncate': {
    mysql: {
      bindings: [],
      sql: 'truncate `test_table_two`'
    },
    postgresql: {
      bindings: [],
      sql: 'truncate "test_table_two" restart identity'
    },
    sqlite3: {
      bindings: [],
      sql: ['delete from sqlite_sequence where name = "test_table_two"','delete from "test_table_two"']
    }
  },
  'should allow raw queries directly with `knex.raw`': {
    mysql: {
      bindings: [],
      sql: 'SHOW TABLES'
    },
    postgresql: {
      bindings: [],
      sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\''
    },
    sqlite3: {
      bindings: [],
      sql: 'SELECT name FROM sqlite_master WHERE type=\'table\';'
    }
  }
};
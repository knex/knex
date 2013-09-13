module.exports = {
  'allows key, value': {
    mysql: {
      bindings: [1],
      sql: 'select `first_name`, `last_name` from `accounts` where `id` = ?'
    },
    postgresql: {
      bindings: [1],
      sql: 'select "first_name", "last_name" from "accounts" where "id" = ?'
    },
    sqlite3: {
      bindings: [1],
      sql: 'select "first_name", "last_name" from "accounts" where "id" = ?'
    }
  },
  'allows key, operator, value': {
    mysql: {
      bindings: [1],
      sql: 'select `first_name`, `last_name` from `accounts` where `id` = ?'
    },
    postgresql: {
      bindings: [1],
      sql: 'select "first_name", "last_name" from "accounts" where "id" = ?'
    },
    sqlite3: {
      bindings: [1],
      sql: 'select "first_name", "last_name" from "accounts" where "id" = ?'
    }
  },
  'allows selecting columns with an array': {
    mysql: {
      bindings: [1],
      sql: 'select `email`, `logins` from `accounts` where `id` > ?'
    },
    postgresql: {
      bindings: [1],
      sql: 'select "email", "logins" from "accounts" where "id" > ?'
    },
    sqlite3: {
      bindings: [1],
      sql: 'select "email", "logins" from "accounts" where "id" > ?'
    }
  },
  'allows a hash of where attrs': {
    mysql: {
      bindings: [1],
      sql: 'select * from `accounts` where `id` = ?'
    },
    postgresql: {
      bindings: [1],
      sql: 'select * from "accounts" where "id" = ?'
    },
    sqlite3: {
      bindings: [1],
      sql: 'select * from "accounts" where "id" = ?'
    }
  },
  'allows where id: undefined or id: null as a where null clause': {
    mysql: {
      bindings: [[],[]],
      sql: ['select * from `accounts` where `id` is null','select `first_name`, `email` from `accounts` where `id` is null']
    },
    postgresql: {
      bindings: [[],[]],
      sql: ['select * from "accounts" where "id" is null','select "first_name", "email" from "accounts" where "id" is null']
    },
    sqlite3: {
      bindings: [[],[]],
      sql: ['select * from "accounts" where "id" is null','select "first_name", "email" from "accounts" where "id" is null']
    }
  },
  'allows where id = 0': {
    mysql: {
      bindings: [0],
      sql: 'select * from `accounts` where `id` = ?'
    },
    postgresql: {
      bindings: [0],
      sql: 'select * from "accounts" where "id" = ?'
    },
    sqlite3: {
      bindings: [0],
      sql: 'select * from "accounts" where "id" = ?'
    }
  }
};
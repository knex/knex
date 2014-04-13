module.exports = {
  'should handle deletes': {
    mysql: {
      bindings: [1],
      sql: 'delete from `accounts` where `id` = ?',
      result: 1
    },
    postgresql: {
      bindings: [1],
      sql: 'delete from "accounts" where "id" = ?',
      result: 1
    },
    sqlite3: {
      bindings: [1],
      sql: 'delete from "accounts" where "id" = ?',
      result: 1
    }
  },
  'should allow returning for deletes in postgresql': {
    mysql: {
      bindings: [2],
      sql: 'delete from `accounts` where `id` = ?',
      result: 1
    },
    postgresql: {
      bindings: [2],
      sql: 'delete from "accounts" where "id" = ? returning *',
      result: [{
        id: '2',
        first_name: 'Test',
        last_name: 'User',
        email: 'test2@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }]
    },
    sqlite3: {
      bindings: [2],
      sql: 'delete from "accounts" where "id" = ?',
      result: 1
    }
  }
};

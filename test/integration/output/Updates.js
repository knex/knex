module.exports = {
  'should handle updates': {
    mysql: {
      bindings: ['test100@example.com','User','Test',1],
      sql: 'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
      result: 1
    },
    postgresql: {
      bindings: ['test100@example.com','User','Test',1],
      sql: 'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
      result: 1
    },
    sqlite3: {
      bindings: ['test100@example.com','User','Test',1],
      sql: 'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
      result: 1
    }
  }
};
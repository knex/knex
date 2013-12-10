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
  },
  'should allow returning for updates in postgresql': {
    mysql: {
      bindings: ['test100@example.com','UpdatedUser','UpdatedTest',1],
      sql: 'update `accounts` set `email` = ?, `first_name` = ?, `last_name` = ? where `id` = ?',
      result: 1
    },
    postgresql: {
      bindings: ['test100@example.com','UpdatedUser','UpdatedTest',1],
      sql: 'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ? returning *',
      result: [{
        id: '1',
        first_name: 'UpdatedUser',
        last_name: 'UpdatedTest',
        email: 'test100@example.com',
        logins: 1,
        about: 'Lorem ipsum Dolore labore incididunt enim.',
        created_at: new Date(),
        updated_at: new Date(),
        phone: null
      }]
    },
    sqlite3: {
      bindings: ['test100@example.com','UpdatedUser','UpdatedTest',1],
      sql: 'update "accounts" set "email" = ?, "first_name" = ?, "last_name" = ? where "id" = ?',
      result: 1
    }
  }
};
/*global expect, describe, it*/
/*eslint no-var:0, indent:0, max-len:0 */
'use strict';

var MySQL_Client = require('../../../lib/dialects/mysql')
var PG_Client = require('../../../lib/dialects/postgres')
var Oracle_Client = require('../../../lib/dialects/oracle')
var Oracledb_Client = require('../../../lib/dialects/oracledb')
var SQLite3_Client = require('../../../lib/dialects/sqlite3')
var MSSQL_Client = require('../../../lib/dialects/mssql')

var clients = {
  mysql: new MySQL_Client({}),
  postgres: new PG_Client({}),
  oracle: new Oracle_Client({}),
  oracledb: new Oracledb_Client({}),
  sqlite3: new SQLite3_Client({}),
  mssql: new MSSQL_Client({}),
}

var useNullAsDefaultConfig = { useNullAsDefault: true };
var clientsWithNullAsDefault = {
  mysql: new MySQL_Client(useNullAsDefaultConfig),
  postgres: new PG_Client(useNullAsDefaultConfig),
  oracle: new Oracle_Client(useNullAsDefaultConfig),
  oracledb: new Oracledb_Client(useNullAsDefaultConfig),
  sqlite3: new SQLite3_Client(useNullAsDefaultConfig),
  mssql: new MSSQL_Client(useNullAsDefaultConfig),
}

function qb() {
  return clients.sqlite3.queryBuilder()
}

function raw(sql, bindings) {
  return clients.sqlite3.raw(sql, bindings)
}

function verifySqlResult(dialect, expectedObj, sqlObj) {
  Object.keys(expectedObj).forEach(function (key) {
    if (typeof expectedObj[key] === 'function') {
      expectedObj[key](sqlObj[key]);
    } else {
      try {
        expect(sqlObj[key]).to.deep.equal(expectedObj[key]);
      } catch (e) {
        e.stack = dialect + ': ' + e.stack
        throw e
      }
    }
  });
}

function testsql(chain, valuesToCheck, selectedClients) {
  selectedClients = selectedClients || clients;
  Object.keys(valuesToCheck).forEach(function(key) {
    var newChain = chain.clone()
        newChain.client = selectedClients[key]
    var sqlAndBindings = newChain.toSQL()

    var checkValue = valuesToCheck[key]
    if (typeof checkValue === 'string') {
      verifySqlResult(key, {sql: checkValue}, sqlAndBindings);
    } else {
      verifySqlResult(key, checkValue, sqlAndBindings);
    }
  })
}

function testquery(chain, valuesToCheck, selectedClients) {
  selectedClients = selectedClients || clients;
  Object.keys(valuesToCheck).forEach(function(key) {
    var newChain = chain.clone()
        newChain.client = selectedClients[key]
    var sqlString  = newChain.toQuery()
    var checkValue = valuesToCheck[key]
    expect(checkValue).to.equal(sqlString)
  })
}

describe("QueryBuilder", function() {

  it("basic select", function() {
    testsql(qb().select('*').from('users'), {
      mysql: 'select * from `users`',
      mssql: 'select * from [users]',
      postgres: 'select * from "users"',
    });
  });

  it("adding selects", function() {
    testsql(qb().select('foo').select('bar').select(['baz', 'boom']).from('users'), {
      mysql: 'select `foo`, `bar`, `baz`, `boom` from `users`',
      mssql: 'select [foo], [bar], [baz], [boom] from [users]',
      postgres: 'select "foo", "bar", "baz", "boom" from "users"'
    });
  });

  it("basic select distinct", function() {
    testsql(qb().distinct().select('foo', 'bar').from('users'), {
      mysql: {sql: 'select distinct `foo`, `bar` from `users`'},
      mssql: {sql: 'select distinct [foo], [bar] from [users]'},
      postgres: {sql: 'select distinct "foo", "bar" from "users"'}
    });
  });

  it("basic alias", function() {
    testsql(qb().select('foo as bar').from('users'), {
      mysql: 'select `foo` as `bar` from `users`',
      oracle: 'select "foo" "bar" from "users"',
      mssql: 'select [foo] as [bar] from [users]',
      oracledb: 'select "foo" "bar" from "users"',
      postgres: 'select "foo" as "bar" from "users"'
    });
  });

  it("basic alias trims spaces", function() {
    testsql(qb().select(' foo   as bar ').from('users'), {
      mysql: 'select `foo` as `bar` from `users`',
      oracle: 'select "foo" "bar" from "users"',
      mssql: 'select [foo] as [bar] from [users]',
      oracledb: 'select "foo" "bar" from "users"',
      postgres: 'select "foo" as "bar" from "users"'
    });
  });

  it("allows for case-insensitive alias", function() {
    testsql(qb().select(' foo   aS bar ').from('users'), {
      mysql: 'select `foo` as `bar` from `users`',
      oracle: 'select "foo" "bar" from "users"',
      mssql: 'select [foo] as [bar] from [users]',
      oracledb: 'select "foo" "bar" from "users"',
      postgres: 'select "foo" as "bar" from "users"'
    });
  });

  it("allows alias with dots in the identifier name", function() {
    testsql(qb().select('foo as bar.baz').from('users'), {
      mysql: 'select `foo` as `bar.baz` from `users`',
      oracle: 'select "foo" "bar.baz" from "users"',
      mssql: 'select [foo] as [bar.baz] from [users]',
      postgres: 'select "foo" as "bar.baz" from "users"'
    });
  });

  it("basic table wrapping", function() {
    testsql(qb().select('*').from('public.users'), {
      mysql: 'select * from `public`.`users`',
      mssql: 'select * from [public].[users]',
      postgres: 'select * from "public"."users"'
    });
  });

  it("basic table wrapping with declared schema", function() {
    testsql(qb().withSchema('myschema').select('*').from('users'), {
      mysql: 'select * from `myschema`.`users`',
      postgres: 'select * from "myschema"."users"',
      mssql: 'select * from [myschema].[users]',
    });
  });

  it("selects from only", function() {
    testsql(qb().select('*').from('users', { only: true }), {
      postgres: 'select * from only "users"',
    });
  });

  it("clear a select", function() {
    testsql(qb().select('id', 'email').from('users').clearSelect(), {
      mysql: {
        sql: 'select * from `users`'
      },
      mssql: {
        sql: 'select * from [users]'
      },
      postgres: {
        sql: 'select * from "users"'
      }
    });

    testsql(qb().select('id').from('users').clearSelect().select('email'), {
      mysql: {
        sql: 'select `email` from `users`'
      },
      mssql: {
        sql: 'select [email] from [users]'
      },
      postgres: {
        sql: 'select "email" from "users"'
      }
    });
  });

  it("clear a where", function() {
    testsql(qb().select('id').from('users').where('id', '=', 1).clearWhere(), {
      mysql: {
        sql: 'select `id` from `users`'
      },
      mssql: {
        sql: 'select [id] from [users]'
      },
      postgres: {
        sql: 'select "id" from "users"'
      }
    });

    testsql(qb().select('id').from('users').where('id', '=', 1).clearWhere().where('id', '=', 2), {
      mysql: {
        sql: 'select `id` from `users` where `id` = ?',
        bindings: [2]
      },
      mssql: {
        sql: 'select [id] from [users] where [id] = ?',
        bindings: [2]
      },
      postgres: {
        sql: 'select "id" from "users" where "id" = ?',
        bindings: [2]
      }
    });
  });

  it("basic wheres", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1), {
      mysql: {
        sql: 'select * from `users` where `id` = ?',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ?',
        bindings: [1]
      }
    });

    testquery(qb().select('*').from('users').where('id', '=', 1), {
      mysql: 'select * from `users` where `id` = 1',
      postgres: 'select * from "users" where "id" = 1',
      mssql: 'select * from [users] where [id] = 1',
    });
  });


  it("where not", function() {
    testsql(qb().select('*').from('users').whereNot('id', '=', 1), {
      mysql: {
        sql: 'select * from `users` where not `id` = ?',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [users] where not [id] = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "users" where not "id" = ?',
        bindings: [1]
      }
    });

    testquery(qb().select('*').from('users').whereNot('id', '=', 1), {
      mysql: 'select * from `users` where not `id` = 1',
      postgres: 'select * from "users" where not "id" = 1',
      mssql: 'select * from [users] where not [id] = 1',
    });
  });

  it("grouped or where not", function() {
    testsql(qb().select('*').from('users').whereNot(function() { this.where('id', '=', 1).orWhereNot('id', '=', 3); }), {
      mysql: {
        sql: 'select * from `users` where not (`id` = ? or not `id` = ?)',
        bindings: [1, 3]
      },
      mssql: {
        sql: 'select * from [users] where not ([id] = ? or not [id] = ?)',
        bindings: [1, 3]
      },
      postgres: {
        sql: 'select * from "users" where not ("id" = ? or not "id" = ?)',
        bindings: [1, 3]
      }
    });

    testquery(qb().select('*').from('users').whereNot(function() { this.where('id', '=', 1).orWhereNot('id', '=', 3); }), {
      mysql: 'select * from `users` where not (`id` = 1 or not `id` = 3)',
      postgres: 'select * from "users" where not ("id" = 1 or not "id" = 3)',
      mssql: 'select * from [users] where not ([id] = 1 or not [id] = 3)',
    });
  });

  it("grouped or where not alternate", function() {
    testsql(qb().select('*').from('users').where(function() { this.where('id', '=', 1).orWhereNot('id', '=', 3); }), {
      mysql: {
        sql: 'select * from `users` where (`id` = ? or not `id` = ?)',
        bindings: [1, 3]
      },
      mssql: {
        sql: 'select * from [users] where ([id] = ? or not [id] = ?)',
        bindings: [1, 3]
      },
      postgres: {
        sql: 'select * from "users" where ("id" = ? or not "id" = ?)',
        bindings: [1, 3]
      }
    });

    testquery(qb().select('*').from('users').where(function() { this.where('id', '=', 1).orWhereNot('id', '=', 3); }), {
      mysql: 'select * from `users` where (`id` = 1 or not `id` = 3)',
      postgres: 'select * from "users" where ("id" = 1 or not "id" = 3)',
      mssql: 'select * from [users] where ([id] = 1 or not [id] = 3)',
    });
  });


  it("where not object", function() {
    testsql(qb().select('*').from('users').whereNot({first_name: 'Test', last_name: 'User'}), {
      mysql: {
        sql: 'select * from `users` where not `first_name` = ? and not `last_name` = ?',
        bindings: ['Test', 'User']
      },
      mssql: {
        sql: 'select * from [users] where not [first_name] = ? and not [last_name] = ?',
        bindings: ['Test', 'User']
      },
      postgres: {
        sql: 'select * from "users" where not "first_name" = ? and not "last_name" = ?',
        bindings: ['Test', 'User']
      }
    });

    testquery(qb().select('*').from('users').whereNot({first_name: 'Test', last_name: 'User'}), {
      mysql: 'select * from `users` where not `first_name` = \'Test\' and not `last_name` = \'User\'',
      postgres: 'select * from "users" where not "first_name" = \'Test\' and not "last_name" = \'User\'',
      mssql: 'select * from [users] where not [first_name] = \'Test\' and not [last_name] = \'User\'',
    });
  });


  it('where bool', function() {
    testquery(qb().select('*').from('users').where(true), {
      mysql: 'select * from `users` where 1 = 1',
      sqlite3: 'select * from "users" where 1 = 1',
      mssql: 'select * from [users] where 1 = 1',
      postgres: 'select * from "users" where 1 = 1'
    });
  });

  it("where betweens", function() {
    testsql(qb().select('*').from('users').whereBetween('id', [1, 2]), {
      mysql: {
        sql: 'select * from `users` where `id` between ? and ?',
        bindings: [1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] between ? and ?',
        bindings: [1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" between ? and ?',
        bindings: [1, 2]
      }
    });
  });

  it("and where betweens", function() {
    testsql(qb().select('*').from('users').where('name', '=', 'user1').andWhereBetween('id', [1, 2]), {
      mysql: {
        sql: 'select * from `users` where `name` = ? and `id` between ? and ?',
        bindings: ['user1', 1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [name] = ? and [id] between ? and ?',
        bindings: ['user1', 1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "name" = ? and "id" between ? and ?',
        bindings: ['user1', 1, 2]
      }
    });
  });

  it("and where not betweens", function() {
    testsql(qb().select('*').from('users').where('name', '=', 'user1').andWhereNotBetween('id', [1, 2]), {
      mysql: {
        sql: 'select * from `users` where `name` = ? and `id` not between ? and ?',
        bindings: ['user1', 1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [name] = ? and [id] not between ? and ?',
        bindings: ['user1', 1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "name" = ? and "id" not between ? and ?',
        bindings: ['user1', 1, 2]
      }
    });
  });

  it("where betweens, alternate", function() {
    testsql(qb().select('*').from('users').where('id', 'BeTween', [1, 2]), {
      mysql: {
        sql: 'select * from `users` where `id` between ? and ?',
        bindings: [1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] between ? and ?',
        bindings: [1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" between ? and ?',
        bindings: [1, 2]
      }
    });
  });

  it("where not between", function() {
    testsql(qb().select('*').from('users').whereNotBetween('id', [1, 2]), {
      mysql: {
        sql: 'select * from `users` where `id` not between ? and ?',
        bindings: [1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] not between ? and ?',
        bindings: [1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" not between ? and ?',
        bindings: [1, 2]
      }
    });
  });

  it("where not between, alternate", function() {
    testsql(qb().select('*').from('users').where('id', 'not between ', [1, 2]), {
      mysql: {
        sql: 'select * from `users` where `id` not between ? and ?',
        bindings: [1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] not between ? and ?',
        bindings: [1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" not between ? and ?',
        bindings: [1, 2]
      }
    });
  });

  it("basic or wheres", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).orWhere('email', '=', 'foo'), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `email` = ?',
        bindings: [1, 'foo']
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [email] = ?',
        bindings: [1, 'foo']
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "email" = ?',
        bindings: [1, 'foo']
      }
    });
  });

  it("chained or wheres", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).or.where('email', '=', 'foo'), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `email` = ?',
        bindings: [1, 'foo']
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [email] = ?',
        bindings: [1, 'foo']
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "email" = ?',
        bindings: [1, 'foo']
      }
    });
  });

  it("raw column wheres", function() {
    testsql(qb().select('*').from('users').where(raw('LCASE("name")'), 'foo'), {
      mysql: {
        sql: 'select * from `users` where LCASE("name") = ?',
        bindings: ['foo']
      },
      mssql: {
        sql: 'select * from [users] where LCASE("name") = ?',
        bindings: ['foo']
      },
      postgres: {
        sql: 'select * from "users" where LCASE("name") = ?',
        bindings: ['foo']
      }
    });
  });

  it("raw wheres", function() {
    testsql(qb().select('*').from('users').where(raw('id = ? or email = ?', [1, 'foo'])), {
      mysql: {
        sql: 'select * from `users` where id = ? or email = ?',
        bindings: [1, 'foo']
      },
      mssql: {
        sql: 'select * from [users] where id = ? or email = ?',
        bindings: [1, 'foo']
      },
      postgres: {
        sql: 'select * from "users" where id = ? or email = ?',
        bindings: [1, 'foo']
      }
    });
  });

  it("raw or wheres", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).orWhere(raw('email = ?', ['foo'])), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or email = ?',
        bindings: [1, 'foo']
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or email = ?',
        bindings: [1, 'foo']
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or email = ?',
        bindings: [1, 'foo']
      }
    });
  });

  it("chained raw or wheres", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).or.where(raw('email = ?', ['foo'])), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or email = ?',
        bindings: [1, 'foo']
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or email = ?',
        bindings: [1, 'foo']
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or email = ?',
        bindings: [1, 'foo']
      }
    });
  });

  it("basic where ins", function() {
    testsql(qb().select('*').from('users').whereIn('id', [1, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` in (?, ?, ?)',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] in (?, ?, ?)',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" in (?, ?, ?)',
        bindings: [1, 2, 3]
      }
    });
  });

  it("orWhereIn", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).orWhereIn('id', [1, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `id` in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [id] in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "id" in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      }
    });
  });

  it("basic where not ins", function() {
    testsql(qb().select('*').from('users').whereNotIn('id', [1, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` not in (?, ?, ?)',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] not in (?, ?, ?)',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" not in (?, ?, ?)',
        bindings: [1, 2, 3]
      }
    });
  });

  it("chained or where not in", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).or.not.whereIn('id', [1, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `id` not in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [id] not in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "id" not in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      }
    });
  });

  it("or.whereIn", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).or.whereIn('id', [4, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `id` in (?, ?, ?)',
        bindings: [1, 4, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [id] in (?, ?, ?)',
        bindings: [1, 4, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "id" in (?, ?, ?)',
        bindings: [1, 4, 2, 3]
      }
    });
  });

  it("chained basic where not ins", function() {
    testsql(qb().select('*').from('users').not.whereIn('id', [1, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` not in (?, ?, ?)',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] not in (?, ?, ?)',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" not in (?, ?, ?)',
        bindings: [1, 2, 3]
      }
    });
  });

  it("chained or where not in", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).or.not.whereIn('id', [1, 2, 3]), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `id` not in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [id] not in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "id" not in (?, ?, ?)',
        bindings: [1, 1, 2, 3]
      }
    });
  });

  it('whereIn with empty array, #477', function() {
    testsql(qb().select('*').from('users').whereIn('id', []), {
      mysql: {
        sql: 'select * from `users` where 1 = ?',
        bindings: [0]
      },
      sqlite3: {
        sql: 'select * from "users" where 1 = ?',
        bindings: [0]
      },
      mssql: {
        sql: 'select * from [users] where 1 = ?',
        bindings: [0]
      },
      postgres: {
        sql: 'select * from "users" where 1 = ?',
        bindings: [0]
      }
    });
  });

  it('whereNotIn with empty array, #477', function() {
    testsql(qb().select('*').from('users').whereNotIn('id', []), {
      mysql: {
        sql: 'select * from `users` where 1 = ?',
        bindings: [1]
      },
      sqlite3: {
        sql: 'select * from "users" where 1 = ?',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [users] where 1 = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "users" where 1 = ?',
        bindings: [1]
      }
    });
  });

  it('should allow a function as the first argument, for a grouped where clause', function() {
    var partial = qb().table('test').where('id', '=', 1);
    testsql(partial, {
      mysql: 'select * from `test` where `id` = ?',
      mssql: 'select * from [test] where [id] = ?',
      postgres: 'select * from "test" where "id" = ?'
    });

    var subWhere = function (sql) {
      expect(this).to.equal(sql);
      this.where({id: 3}).orWhere('id', 4);
    };

    testsql(partial.where(subWhere), {
      mysql: {
        sql: 'select * from `test` where `id` = ? and (`id` = ? or `id` = ?)',
        bindings: [1, 3, 4]
      },
      mssql: {
        sql: 'select * from [test] where [id] = ? and ([id] = ? or [id] = ?)',
        bindings: [1, 3, 4]
      },
      postgres: {
        sql: 'select * from "test" where "id" = ? and ("id" = ? or "id" = ?)',
        bindings: [1, 3, 4]
      }
    });
  });

  it('should accept a function as the "value", for a sub select', function() {
    var chain = qb().where('id', '=', function(qb) {
      expect(this).to.equal(qb);
      this.select('account_id').from('names').where('names.id', '>', 1).orWhere(function() {
        this.where('names.first_name', 'like', 'Tim%').andWhere('names.id', '>', 10);
      });
    });

    testsql(chain, {
      mysql: {
        sql: 'select * where `id` = (select `account_id` from `names` where `names`.`id` > ? or (`names`.`first_name` like ? and `names`.`id` > ?))',
        bindings: [1, 'Tim%', 10]
      },
      mssql: {
        sql: 'select * where [id] = (select [account_id] from [names] where [names].[id] > ? or ([names].[first_name] like ? and [names].[id] > ?))',
        bindings: [1, 'Tim%', 10]
      },
      postgres: {
        sql: 'select * where "id" = (select "account_id" from "names" where "names"."id" > ? or ("names"."first_name" like ? and "names"."id" > ?))',
        bindings: [1, 'Tim%', 10]
      }
    });

    testquery(chain, {
      mysql: 'select * where `id` = (select `account_id` from `names` where `names`.`id` > 1 or (`names`.`first_name` like \'Tim%\' and `names`.`id` > 10))',
      postgres: 'select * where "id" = (select "account_id" from "names" where "names"."id" > 1 or ("names"."first_name" like \'Tim%\' and "names"."id" > 10))',
      mssql: 'select * where [id] = (select [account_id] from [names] where [names].[id] > 1 or ([names].[first_name] like \'Tim%\' and [names].[id] > 10))',
    });
  });

  it('should accept a function as the "value", for a sub select when chained', function() {
    var chain = qb().where('id', '=', function(qb) {
      expect(this).to.equal(qb);
      this.select('account_id').from('names').where('names.id', '>', 1).or.where(function() {
        this.where('names.first_name', 'like', 'Tim%').and.where('names.id', '>', 10);
      });
    });

    testsql(chain, {
      mysql: {
        sql: 'select * where `id` = (select `account_id` from `names` where `names`.`id` > ? or (`names`.`first_name` like ? and `names`.`id` > ?))',
        bindings: [1, 'Tim%', 10]
      },
      mssql: {
        sql: 'select * where [id] = (select [account_id] from [names] where [names].[id] > ? or ([names].[first_name] like ? and [names].[id] > ?))',
        bindings: [1, 'Tim%', 10]
      },
      postgres: {
        sql: 'select * where "id" = (select "account_id" from "names" where "names"."id" > ? or ("names"."first_name" like ? and "names"."id" > ?))',
        bindings: [1, 'Tim%', 10]
      }
    });
  });

  it('should not do whereNull on where("foo", "<>", null) #76', function() {
    testquery(qb().where('foo', '<>', null), {
      mysql: 'select * where `foo` <> NULL',
      mssql: 'select * where [foo] <> NULL',
      postgres: 'select * where "foo" <> NULL'
    });
  });

  it('should expand where("foo", "!=") to - where id = "!="', function() {
    testquery(qb().where('foo', '!='), {
      mysql: 'select * where `foo` = \'!=\'',
      mssql: 'select * where [foo] = \'!=\'',
      postgres: 'select * where "foo" = \'!=\''
    });
  });

  it("unions", function() {
    var chain = qb().select('*').from('users').where('id', '=', 1).union(function() {
      this.select('*').from('users').where('id', '=', 2);
    });
    testsql(chain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union select * from `users` where `id` = ?',
        bindings: [1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union select * from [users] where [id] = ?',
        bindings: [1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union select * from "users" where "id" = ?',
        bindings: [1, 2]
      }
    });

    var multipleArgumentsChain = qb().select('*').from('users').where({id: 1}).union(function() {
      this.select('*').from('users').where({id: 2});
    }, function() {
      this.select('*').from('users').where({id: 3});
    });
    testsql(multipleArgumentsChain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union select * from `users` where `id` = ? union select * from `users` where `id` = ?',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union select * from [users] where [id] = ? union select * from [users] where [id] = ?',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union select * from "users" where "id" = ? union select * from "users" where "id" = ?',
        bindings: [1, 2, 3]
      }
    });

    var arrayChain = qb().select('*').from('users').where({id: 1}).union([
      function() {
        this.select('*').from('users').where({id: 2});
      }, function() {
        this.select('*').from('users').where({id: 3});
      }
    ]);
    testsql(arrayChain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union select * from `users` where `id` = ? union select * from `users` where `id` = ?',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union select * from [users] where [id] = ? union select * from [users] where [id] = ?',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union select * from "users" where "id" = ? union select * from "users" where "id" = ?',
        bindings: [1, 2, 3]
      }
    });
  });

  it("wraps unions", function() {
    var wrappedChain = qb().select('*').from('users').where('id', 'in', function() {
      this.table('users').max("id").union(function() {
        this.table('users').min("id");
      }, true);
    });
    testsql(wrappedChain, {
      mysql: {
        sql: 'select * from `users` where `id` in (select max(`id`) from `users` union (select min(`id`) from `users`))',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] where [id] in (select max([id]) from [users] union (select min([id]) from [users]))',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" where "id" in (select max("id") from "users" union (select min("id") from "users"))',
        bindings: []
      }
    });

    // worthwhile since we're playing games with the 'wrap' specification with arguments
    var multipleArgumentsWrappedChain = qb().select('*').from('users').where({id: 1}).union(function() {
      this.select('*').from('users').where({id: 2});
    }, function() {
      this.select('*').from('users').where({id: 3});
    }, true);
    testsql(multipleArgumentsWrappedChain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union (select * from `users` where `id` = ?) union (select * from `users` where `id` = ?)',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union (select * from [users] where [id] = ?) union (select * from [users] where [id] = ?)',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union (select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)',
        bindings: [1, 2, 3]
      }
    });

    var arrayWrappedChain = qb().select('*').from('users').where({id: 1}).union([
      function() {
        this.select('*').from('users').where({id: 2});
      }, function() {
        this.select('*').from('users').where({id: 3});
      }
    ], true);
    testsql(arrayWrappedChain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union (select * from `users` where `id` = ?) union (select * from `users` where `id` = ?)',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union (select * from [users] where [id] = ?) union (select * from [users] where [id] = ?)',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union (select * from "users" where "id" = ?) union (select * from "users" where "id" = ?)',
        bindings: [1, 2, 3]
      }
    });
  });

  // it("handles grouped mysql unions", function() {
  //   chain = myqb().union(
  //     raw(myqb().select('*').from('users').where('id', '=', 1)).wrap('(', ')'),
  //     raw(myqb().select('*').from('users').where('id', '=', 2)).wrap('(', ')')
  //   ).orderBy('id').limit(10).toSQL();
  //   expect(chain.sql).to.equal('(select * from `users` where `id` = ?) union (select * from `users` where `id` = ?) order by `id` asc limit ?');
  //   expect(chain.bindings).to.eql([1, 2, 10]);
  // });

  it("union alls", function() {
    var chain = qb().select('*').from('users').where('id', '=', 1).unionAll(function() {
      this.select('*').from('users').where('id', '=', 2);
    });
    testsql(chain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union all select * from `users` where `id` = ?',
        bindings: [1, 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union all select * from [users] where [id] = ?',
        bindings: [1, 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union all select * from "users" where "id" = ?',
        bindings: [1, 2]
      }
    });
  });

  it("multiple unions", function() {
    var chain = qb().select('*').from('users').where('id', '=', 1)
      .union(qb().select('*').from('users').where('id', '=', 2))
      .union(qb().select('*').from('users').where('id', '=', 3));
    testsql(chain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union select * from `users` where `id` = ? union select * from `users` where `id` = ?',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union select * from [users] where [id] = ? union select * from [users] where [id] = ?',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union select * from "users" where "id" = ? union select * from "users" where "id" = ?',
        bindings: [1, 2, 3]
      }
    });
  });

  it("multiple union alls", function() {
    var chain = qb().select('*').from('users').where('id', '=', 1)
      .unionAll(qb().select('*').from('users').where('id', '=', 2))
      .unionAll(qb().select('*').from('users').where('id', '=', 3));

    testsql(chain, {
      mysql: {
        sql: 'select * from `users` where `id` = ? union all select * from `users` where `id` = ? union all select * from `users` where `id` = ?',
        bindings: [1, 2, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? union all select * from [users] where [id] = ? union all select * from [users] where [id] = ?',
        bindings: [1, 2, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? union all select * from "users" where "id" = ? union all select * from "users" where "id" = ?',
        bindings: [1, 2, 3]
      }
    });
  });

  it("sub select where ins", function() {
    testsql(qb().select('*').from('users').whereIn('id', function(qb) {
      qb.select('id').from('users').where('age', '>', 25).limit(3);
    }), {
      mysql: {
        sql: 'select * from `users` where `id` in (select `id` from `users` where `age` > ? limit ?)',
        bindings: [25, 3]
      },
      oracle: {
        sql: 'select * from "users" where "id" in (select * from (select "id" from "users" where "age" > ?) where rownum <= ?)',
        bindings: [25, 3]
      },
      mssql: {
        sql: 'select * from [users] where [id] in (select top (?) [id] from [users] where [age] > ?)',
        bindings: [3, 25]
      },
      oracledb: {
        sql: 'select * from "users" where "id" in (select * from (select "id" from "users" where "age" > ?) where rownum <= ?)',
        bindings: [25, 3]
      },
      postgres: {
        sql: 'select * from "users" where "id" in (select "id" from "users" where "age" > ? limit ?)',
        bindings: [25, 3]
      }
    });
  });

  it("sub select where not ins", function() {
    testsql(qb().select('*').from('users').whereNotIn('id', function(qb) {
      qb.select('id').from('users').where('age', '>', 25);
    }), {
      mysql: {
        sql: 'select * from `users` where `id` not in (select `id` from `users` where `age` > ?)',
        bindings: [25]
      },
      mssql: {
        sql: 'select * from [users] where [id] not in (select [id] from [users] where [age] > ?)',
        bindings: [25]
      },
      postgres: {
        sql: 'select * from "users" where "id" not in (select "id" from "users" where "age" > ?)',
        bindings: [25]
      }
    });
  });

  it("basic where nulls", function() {
    testsql(qb().select('*').from('users').whereNull('id'), {
      mysql: {
        sql: 'select * from `users` where `id` is null',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] where [id] is null',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" where "id" is null',
        bindings: []
      }
    });
  });

  it("basic or where nulls", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).orWhereNull('id'), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `id` is null',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [id] is null',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "id" is null',
        bindings: [1]
      }
    });
  });

  it("basic where not nulls", function() {
    testsql(qb().select('*').from('users').whereNotNull('id'), {
      mysql: {
        sql: 'select * from `users` where `id` is not null',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] where [id] is not null',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" where "id" is not null',
        bindings: []
      }
    });
  });

  it("basic or where not nulls", function() {
    testsql(qb().select('*').from('users').where('id', '>', 1).orWhereNotNull('id'), {
      mysql: {
        sql: 'select * from `users` where `id` > ? or `id` is not null',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [users] where [id] > ? or [id] is not null',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "users" where "id" > ? or "id" is not null',
        bindings: [1]
      }
    });
  });

  it("group bys", function() {
    testsql(qb().select('*').from('users').groupBy('id', 'email'), {
      mysql: {
        sql: 'select * from `users` group by `id`, `email`',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] group by [id], [email]',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" group by "id", "email"',
        bindings: []
      }
    });
  });

  it("order bys", function() {
    testsql(qb().select('*').from('users').orderBy('email').orderBy('age', 'desc'), {
      mysql: {
        sql: 'select * from `users` order by `email` asc, `age` desc',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] order by [email] asc, [age] desc',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" order by "email" asc, "age" desc',
        bindings: []
      }
    });
  });

  it("raw group bys", function() {
    testsql(qb().select('*').from('users').groupByRaw('id, email'), {
      mysql: {
        sql: 'select * from `users` group by id, email',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] group by id, email',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" group by id, email',
        bindings: []
      }
    });
  });

  it("raw order bys with default direction", function() {
    testsql(qb().select('*').from('users').orderBy(raw('col NULLS LAST')), {
      mysql: {
        sql: 'select * from `users` order by col NULLS LAST asc',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] order by col NULLS LAST asc',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" order by col NULLS LAST asc',
        bindings: []
      }
    });
  });

  it("raw order bys with specified direction", function() {
    testsql(qb().select('*').from('users').orderBy(raw('col NULLS LAST'), 'desc'), {
      mysql: {
        sql: 'select * from `users` order by col NULLS LAST desc',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] order by col NULLS LAST desc',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" order by col NULLS LAST desc',
        bindings: []
      }
    });
  });

  it("orderByRaw", function() {
    testsql(qb().select('*').from('users').orderByRaw('col NULLS LAST DESC'), {
      mysql: {
        sql: 'select * from `users` order by col NULLS LAST DESC',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] order by col NULLS LAST DESC',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" order by col NULLS LAST DESC',
        bindings: []
      }
    });
  });

  it("orderByRaw second argument is the binding", function() {
    testsql(qb().select('*').from('users').orderByRaw('col NULLS LAST ?', 'dEsc'), {
      mysql: {
        sql: 'select * from `users` order by col NULLS LAST ?',
        bindings: ['dEsc']
      },
      mssql: {
        sql: 'select * from [users] order by col NULLS LAST ?',
        bindings: ['dEsc']
      },
      postgres: {
        sql: 'select * from "users" order by col NULLS LAST ?',
        bindings: ['dEsc']
      }
    });
  });

  it("multiple order bys", function() {
    testsql(qb().select('*').from('users').orderBy('email').orderBy('age', 'desc'), {
      mysql: {
        sql: 'select * from `users` order by `email` asc, `age` desc',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] order by [email] asc, [age] desc',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" order by "email" asc, "age" desc',
        bindings: []
      }
    });
  });

  it("havings", function() {
    testsql(qb().select('*').from('users').having('email', '>', 1), {
      mysql: 'select * from `users` having `email` > ?',
      mssql: 'select * from [users] having [email] > ?',
      postgres: 'select * from "users" having "email" > ?',
      oracledb: 'select * from "users" having "email" > ?',
      oracle: 'select * from "users" having "email" > ?'
    });
  });

  it("or having", function() {
    testsql(qb().select('*').from('users').having('baz', '>', 5).orHaving('email', '=', 10), {
      mysql: 'select * from `users` having `baz` > ? or `email` = ?',
      mssql: 'select * from [users] having [baz] > ? or [email] = ?',
      postgres: 'select * from "users" having "baz" > ? or "email" = ?',
      oracledb: 'select * from "users" having "baz" > ? or "email" = ?',
      oracle: 'select * from "users" having "baz" > ? or "email" = ?'
    });
  });

  it("nested having", function() {
    testsql(qb().select('*').from('users').having(function(){
      this.where('email', '>', 1);
    }), {
      mysql: 'select * from `users` having (`email` > ?)',
      mssql: 'select * from [users] having ([email] > ?)',
      postgres: 'select * from "users" having ("email" > ?)',
      oracledb: 'select * from "users" having ("email" > ?)',
      oracle: 'select * from "users" having ("email" > ?)'
    });
  });

  it("nested or havings", function() {
    testsql(qb().select('*').from('users').having(function(){
      this.where('email', '>', 10);
      this.orWhere('email', '=', 7);
    }), {
      mysql: 'select * from `users` having (`email` > ? or `email` = ?)',
      mssql: 'select * from [users] having ([email] > ? or [email] = ?)',
      postgres: 'select * from "users" having ("email" > ? or "email" = ?)',
      oracledb: 'select * from "users" having ("email" > ? or "email" = ?)',
      oracle: 'select * from "users" having ("email" > ? or "email" = ?)'
    });
  });

  it("grouped having", function() {
    testsql(qb().select('*').from('users').groupBy('email').having('email', '>', 1), {
      mysql: 'select * from `users` group by `email` having `email` > ?',
      mssql: 'select * from [users] group by [email] having [email] > ?',
      postgres: 'select * from "users" group by "email" having "email" > ?',
      oracledb: 'select * from "users" group by "email" having "email" > ?',
      oracle: 'select * from "users" group by "email" having "email" > ?'
    });
  });

  it("having from", function() {
    testsql(qb().select('email as foo_email').from('users').having('foo_email', '>', 1), {
      mysql: 'select `email` as `foo_email` from `users` having `foo_email` > ?',
      oracle: 'select "email" "foo_email" from "users" having "foo_email" > ?',
      mssql: 'select [email] as [foo_email] from [users] having [foo_email] > ?',
      oracledb: 'select "email" "foo_email" from "users" having "foo_email" > ?',
      postgres: 'select "email" as "foo_email" from "users" having "foo_email" > ?'
    });
  });

  it("raw havings", function() {
    testsql(qb().select('*').from('users').having(raw('user_foo < user_bar')), {
      mysql: 'select * from `users` having user_foo < user_bar',
      mssql: 'select * from [users] having user_foo < user_bar',
      postgres: 'select * from "users" having user_foo < user_bar',
      oracledb: 'select * from "users" having user_foo < user_bar',
      oracle: 'select * from "users" having user_foo < user_bar'
    });
  });

  it("raw or havings", function() {
    testsql(qb().select('*').from('users').having('baz', '=', 1).orHaving(raw('user_foo < user_bar')), {
      mysql: 'select * from `users` having `baz` = ? or user_foo < user_bar',
      mssql: 'select * from [users] having [baz] = ? or user_foo < user_bar',
      postgres: 'select * from "users" having "baz" = ? or user_foo < user_bar',
      oracledb: 'select * from "users" having "baz" = ? or user_foo < user_bar',
      oracle: 'select * from "users" having "baz" = ? or user_foo < user_bar'
    });
  });

  it("having null", function() {
    testsql(qb().select('*').from('users').havingNull('baz'), {
      mysql: 'select * from `users` having `baz` is null',
      mssql: 'select * from [users] having [baz] is null',
      postgres: 'select * from "users" having "baz" is null',
      oracledb: 'select * from "users" having "baz" is null',
      oracle: 'select * from "users" having "baz" is null'
    });
  });

  it("or having null", function() {
    testsql(qb().select('*').from('users').havingNull('baz').orHavingNull('foo'), {
      mysql: 'select * from `users` having `baz` is null or `foo` is null',
      mssql: 'select * from [users] having [baz] is null or [foo] is null',
      postgres: 'select * from "users" having "baz" is null or "foo" is null',
      oracledb: 'select * from "users" having "baz" is null or "foo" is null',
      oracle: 'select * from "users" having "baz" is null or "foo" is null'
    });
  });

  it("having not null", function() {
    testsql(qb().select('*').from('users').havingNotNull('baz'), {
      mysql: 'select * from `users` having `baz` is not null',
      mssql: 'select * from [users] having [baz] is not null',
      postgres: 'select * from "users" having "baz" is not null',
      oracledb: 'select * from "users" having "baz" is not null',
      oracle: 'select * from "users" having "baz" is not null'
    });
  });

  it("or having not null", function() {
    testsql(qb().select('*').from('users').havingNotNull('baz').orHavingNotNull('foo'), {
      mysql: 'select * from `users` having `baz` is not null or `foo` is not null',
      mssql: 'select * from [users] having [baz] is not null or [foo] is not null',
      postgres: 'select * from "users" having "baz" is not null or "foo" is not null',
      oracledb: 'select * from "users" having "baz" is not null or "foo" is not null',
      oracle: 'select * from "users" having "baz" is not null or "foo" is not null'
    });
  });

  it("having exists", function() {
    testsql(qb().select('*').from('users').havingExists(function() {
      this.select('baz').from('users');
    }), {
      mysql: 'select * from `users` having exists (select `baz` from `users`)',
      mssql: 'select * from [users] having exists (select [baz] from [users])',
      postgres: 'select * from "users" having exists (select "baz" from "users")',
      oracledb: 'select * from "users" having exists (select "baz" from "users")',
      oracle: 'select * from "users" having exists (select "baz" from "users")'
    });
  });

  it("or having exists", function() {
    testsql(qb().select('*').from('users').havingExists(function() {
      this.select('baz').from('users');
    }).orHavingExists(function() {
      this.select('foo').from('users');
    }), {
      mysql: 'select * from `users` having exists (select `baz` from `users`) or exists (select `foo` from `users`)',
      mssql: 'select * from [users] having exists (select [baz] from [users]) or exists (select [foo] from [users])',
      postgres: 'select * from "users" having exists (select "baz" from "users") or exists (select "foo" from "users")',
      oracledb: 'select * from "users" having exists (select "baz" from "users") or exists (select "foo" from "users")',
      oracle: 'select * from "users" having exists (select "baz" from "users") or exists (select "foo" from "users")'
    });
  });

  it("having not exists", function() {
    testsql(qb().select('*').from('users').havingNotExists(function() {
      this.select('baz').from('users');
    }), {
      mysql: 'select * from `users` having not exists (select `baz` from `users`)',
      mssql: 'select * from [users] having not exists (select [baz] from [users])',
      postgres: 'select * from "users" having not exists (select "baz" from "users")',
      oracledb: 'select * from "users" having not exists (select "baz" from "users")',
      oracle: 'select * from "users" having not exists (select "baz" from "users")'
    });
  });

  it("or having not exists", function() {
    testsql(qb().select('*').from('users').havingNotExists(function() {
      this.select('baz').from('users');
    }).orHavingNotExists(function() {
      this.select('foo').from('users');
    }), {
      mysql: 'select * from `users` having not exists (select `baz` from `users`) or not exists (select `foo` from `users`)',
      mssql: 'select * from [users] having not exists (select [baz] from [users]) or not exists (select [foo] from [users])',
      postgres: 'select * from "users" having not exists (select "baz" from "users") or not exists (select "foo" from "users")',
      oracledb: 'select * from "users" having not exists (select "baz" from "users") or not exists (select "foo" from "users")',
      oracle: 'select * from "users" having not exists (select "baz" from "users") or not exists (select "foo" from "users")'
    });
  });

  it("having between", function() {
    testsql(qb().select('*').from('users').havingBetween('baz', [5, 10]), {
      mysql: 'select * from `users` having `baz` between ? and ?',
      mssql: 'select * from [users] having [baz] between ? and ?',
      postgres: 'select * from "users" having "baz" between ? and ?',
      oracledb: 'select * from "users" having "baz" between ? and ?',
      oracle: 'select * from "users" having "baz" between ? and ?'
    });
  });

  it("or having between", function() {
    testsql(qb().select('*').from('users').havingBetween('baz', [5, 10]).orHavingBetween('baz', [20, 30]), {
      mysql: 'select * from `users` having `baz` between ? and ? or `baz` between ? and ?',
      mssql: 'select * from [users] having [baz] between ? and ? or [baz] between ? and ?',
      postgres: 'select * from "users" having "baz" between ? and ? or "baz" between ? and ?',
      oracledb: 'select * from "users" having "baz" between ? and ? or "baz" between ? and ?',
      oracle: 'select * from "users" having "baz" between ? and ? or "baz" between ? and ?'
    });
  });

  it("having not between", function() {
    testsql(qb().select('*').from('users').havingNotBetween('baz', [5, 10]), {
      mysql: 'select * from `users` having `baz` not between ? and ?',
      mssql: 'select * from [users] having [baz] not between ? and ?',
      postgres: 'select * from "users" having "baz" not between ? and ?',
      oracledb: 'select * from "users" having "baz" not between ? and ?',
      oracle: 'select * from "users" having "baz" not between ? and ?'
    });
  });

  it("or having not between", function() {
    testsql(qb().select('*').from('users').havingNotBetween('baz', [5, 10]).orHavingNotBetween('baz', [20, 30]), {
      mysql: 'select * from `users` having `baz` not between ? and ? or `baz` not between ? and ?',
      mssql: 'select * from [users] having [baz] not between ? and ? or [baz] not between ? and ?',
      postgres: 'select * from "users" having "baz" not between ? and ? or "baz" not between ? and ?',
      oracledb: 'select * from "users" having "baz" not between ? and ? or "baz" not between ? and ?',
      oracle: 'select * from "users" having "baz" not between ? and ? or "baz" not between ? and ?'
    });
  });

  it("having in", function() {
    testsql(qb().select('*').from('users').havingIn('baz', [5, 10, 37]), {
      mysql: 'select * from `users` having `baz` in (?, ?, ?)',
      mssql: 'select * from [users] having [baz] in (?, ?, ?)',
      postgres: 'select * from "users" having "baz" in (?, ?, ?)',
      oracledb: 'select * from "users" having "baz" in (?, ?, ?)',
      oracle: 'select * from "users" having "baz" in (?, ?, ?)'
    });
  });

  it("or having in", function() {
    testsql(qb().select('*').from('users').havingIn('baz', [5, 10, 37]).orHavingIn('foo', ['Batman', 'Joker']), {
      mysql: 'select * from `users` having `baz` in (?, ?, ?) or `foo` in (?, ?)',
      mssql: 'select * from [users] having [baz] in (?, ?, ?) or [foo] in (?, ?)',
      postgres: 'select * from "users" having "baz" in (?, ?, ?) or "foo" in (?, ?)',
      oracledb: 'select * from "users" having "baz" in (?, ?, ?) or "foo" in (?, ?)',
      oracle: 'select * from "users" having "baz" in (?, ?, ?) or "foo" in (?, ?)'
    });
  });

  it("having not in", function() {
    testsql(qb().select('*').from('users').havingNotIn('baz', [5, 10, 37]), {
      mysql: 'select * from `users` having `baz` not in (?, ?, ?)',
      mssql: 'select * from [users] having [baz] not in (?, ?, ?)',
      postgres: 'select * from "users" having "baz" not in (?, ?, ?)',
      oracledb: 'select * from "users" having "baz" not in (?, ?, ?)',
      oracle: 'select * from "users" having "baz" not in (?, ?, ?)'
    });
  });

  it("or having not in", function() {
    testsql(qb().select('*').from('users').havingNotIn('baz', [5, 10, 37]).orHavingNotIn('foo', ['Batman', 'Joker']), {
      mysql: 'select * from `users` having `baz` not in (?, ?, ?) or `foo` not in (?, ?)',
      mssql: 'select * from [users] having [baz] not in (?, ?, ?) or [foo] not in (?, ?)',
      postgres: 'select * from "users" having "baz" not in (?, ?, ?) or "foo" not in (?, ?)',
      oracledb: 'select * from "users" having "baz" not in (?, ?, ?) or "foo" not in (?, ?)',
      oracle: 'select * from "users" having "baz" not in (?, ?, ?) or "foo" not in (?, ?)'
    });
  });

  it("limits", function() {
    testsql(qb().select('*').from('users').limit(10), {
      mysql: {
        sql: 'select * from `users` limit ?',
        bindings: [10]
      },
      oracle: {
        sql: 'select * from (select * from "users") where rownum <= ?',
        bindings: [10]
      },
      mssql: {
        sql: 'select top (?) * from [users]',
        bindings: [10]
      },
      oracledb: {
        sql: 'select * from (select * from "users") where rownum <= ?',
        bindings: [10]
      },
      postgres: {
        sql: 'select * from "users" limit ?',
        bindings: [10]
      }
    });
  });

  it("can limit 0", function() {
    testsql(qb().select('*').from('users').limit(0), {
      mysql: {
        sql: 'select * from `users` limit ?',
        bindings: [0]
      },
      oracle: {
        sql: 'select * from (select * from "users") where rownum <= ?',
        bindings: [0]
      },
      mssql: {
        sql: 'select top (?) * from [users]',
        bindings: [0]
      },
      oracledb: {
        sql: 'select * from (select * from "users") where rownum <= ?',
        bindings: [0]
      },
      postgres: {
        sql: 'select * from "users" limit ?',
        bindings: [0]
      }
    });
  });

  it("limits and offsets", function() {
    testsql(qb().select('*').from('users').offset(5).limit(10), {
      mysql: {
        sql: 'select * from `users` limit ? offset ?',
        bindings: [10, 5]
      },
      oracle: {
        sql: 'select * from (select row_.*, ROWNUM rownum_ from (select * from "users") row_ where rownum <= ?) where rownum_ > ?',
        bindings: [15, 5]
      },
      mssql: {
        sql: 'select * from [users] offset ? rows fetch next ? rows only',
        bindings: [5, 10]
      },
      oracledb: {
        sql: 'select * from (select row_.*, ROWNUM rownum_ from (select * from "users") row_ where rownum <= ?) where rownum_ > ?',
        bindings: [15, 5]
      },
      postgres: {
        sql: 'select * from "users" limit ? offset ?',
        bindings: [10, 5]
      }
    });
  });

  it("first", function() {
    testsql(qb().first('*').from('users'), {
      mysql: {
        sql: 'select * from `users` limit ?',
        bindings: [1]
      },
      oracle: {
        sql: 'select * from (select * from "users") where rownum <= ?',
        bindings: [1]
      },
      mssql: {
        sql: 'select top (?) * from [users]',
        bindings: [1]
      },
      oracledb: {
        sql: 'select * from (select * from "users") where rownum <= ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "users" limit ?',
        bindings: [1]
      }
    });
  });

  it("offsets only", function() {
    testsql(qb().select('*').from('users').offset(5), {
      mysql: {
        sql: 'select * from `users` limit 18446744073709551615 offset ?',
        bindings: [5]
      },
      sqlite3: {
        sql: 'select * from "users" limit ? offset ?',
        bindings: [-1, 5]
      },
      postgres: {
        sql: 'select * from "users" offset ?',
        bindings: [5]
      },
      oracle: {
        sql: 'select * from (select row_.*, ROWNUM rownum_ from (select * from "users") row_ where rownum <= ?) where rownum_ > ?',
        bindings: [10000000000005, 5]
      },
      mssql: {
        sql: 'select * from [users] offset ? rows',
        bindings: [5]
      },
      oracledb: {
        sql: 'select * from (select row_.*, ROWNUM rownum_ from (select * from "users") row_ where rownum <= ?) where rownum_ > ?',
        bindings: [10000000000005, 5]
      },
    });
  });

  it("where shortcut", function() {
    testsql(qb().select('*').from('users').where('id', 1).orWhere('name', 'foo'), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or `name` = ?',
        bindings: [1, 'foo']
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or [name] = ?',
        bindings: [1, 'foo']
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or "name" = ?',
        bindings: [1, 'foo']
      }
    });
  });

  it("nested wheres", function() {
    testsql(qb().select('*').from('users').where('email', '=', 'foo').orWhere(function(qb) {
      qb.where('name', '=', 'bar').where('age', '=', 25);
    }), {
      mysql: {
        sql: 'select * from `users` where `email` = ? or (`name` = ? and `age` = ?)',
        bindings: ['foo', 'bar', 25]
      },
      mssql: {
        sql: 'select * from [users] where [email] = ? or ([name] = ? and [age] = ?)',
        bindings: ['foo', 'bar', 25]
      },
      postgres: {
        sql: 'select * from "users" where "email" = ? or ("name" = ? and "age" = ?)',
        bindings: ['foo', 'bar', 25]
      }
    });
  });


  it("clear nested wheres", function() {
    testsql(qb().select('*').from('users').where('email', '=', 'foo').orWhere(function(qb) {
      qb.where('name', '=', 'bar').where('age', '=', 25).clearWhere();
    }), {
      mysql: {
        sql: 'select * from `users` where `email` = ?',
        bindings: ['foo']
      },
      mssql: {
        sql: 'select * from [users] where [email] = ?',
        bindings: ['foo']
      },
      postgres: {
        sql: 'select * from "users" where "email" = ?',
        bindings: ['foo']
      }
    });
  });

  it("clear where and nested wheres", function() {
    testsql(qb().select('*').from('users').where('email', '=', 'foo').orWhere(function(qb) {
      qb.where('name', '=', 'bar').where('age', '=', 25);
    }).clearWhere(), {
      mysql: {
        sql: 'select * from `users`'
      },
      mssql: {
        sql: 'select * from [users]'
      },
      postgres: {
        sql: 'select * from "users"'
      }
    });
  });

  it("full sub selects", function() {
    testsql(qb().select('*').from('users').where('email', '=', 'foo').orWhere('id', '=', function(qb) {
      qb.select(raw('max(id)')).from('users').where('email', '=', 'bar');
    }), {
      mysql: {
        sql: 'select * from `users` where `email` = ? or `id` = (select max(id) from `users` where `email` = ?)',
        bindings: ['foo', 'bar']
      },
      mssql: {
        sql: 'select * from [users] where [email] = ? or [id] = (select max(id) from [users] where [email] = ?)',
        bindings: ['foo', 'bar']
      },
      postgres: {
        sql: 'select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)',
        bindings: ['foo', 'bar']
      }
    });
  });

 it("clear nested selects", function() {
    testsql(qb().select('email').from('users').where('email', '=', 'foo').orWhere('id', '=', function(qb) {
      qb.select(raw('max(id)')).from('users').where('email', '=', 'bar').clearSelect();
    }), {
      mysql: {
        sql: 'select `email` from `users` where `email` = ? or `id` = (select * from `users` where `email` = ?)',
        bindings: ['foo', 'bar']
      },
      mssql: {
        sql: 'select [email] from [users] where [email] = ? or [id] = (select * from [users] where [email] = ?)',
        bindings: ['foo', 'bar']
      },
      postgres: {
        sql: 'select "email" from "users" where "email" = ? or "id" = (select * from "users" where "email" = ?)',
        bindings: ['foo', 'bar']
      }
    });
  });

  it("clear non nested selects", function() {
    testsql(qb().select('email').from('users').where('email', '=', 'foo').orWhere('id', '=', function(qb) {
      qb.select(raw('max(id)')).from('users').where('email', '=', 'bar');
    }).clearSelect(), {
      mysql: {
        sql: 'select * from `users` where `email` = ? or `id` = (select max(id) from `users` where `email` = ?)',
        bindings: ['foo', 'bar']
      },
      mssql: {
        sql: 'select * from [users] where [email] = ? or [id] = (select max(id) from [users] where [email] = ?)',
        bindings: ['foo', 'bar']
      },
      postgres: {
        sql: 'select * from "users" where "email" = ? or "id" = (select max(id) from "users" where "email" = ?)',
        bindings: ['foo', 'bar']
      }
    });
  });

  it("where exists", function() {
    testsql(qb().select('*').from('orders').whereExists(function(qb) {
      qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
    }), {
      mysql: {
        sql: 'select * from `orders` where exists (select * from `products` where `products`.`id` = "orders"."id")',
        bindings: []
      },
      mssql: {
        sql: 'select * from [orders] where exists (select * from [products] where [products].[id] = "orders"."id")',
        bindings: []
      },
      postgres: {
        sql: 'select * from "orders" where exists (select * from "products" where "products"."id" = "orders"."id")',
        bindings: []
      }
    });
  });

  it("where exists with builder", function() {
    testsql(qb().select('*').from('orders').whereExists(qb().select('*').from('products').whereRaw('products.id = orders.id')), {
      mysql: {
        sql: 'select * from `orders` where exists (select * from `products` where products.id = orders.id)',
        bindings: []
      },
      mssql: {
        sql: 'select * from [orders] where exists (select * from [products] where products.id = orders.id)',
        bindings: []
      },
      postgres: {
        sql: 'select * from "orders" where exists (select * from "products" where products.id = orders.id)',
        bindings: []
      }
    });
  });

  it("where not exists", function() {
    testsql(qb().select('*').from('orders').whereNotExists(function(qb) {
      qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
    }), {
      mysql: {
        sql: 'select * from `orders` where not exists (select * from `products` where `products`.`id` = "orders"."id")',
        bindings: []
      },
      mssql: {
        sql: 'select * from [orders] where not exists (select * from [products] where [products].[id] = "orders"."id")',
        bindings: []
      },
      postgres: {
        sql: 'select * from "orders" where not exists (select * from "products" where "products"."id" = "orders"."id")',
        bindings: []
      }
    });
  });

  it("or where exists", function() {
    testsql(qb().select('*').from('orders').where('id', '=', 1).orWhereExists(function(qb) {
      qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
    }), {
      mysql: {
        sql: 'select * from `orders` where `id` = ? or exists (select * from `products` where `products`.`id` = "orders"."id")',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [orders] where [id] = ? or exists (select * from [products] where [products].[id] = "orders"."id")',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "orders" where "id" = ? or exists (select * from "products" where "products"."id" = "orders"."id")',
        bindings: [1]
      }
    });
  });

  it("or where not exists", function() {
    testsql(qb().select('*').from('orders').where('id', '=', 1).orWhereNotExists(function(qb) {
      qb.select('*').from('products').where('products.id', '=', raw('"orders"."id"'));
    }), {
      mysql: {
        sql: 'select * from `orders` where `id` = ? or not exists (select * from `products` where `products`.`id` = "orders"."id")',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [orders] where [id] = ? or not exists (select * from [products] where [products].[id] = "orders"."id")',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "orders" where "id" = ? or not exists (select * from "products" where "products"."id" = "orders"."id")',
        bindings: [1]
      }
    });
  });

  it("basic joins", function() {
    testsql(qb().select('*').from('users').join('contacts', 'users.id', '=', 'contacts.id').leftJoin('photos', 'users.id', '=', 'photos.id'), {
      mysql: {
        sql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` left join `photos` on `users`.`id` = `photos`.`id`',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] left join [photos] on [users].[id] = [photos].[id]',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" left join "photos" on "users"."id" = "photos"."id"',
        bindings: []
      }
    });
  });

  it("complex join", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').orOn('users.name', '=', 'contacts.name');
    }), {
      mysql: {
        sql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` or `users`.`name` = `contacts`.`name`',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] or [users].[name] = [contacts].[name]',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" or "users"."name" = "contacts"."name"',
        bindings: []
      }
    });
  });

  it("complex join with nest conditional statements", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on(function(qb) {
        qb.on('users.id', '=', 'contacts.id')
        qb.orOn('users.name', '=', 'contacts.name');
      });
    }), {
      mysql: {
        sql: 'select * from `users` inner join `contacts` on (`users`.`id` = `contacts`.`id` or `users`.`name` = `contacts`.`name`)',
        bindings: []
      },
      mssql: {
        sql: 'select * from [users] inner join [contacts] on ([users].[id] = [contacts].[id] or [users].[name] = [contacts].[name])',
        bindings: []
      },
      postgres: {
        sql: 'select * from "users" inner join "contacts" on ("users"."id" = "contacts"."id" or "users"."name" = "contacts"."name")',
        bindings: []
      }
    });
  });

  it("joins with raw", function() {
    testsql(qb().select('*').from('users').join('contacts', 'users.id', raw(1)).leftJoin('photos', 'photos.title', '=', raw('?', ['My Photo'])), {
      mysql: {
        sql: 'select * from `users` inner join `contacts` on `users`.`id` = 1 left join `photos` on `photos`.`title` = ?',
        bindings: ['My Photo']
      },
      mssql: {
        sql: 'select * from [users] inner join [contacts] on [users].[id] = 1 left join [photos] on [photos].[title] = ?',
        bindings: ['My Photo']
      },
      postgres: {
        sql: 'select * from "users" inner join "contacts" on "users"."id" = 1 left join "photos" on "photos"."title" = ?',
        bindings: ['My Photo']
      }
    });
  });

  it("joins with schema", function() {
    testsql(qb().withSchema('myschema').select('*').from('users').join('contacts', 'users.id', '=', 'contacts.id').leftJoin('photos', 'users.id', '=', 'photos.id'), {
      mysql: {
        sql: 'select * from `myschema`.`users` inner join `myschema`.`contacts` on `users`.`id` = `contacts`.`id` left join `myschema`.`photos` on `users`.`id` = `photos`.`id`',
        bindings: []
      },
      mssql: {
        sql: 'select * from [myschema].[users] inner join [myschema].[contacts] on [users].[id] = [contacts].[id] left join [myschema].[photos] on [users].[id] = [photos].[id]',
        bindings: []
      },
      postgres: {
        sql: 'select * from "myschema"."users" inner join "myschema"."contacts" on "users"."id" = "contacts"."id" left join "myschema"."photos" on "users"."id" = "photos"."id"',
        bindings: []
      }
    });
  });

  it("on null", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNull('contacts.address')
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`address` is null',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[address] is null',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is null',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is null',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is null'
    });
  });

  it("or on null", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNull('contacts.address').orOnNull('contacts.phone')
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`address` is null or `contacts`.`phone` is null',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[address] is null or [contacts].[phone] is null',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is null or "contacts"."phone" is null',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is null or "contacts"."phone" is null',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is null or "contacts"."phone" is null'
    });
  });

  it("on not null", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotNull('contacts.address')
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`address` is not null',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[address] is not null',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is not null',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is not null',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is not null'
    });
  });

  it("or on not null", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotNull('contacts.address').orOnNotNull('contacts.phone')
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`address` is not null or `contacts`.`phone` is not null',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[address] is not null or [contacts].[phone] is not null',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is not null or "contacts"."phone" is not null',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is not null or "contacts"."phone" is not null',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."address" is not null or "contacts"."phone" is not null'
    });
  });

  it("on exists", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onExists(function(){this.select('*').from('foo')})
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and exists (select * from `foo`)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and exists (select * from [foo])',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and exists (select * from "foo")',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and exists (select * from "foo")',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and exists (select * from "foo")'
    });
  });

  it("or on exists", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onExists(function(){this.select('*').from('foo')}).orOnExists(function(){this.select('*').from('bar')})
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and exists (select * from `foo`) or exists (select * from `bar`)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and exists (select * from [foo]) or exists (select * from [bar])',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and exists (select * from "foo") or exists (select * from "bar")',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and exists (select * from "foo") or exists (select * from "bar")',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and exists (select * from "foo") or exists (select * from "bar")'
    });
  });

  it("on not exists", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotExists(function(){this.select('*').from('foo')})
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and not exists (select * from `foo`)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and not exists (select * from [foo])',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and not exists (select * from "foo")',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and not exists (select * from "foo")',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and not exists (select * from "foo")'
    });
  });

  it("or on not exists", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotExists(function(){this.select('*').from('foo')}).orOnNotExists(function(){this.select('*').from('bar')})
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and not exists (select * from `foo`) or not exists (select * from `bar`)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and not exists (select * from [foo]) or not exists (select * from [bar])',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and not exists (select * from "foo") or not exists (select * from "bar")',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and not exists (select * from "foo") or not exists (select * from "bar")',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and not exists (select * from "foo") or not exists (select * from "bar")'
    });
  });

  it("on between", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onBetween('contacts.id', [7, 15])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` between ? and ?',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] between ? and ?',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" between ? and ?',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" between ? and ?',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" between ? and ?'
    });
  });

  it("or on between", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onBetween('contacts.id', [7, 15]).orOnBetween('users.id', [9, 14])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` between ? and ? or `users`.`id` between ? and ?',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] between ? and ? or [users].[id] between ? and ?',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" between ? and ? or "users"."id" between ? and ?',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" between ? and ? or "users"."id" between ? and ?',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" between ? and ? or "users"."id" between ? and ?'
    });
  });

  it("on not between", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotBetween('contacts.id', [7, 15])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` not between ? and ?',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] not between ? and ?',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not between ? and ?',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not between ? and ?',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not between ? and ?'
    });
  });

  it("or on not between", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotBetween('contacts.id', [7, 15]).orOnNotBetween('users.id', [9, 14])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` not between ? and ? or `users`.`id` not between ? and ?',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] not between ? and ? or [users].[id] not between ? and ?',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not between ? and ? or "users"."id" not between ? and ?',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not between ? and ? or "users"."id" not between ? and ?',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not between ? and ? or "users"."id" not between ? and ?'
    });
  });

  it("on in", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onIn('contacts.id', [7, 15, 23, 41])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` in (?, ?, ?, ?)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] in (?, ?, ?, ?)',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" in (?, ?, ?, ?)',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" in (?, ?, ?, ?)',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" in (?, ?, ?, ?)'
    });
  });

  it("or on in", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onIn('contacts.id', [7, 15, 23, 41]).orOnIn('users.id', [21, 37])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` in (?, ?, ?, ?) or `users`.`id` in (?, ?)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] in (?, ?, ?, ?) or [users].[id] in (?, ?)',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" in (?, ?, ?, ?) or "users"."id" in (?, ?)',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" in (?, ?, ?, ?) or "users"."id" in (?, ?)',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" in (?, ?, ?, ?) or "users"."id" in (?, ?)'
    });
  });

  it("on not in", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotIn('contacts.id', [7, 15, 23, 41])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` not in (?, ?, ?, ?)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] not in (?, ?, ?, ?)',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not in (?, ?, ?, ?)',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not in (?, ?, ?, ?)',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not in (?, ?, ?, ?)'
    });
  });

  it("or on not in", function() {
    testsql(qb().select('*').from('users').join('contacts', function(qb) {
      qb.on('users.id', '=', 'contacts.id').onNotIn('contacts.id', [7, 15, 23, 41]).orOnNotIn('users.id', [21, 37])
    }), {
      mysql: 'select * from `users` inner join `contacts` on `users`.`id` = `contacts`.`id` and `contacts`.`id` not in (?, ?, ?, ?) or `users`.`id` not in (?, ?)',
      mssql: 'select * from [users] inner join [contacts] on [users].[id] = [contacts].[id] and [contacts].[id] not in (?, ?, ?, ?) or [users].[id] not in (?, ?)',
      postgres: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not in (?, ?, ?, ?) or "users"."id" not in (?, ?)',
      oracledb: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not in (?, ?, ?, ?) or "users"."id" not in (?, ?)',
      oracle: 'select * from "users" inner join "contacts" on "users"."id" = "contacts"."id" and "contacts"."id" not in (?, ?, ?, ?) or "users"."id" not in (?, ?)'
    });
  });

  it("raw expressions in select", function() {
    testsql(qb().select(raw('substr(foo, 6)')).from('users'), {
      mysql: {
        sql: 'select substr(foo, 6) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select substr(foo, 6) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select substr(foo, 6) from "users"',
        bindings: []
      }
    });
  });

  it("count", function() {
    testsql(qb().from('users').count(), {
      mysql: {
        sql: 'select count(*) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select count(*) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select count(*) from "users"',
        bindings: []
      }
    });
  });

  it("count distinct", function() {
    testsql(qb().from('users').countDistinct(), {
      mysql: {
        sql: 'select count(distinct *) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select count(distinct *) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select count(distinct *) from "users"',
        bindings: []
      }
    });
  });

  it("count with alias", function() {
    testsql(qb().from('users').count('* as all'), {
      mysql: {
        sql: 'select count(*) as `all` from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select count(*) as [all] from [users]',
        bindings: []
      },
      oracle: {
        sql: 'select count(*) "all" from "users"',
        bindings: []
      },
      oracledb: {
        sql: 'select count(*) "all" from "users"',
        bindings: []
      },
      postgres: {
        sql: 'select count(*) as "all" from "users"',
        bindings: []
      }
    });
  });

  it("count distinct with alias", function() {
    testsql(qb().from('users').countDistinct('* as all'), {
      mysql: {
        sql: 'select count(distinct *) as `all` from `users`',
        bindings: []
      },
      oracle: {
        sql: 'select count(distinct *) "all" from "users"',
        bindings: []
      },
      mssql: {
        sql: 'select count(distinct *) as [all] from [users]',
        bindings: []
      },
      oracledb: {
        sql: 'select count(distinct *) "all" from "users"',
        bindings: []
      },
      postgres: {
        sql: 'select count(distinct *) as "all" from "users"',
        bindings: []
      }
    });
  });

  it("max", function() {
    testsql(qb().from('users').max('id'), {
      mysql: {
        sql: 'select max(`id`) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select max([id]) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select max("id") from "users"',
        bindings: []
      }
    });
  });

  it("min", function() {
    testsql(qb().from('users').max('id'), {
      mysql: {
        sql: 'select max(`id`) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select max([id]) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select max("id") from "users"',
        bindings: []
      }
    });
  });

  it("sum", function() {
    testsql(qb().from('users').sum('id'), {
      mysql: {
        sql: 'select sum(`id`) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select sum([id]) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select sum("id") from "users"',
        bindings: []
      }
    });
  });

  it("sum distinct", function() {
    testsql(qb().from('users').sumDistinct('id'), {
      mysql: {
        sql: 'select sum(distinct `id`) from `users`',
        bindings: []
      },
      mssql: {
        sql: 'select sum(distinct [id]) from [users]',
        bindings: []
      },
      postgres: {
        sql: 'select sum(distinct "id") from "users"',
        bindings: []
      }
    });
  });

  it("insert method", function() {
    testsql(qb().into('users').insert({'email': 'foo'}), {
      mysql: {
        sql: 'insert into `users` (`email`) values (?)',
        bindings: ['foo']
      },
      mssql: {
        sql: 'insert into [users] ([email]) values (?)',
        bindings: ['foo']
      },
      postgres: {
        sql: 'insert into "users" ("email") values (?)',
        bindings: ['foo']
      }
    });
  });

  it("multiple inserts", function() {
    testsql(qb().from('users').insert([{email: 'foo', name: 'taylor'}, {email: 'bar', name: 'dayle'}]), {
      mysql: {
        sql: 'insert into `users` (`email`, `name`) values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      sqlite3: {
        sql: 'insert into "users" ("email", "name") select ? as "email", ? as "name" union all select ? as "email", ? as "name"',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      oracle: {
        sql: 'begin execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using ?, ?; execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using ?, ?;end;',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      mssql: {
        sql: 'insert into [users] ([email], [name]) values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      oracledb: {
        sql: 'begin execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using ?, ?; execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using ?, ?;end;',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      postgres: {
        sql: 'insert into "users" ("email", "name") values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      }
    });
  });

  it("multiple inserts with partly undefined keys client with configuration nullAsDefault: true", function() {
    testquery(qb().from('users').insert([{email: 'foo', name: 'taylor'}, {name: 'dayle'}]), {
      mysql: "insert into `users` (`email`, `name`) values ('foo', 'taylor'), (NULL, 'dayle')",
      sqlite3: 'insert into "users" ("email", "name") select \'foo\' as "email", \'taylor\' as "name" union all select NULL as "email", \'dayle\' as "name"',
      oracle: 'begin execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using \'foo\', \'taylor\'; execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using NULL, \'dayle\';end;',
      mssql: "insert into [users] ([email], [name]) values ('foo', 'taylor'), (NULL, 'dayle')",
      oracledb: 'begin execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using \'foo\', \'taylor\'; execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using NULL, \'dayle\';end;',
      postgres: 'insert into "users" ("email", "name") values (\'foo\', \'taylor\'), (NULL, \'dayle\')'
    }, clientsWithNullAsDefault);
  });

  it("multiple inserts with partly undefined keys", function() {
    testquery(qb().from('users').insert([{email: 'foo', name: 'taylor'}, {name: 'dayle'}]), {
      mysql: "insert into `users` (`email`, `name`) values ('foo', 'taylor'), (DEFAULT, 'dayle')",
      oracle: 'begin execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using \'foo\', \'taylor\'; execute immediate \'insert into "users" ("email", "name") values (DEFAULT, :1)\' using \'dayle\';end;',
      mssql: "insert into [users] ([email], [name]) values ('foo', 'taylor'), (DEFAULT, 'dayle')",
      oracledb: 'begin execute immediate \'insert into "users" ("email", "name") values (:1, :2)\' using \'foo\', \'taylor\'; execute immediate \'insert into "users" ("email", "name") values (DEFAULT, :1)\' using \'dayle\';end;',
      postgres: 'insert into "users" ("email", "name") values (\'foo\', \'taylor\'), (DEFAULT, \'dayle\')'
    });
  });

  it("multiple inserts with partly undefined keys throw error with sqlite", function() {
    expect(function () {
      testquery(qb().from('users').insert([{email: 'foo', name: 'taylor'}, {name: 'dayle'}]), {
        sqlite3: ""
      });
    }).to.throw(TypeError)
  });

  it("multiple inserts with returning", function() {
    // returning only supported directly by postgres and with workaround with oracle
    // other databases implicitly return the inserted id
    testsql(qb().from('users').insert([{email: 'foo', name: 'taylor'}, {email: 'bar', name: 'dayle'}], 'id'), {
      mysql: {
        sql: 'insert into `users` (`email`, `name`) values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      sqlite3: {
        sql: "insert into \"users\" (\"email\", \"name\") select ? as \"email\", ? as \"name\" union all select ? as \"email\", ? as \"name\"",
      },
      postgres: {
        sql: "insert into \"users\" (\"email\", \"name\") values (?, ?), (?, ?) returning \"id\"",
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      oracle: {
        sql: "begin execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning ROWID into :3' using ?, ?, out ?; execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning ROWID into :3' using ?, ?, out ?;end;",
        bindings: function(bindings) {
          expect(bindings.length).to.equal(6);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1]).to.equal('taylor');
          expect(bindings[2].toString()).to.equal('[object ReturningHelper:id]');
          expect(bindings[3]).to.equal('bar');
          expect(bindings[4]).to.equal('dayle');
          expect(bindings[5].toString()).to.equal('[object ReturningHelper:id]');
        }
      },
      mssql: {
        sql: 'insert into [users] ([email], [name]) output inserted.[id] values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      oracledb: {
        sql: "begin execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning \"id\" into :3' using ?, ?, out ?; execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning \"id\" into :3' using ?, ?, out ?;end;",
        bindings: function(bindings) {
          expect(bindings.length).to.equal(6);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1]).to.equal('taylor');
          expect(bindings[2].toString()).to.equal('[object ReturningHelper:id]');
          expect(bindings[3]).to.equal('bar');
          expect(bindings[4]).to.equal('dayle');
          expect(bindings[5].toString()).to.equal('[object ReturningHelper:id]');
        }
      },
    });
  });

  it("multiple inserts with multiple returning", function() {
    testsql(qb().from('users').insert([{email: 'foo', name: 'taylor'}, {email: 'bar', name: 'dayle'}], ['id', 'name']), {
      mysql: {
        sql: 'insert into `users` (`email`, `name`) values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      sqlite3: {
        sql: "insert into \"users\" (\"email\", \"name\") select ? as \"email\", ? as \"name\" union all select ? as \"email\", ? as \"name\"",
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      postgres: {
        sql: 'insert into "users" ("email", "name") values (?, ?), (?, ?) returning "id", "name"',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      oracle: {
        sql: "begin execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning ROWID into :3' using ?, ?, out ?; execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning ROWID into :3' using ?, ?, out ?;end;",
        bindings: function (bindings) {
          expect(bindings.length).to.equal(6);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1]).to.equal('taylor');
          expect(bindings[2].toString()).to.equal('[object ReturningHelper:id:name]');
          expect(bindings[3]).to.equal('bar');
          expect(bindings[4]).to.equal('dayle');
          expect(bindings[5].toString()).to.equal('[object ReturningHelper:id:name]');
        }
      },
      mssql: {
        sql: 'insert into [users] ([email], [name]) output inserted.[id], inserted.[name] values (?, ?), (?, ?)',
        bindings: ['foo', 'taylor', 'bar', 'dayle']
      },
      oracledb: {
        sql: "begin execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning \"id\",\"name\" into :3, :4' using ?, ?, out ?, out ?; execute immediate 'insert into \"users\" (\"email\", \"name\") values (:1, :2) returning \"id\",\"name\" into :3, :4' using ?, ?, out ?, out ?;end;",
        bindings: function (bindings) {
          expect(bindings.length).to.equal(8);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1]).to.equal('taylor');
          expect(bindings[2].toString()).to.equal('[object ReturningHelper:id]');
          expect(bindings[3].toString()).to.equal('[object ReturningHelper:name]');
          expect(bindings[4]).to.equal('bar');
          expect(bindings[5]).to.equal('dayle');
          expect(bindings[6].toString()).to.equal('[object ReturningHelper:id]');
          expect(bindings[7].toString()).to.equal('[object ReturningHelper:name]');
        }
      },
    });
  });

  it("insert method respects raw bindings", function() {
    testsql(qb().insert({'email': raw('CURRENT TIMESTAMP')}).into('users'), {
      mysql: {
        sql: 'insert into `users` (`email`) values (CURRENT TIMESTAMP)',
        bindings: []
      },
      mssql: {
        sql: 'insert into [users] ([email]) values (CURRENT TIMESTAMP)',
        bindings: []
      },
      postgres: {
        sql: 'insert into "users" ("email") values (CURRENT TIMESTAMP)',
        bindings: []
      }
    });
  });

  it("normalizes for missing keys in insert", function() {
    var data = [{a: 1}, {b: 2}, {a: 2, c: 3}];

    //This is done because sqlite3 does not support valueForUndefined, and can't manipulate testsql to use 'clientsWithUseNullForUndefined'.
    //But we still want to make sure that when `useNullAsDefault` is explicitly defined, that the query still works as expected. (Bindings being undefined)
    //It's reset at the end of the test.
    var previousValuesForUndefinedSqlite3 = clients.sqlite3.valueForUndefined;
    clients.sqlite3.valueForUndefined = null;

    testsql(qb().insert(data).into('table'), {
      mysql: {
        sql: 'insert into `table` (`a`, `b`, `c`) values (?, DEFAULT, DEFAULT), (DEFAULT, ?, DEFAULT), (?, DEFAULT, ?)',
        bindings: [1, 2, 2, 3]
      },
      sqlite3: {
        sql: 'insert into "table" ("a", "b", "c") select ? as "a", ? as "b", ? as "c" union all select ? as "a", ? as "b", ? as "c" union all select ? as "a", ? as "b", ? as "c"',
        bindings: [1, undefined, undefined, undefined, 2, undefined, 2, undefined, 3]
      },
      oracle: {
        sql: "begin execute immediate 'insert into \"table\" (\"a\", \"b\", \"c\") values (:1, DEFAULT, DEFAULT)' using ?; execute immediate 'insert into \"table\" (\"a\", \"b\", \"c\") values (DEFAULT, :1, DEFAULT)' using ?; execute immediate 'insert into \"table\" (\"a\", \"b\", \"c\") values (:1, DEFAULT, :2)' using ?, ?;end;",
        bindings: [1, 2, 2, 3]
      },
      mssql: {
        sql: 'insert into [table] ([a], [b], [c]) values (?, DEFAULT, DEFAULT), (DEFAULT, ?, DEFAULT), (?, DEFAULT, ?)',
        bindings: [1, 2, 2, 3]
      },
      oracledb: {
        sql: "begin execute immediate 'insert into \"table\" (\"a\", \"b\", \"c\") values (:1, DEFAULT, DEFAULT)' using ?; execute immediate 'insert into \"table\" (\"a\", \"b\", \"c\") values (DEFAULT, :1, DEFAULT)' using ?; execute immediate 'insert into \"table\" (\"a\", \"b\", \"c\") values (:1, DEFAULT, :2)' using ?, ?;end;",
        bindings: [1, 2, 2, 3]
      },
      postgres: {
        sql: 'insert into "table" ("a", "b", "c") values (?, DEFAULT, DEFAULT), (DEFAULT, ?, DEFAULT), (?, DEFAULT, ?)',
        bindings: [1, 2, 2, 3]
      }
    });
    clients.sqlite3.valueForUndefined = previousValuesForUndefinedSqlite3;
  });

  it("empty insert should be a noop", function() {
    testsql(qb().into('users').insert(), {
      mysql: {
        sql: '',
        bindings: []
      },
      oracle: {
        sql: '',
        bindings: []
      },
      mssql: {
        sql: '',
        bindings: []
      },
      oracledb: {
        sql: '',
        bindings: []
      },
      postgres: {
        sql: '',
        bindings: []
      }
    });
  });

  it("insert with empty array should be a noop", function() {
    testsql(qb().into('users').insert([]), {
      mysql: {
        sql: '',
        bindings: []
      },
      oracle: {
        sql: '',
        bindings: []
      },
      mssql: {
        sql: '',
        bindings: []
      },
      oracledb: {
        sql: '',
        bindings: []
      },
      postgres: {
        sql: '',
        bindings: []
      }
    });
  });

  it("insert with array with empty object and returning", function() {
    testsql(qb().into('users').insert([{}], 'id'), {
      mysql: {
        sql: 'insert into `users` () values ()',
        bindings: []
      },
      sqlite3: {
        sql: 'insert into "users" default values',
        bindings: []
      },
      postgres: {
        sql: 'insert into "users" default values returning "id"',
        bindings: []
      },
      oracle: {
        sql: "insert into \"users\" (\"id\") values (default) returning ROWID into ?",
        bindings: function (bindings) {
          expect(bindings.length).to.equal(1);
          expect(bindings[0].toString()).to.equal('[object ReturningHelper:id]');
        }
      },
      mssql: {
        sql: 'insert into [users] output inserted.[id] default values',
        bindings: []
      },
      oracledb: {
        sql: "insert into \"users\" (\"id\") values (default) returning \"id\" into ?",
        bindings: function (bindings) {
          expect(bindings.length).to.equal(1);
          expect(bindings[0].toString()).to.equal('[object ReturningHelper:id]');
        }
      },
    });
  });

  // it("insert with array with null value and returning is a noop", function() {
  //   testsql(qb().into('users').insert([null], 'id'), {
  //     mysql: {
  //       sql: '',
  //       bindings: []
  //     },
  //     sqlite3: {
  //       sql: '',
  //       bindings: []
  //     },
  //     postgres: {
  //       sql: '',
  //       bindings: []
  //     },
  //     oracle: {
  //       sql: "",
  //       bindings: []
  //     },
  //     mssql: {
  //       sql: '',
  //       bindings: []
  //     },
  //     oracledb: {
  //       sql: "",
  //       bindings: []
  //     },
  //     postgres: {
  //       sql: '',
  //       bindings: []
  //     }
  //   });
  // });

  // it("insert with array of multiple null values is a noop", function() {
  //   testsql(qb().into('users').insert([null, null]), {
  //     mysql: {
  //       sql: '',
  //       bindings: []
  //     },
  //     sqlite3: {
  //       sql: '',
  //       bindings: []
  //     },
  //     oracle: {
  //       sql: "",
  //       bindings: []
  //     },
  //     oracledb: {
  //       sql: "",
  //       bindings: []
  //     },
  //     postgres: {
  //       sql: "",
  //       bindings: []
  //     },
  //     mssql: {
  //       sql: '',
  //       bindings: []
  //     },
  //     postgres: {
  //       sql: '',
  //       bindings: []
  //     }
  //   });
  // });

  it("update method", function() {
    testsql(qb().update({'email': 'foo', 'name': 'bar'}).table('users').where('id', '=', 1), {
      mysql: {
        sql: 'update `users` set `email` = ?, `name` = ? where `id` = ?',
        bindings: ['foo', 'bar', 1]
      },
      mssql: {
        sql: 'update [users] set [email] = ?, [name] = ? where [id] = ?;select @@rowcount',
        bindings: ['foo', 'bar', 1]
      },
      postgres: {
        sql: 'update "users" set "email" = ?, "name" = ? where "id" = ?',
        bindings: ['foo', 'bar', 1]
      }
    });
  });

  it("update only method", function() {
    testsql(qb().update({'email': 'foo', 'name': 'bar'}).table('users', { only: true }).where('id', '=', 1), {
      postgres: {
        sql: 'update only "users" set "email" = ?, "name" = ? where "id" = ?',
        bindings: ['foo', 'bar', 1]
      }
    });
  });

  it("should not update columns undefined values", function() {
    testsql(qb().update({'email': 'foo', 'name': undefined}).table('users').where('id', '=', 1), {
      mysql: {
        sql: 'update `users` set `email` = ? where `id` = ?',
        bindings: ['foo', 1]
      },
      postgres: {
        sql: 'update "users" set "email" = ? where "id" = ?',
        bindings: ['foo', 1]
      }
    });
  });

  it("should allow for 'null' updates", function() {
    testsql(qb().update({email: null, 'name': 'bar'}).table('users').where('id', 1), {
      mysql: {
        sql: 'update `users` set `email` = ?, `name` = ? where `id` = ?',
        bindings: [null, 'bar', 1]
      },
      mssql: {
        sql: 'update [users] set [email] = ?, [name] = ? where [id] = ?;select @@rowcount',
        bindings: [null, 'bar', 1]
      },
      postgres: {
        sql: 'update "users" set "email" = ?, "name" = ? where "id" = ?',
        bindings: [null, 'bar', 1]
      }
    });
  });

  it("order by, limit", function() {
    // update with limit works only with mysql and derrivates
    testsql(qb().from('users').where('id', '=', 1).orderBy('foo', 'desc').limit(5).update({email: 'foo', name: 'bar'}), {
      mysql: {
        sql: 'update `users` set `email` = ?, `name` = ? where `id` = ? order by `foo` desc limit ?',
        bindings: ['foo', 'bar', 1, 5]
      },
      mssql: {
        sql: 'update top (?) [users] set [email] = ?, [name] = ? where [id] = ? order by [foo] desc;select @@rowcount',
        bindings: ['foo', 'bar', 1, 5]
      },
      postgres: {
        sql: 'update "users" set "email" = ?, "name" = ? where "id" = ?',
        bindings: ['foo', 'bar', 1]
      }
    });
  });

  it("update method with joins mysql", function() {
    testsql(qb().from('users').join('orders', 'users.id', 'orders.user_id').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'}), {
      mysql: {
        sql: 'update `users` inner join `orders` on `users`.`id` = `orders`.`user_id` set `email` = ?, `name` = ? where `users`.`id` = ?',
        bindings: ['foo', 'bar', 1]
      },
      mssql: {
        sql: 'update [users] set [email] = ?, [name] = ? from [users] inner join [orders] on [users].[id] = [orders].[user_id] where [users].[id] = ?;select @@rowcount',
        bindings: ['foo', 'bar', 1]
      },
      postgres: {
        sql: "update \"users\" set \"email\" = ?, \"name\" = ? where \"users\".\"id\" = ?",
        bindings: ['foo', 'bar', 1]
      },
    });
  });

  it("update method with limit mysql", function() {
    // limit works only with mysql or derrivates
    testsql(qb().from('users').where('users.id', '=', 1).update({'email': 'foo', 'name': 'bar'}).limit(1), {
      mysql: {
        sql: 'update `users` set `email` = ?, `name` = ? where `users`.`id` = ? limit ?',
        bindings: ['foo', 'bar', 1, 1]
      },
      mssql: {
        sql: 'update top (?) [users] set [email] = ?, [name] = ? where [users].[id] = ?;select @@rowcount',
        bindings: ['foo', 'bar', 1, 1]
      },
      postgres: {
        sql: 'update "users" set "email" = ?, "name" = ? where "users"."id" = ?',
        bindings: ['foo', 'bar', 1]
      }
    });
  });

  it("update method without joins on postgres", function() {
    testsql(qb().from('users').where('id', '=', 1).update({email: 'foo', name: 'bar'}), {
      mysql: {
        sql: 'update `users` set `email` = ?, `name` = ? where `id` = ?',
        bindings: ['foo', 'bar', 1]
      },
      mssql: {
        sql: 'update [users] set [email] = ?, [name] = ? where [id] = ?;select @@rowcount',
        bindings: ['foo', 'bar', 1]
      },
      postgres: {
        sql: 'update "users" set "email" = ?, "name" = ? where "id" = ?',
        bindings: ['foo', 'bar', 1]
      }
    });
  });

  it("update method with returning on oracle", function() {
    testsql(qb().from('users').where('id', '=', 1).update({email: 'foo', name: 'bar'}, '*'), {
      oracle: {
        sql: 'update "users" set "email" = ?, "name" = ? where "id" = ? returning ROWID into ?',
        bindings: function(bindings) {
          expect(bindings.length).to.equal(4);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1]).to.equal('bar');
          expect(bindings[2]).to.equal(1);
          expect(bindings[3].toString()).to.equal('[object ReturningHelper:*]');
        }
      }
    });
  });

  // TODO:
  // it("update method with joins on postgres", function() {
  //   chain = qb().from('users').join('orders', 'users.id', '=', 'orders.user_id').where('users.id', '=', 1).update({email: 'foo', name: 'bar'}).toSQL();
  //   expect(chain.sql).to.equal('update "users" set "email" = ?, "name" = ? from "orders" where "users"."id" = ? and "users"."id" = "orders"."user_id"');
  //   expect(chain.sql).to.eql(['foo', 'bar', 1]);
  // });

  it("update method respects raw", function() {
    testsql(qb().from('users').where('id', '=', 1).update({email: raw('foo'), name: 'bar'}), {
      mysql: {
        sql: 'update `users` set `email` = foo, `name` = ? where `id` = ?',
        bindings: ['bar', 1]
      },
      mssql: {
        sql: 'update [users] set [email] = foo, [name] = ? where [id] = ?;select @@rowcount',
        bindings: ['bar', 1]
      },
      postgres: {
        sql: 'update "users" set "email" = foo, "name" = ? where "id" = ?',
        bindings: ['bar', 1]
      }
    });
  });

  it("delete method", function() {
    testsql(qb().from('users').where('email', '=', 'foo').delete(), {
      mysql: {
        sql: 'delete from `users` where `email` = ?',
        bindings: ['foo']
      },
      mssql: {
        sql: 'delete from [users] where [email] = ?;select @@rowcount',
        bindings: ['foo']
      },
      postgres: {
        sql: 'delete from "users" where "email" = ?',
        bindings: ['foo']
      }
    });
  });

  it("delete only method", function() {
    testsql(qb().from('users', { only: true }).where('email', '=', 'foo').delete(), {
      postgres: {
        sql: 'delete from only "users" where "email" = ?',
        bindings: ['foo']
      }
    });
  });

  it("truncate method", function() {
    testsql(qb().table('users').truncate(), {
      mysql: {
        sql: 'truncate `users`',
        bindings: []
      },
      sqlite3: {
        sql: 'delete from "users"',
        bindings: [],
        output: function (output) {
          expect(typeof output).to.equal('function');
        }
      },
      postgres: {
        sql: 'truncate "users" restart identity',
        bindings: []
      },
      oracle: {
        sql: 'truncate table "users"',
        bindings: []
      },
      mssql: {
        sql: 'truncate table [users]',
        bindings: []
      },
      oracledb: {
        sql: 'truncate table "users"',
        bindings: []
      },
    });
  });

  it("insert get id", function() {
    testsql(qb().from('users').insert({email: 'foo'}, 'id'), {
      mysql: {
        sql: 'insert into `users` (`email`) values (?)',
        bindings: ['foo']
      },
      postgres: {
        sql: 'insert into "users" ("email") values (?) returning "id"',
        bindings: ['foo']
      },
      oracle: {
        sql: 'insert into "users" ("email") values (?) returning ROWID into ?',
        bindings: function (bindings) {
          expect(bindings.length).to.equal(2);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1].toString()).to.equal('[object ReturningHelper:id]');
        }
      },
      mssql: {
        sql: 'insert into [users] ([email]) output inserted.[id] values (?)',
        bindings: ['foo']
      },
      oracledb: {
        sql: 'insert into "users" ("email") values (?) returning \"id\" into ?',
        bindings: function (bindings) {
          expect(bindings.length).to.equal(2);
          expect(bindings[0]).to.equal('foo');
          expect(bindings[1].toString()).to.equal('[object ReturningHelper:id]');
        }
      },
    });
  });

  it("wrapping", function() {
    testsql(qb().select('*').from('users'), {
      mysql: 'select * from `users`',
      mssql: 'select * from [users]',
      postgres: 'select * from "users"'
    });
  });

  it("order by desc", function() {
    testsql(qb().select('*').from('users').orderBy('email', 'desc'), {
      mysql: 'select * from `users` order by `email` desc',
      mssql: 'select * from [users] order by [email] desc',
      postgres: 'select * from "users" order by "email" desc'
    });
  });

  it("providing null or false as second parameter builds correctly", function() {
    testsql(qb().select('*').from('users').where('foo', null), {
      mysql: 'select * from `users` where `foo` is null',
      mssql: 'select * from [users] where [foo] is null',
      postgres: 'select * from "users" where "foo" is null'
    });
  });

  // it("lock for update", function (){
  //   testsql(tb().select('*').from('foo').where('bar', '=', 'baz').forUpdate(), {
  //     mysql: {
  //       sql: 'select * from `foo` where `bar` = ? for update',
  //       bindings: ['baz']
  //     },
  //     postgres: {
  //       sql: 'select * from "foo" where "bar" = ? for update',
  //       bindings: ['baz']
  //     },
  //     oracle: {
  //       sql: 'select * from "foo" where "bar" = ? for update',
  //       bindings: ['baz']
  //     },
  //     mssql: {
  //       sql: 'select * from [foo] where [bar] = ? with (READCOMMITTEDLOCK)',
  //       bindings: ['baz']
  //     },
  //     oracledb: {
  //       sql: 'select * from "foo" where "bar" = ? for update',
  //       bindings: ['baz']
  //     },
  //     postgres: {
  //       sql: 'select * from "foo" where "bar" = ?',
  //       bindings: ['baz']
  //     }
  //   });
  // });

  // it("lock in share mode", function() {
  //   testsql(qb().transacting({}).select('*').from('foo').where('bar', '=', 'baz').forShare(), {
  //     mysql: {
  //       sql: 'select * from `foo` where `bar` = ? lock in share mode',
  //       bindings: ['baz']
  //     },
  //     postgres: {
  //       sql: "select * from \"foo\" where \"bar\" = ? for share",
  //       bindings: ['baz']
  //     },
  //     mssql: {
  //       sql: 'select * from [foo] where [bar] = ? with (NOLOCK)',
  //       bindings: ['baz']
  //     },
  //     postgres: {
  //       sql: 'select * from "foo" where "bar" = ?',
  //       bindings: ['baz']
  //     }
  //   });
  // });

  it("should warn when trying to use forUpdate outside of a transaction", function() {
    testsql(qb().select('*').from('foo').where('bar', '=', 'baz').forUpdate(), {
      mysql: {
        sql: 'select * from `foo` where `bar` = ?',
        bindings: ['baz']
      },
      mssql: {
        sql: 'select * from [foo] where [bar] = ?',
        bindings: ['baz']
      },
      postgres: {
        sql: 'select * from "foo" where "bar" = ?',
        bindings: ['baz']
      }
    });
  });

  it('allows insert values of sub-select, #121', function() {
    testsql(qb().table('entries').insert({
      secret: 123,
      sequence: qb().count('*').from('entries').where('secret', 123)
    }), {
      mysql: {
        sql: 'insert into `entries` (`secret`, `sequence`) values (?, (select count(*) from `entries` where `secret` = ?))',
        bindings: [123, 123]
      },
      mssql: {
        sql: 'insert into [entries] ([secret], [sequence]) values (?, (select count(*) from [entries] where [secret] = ?))',
        bindings: [123, 123]
      },
      postgres: {
        sql: 'insert into "entries" ("secret", "sequence") values (?, (select count(*) from "entries" where "secret" = ?))',
        bindings: [123, 123]
      }
    });
  });

  it('allows left outer join with raw values', function() {
    testsql(qb().select('*').from('student').leftOuterJoin('student_languages', function() {
      this.on('student.id', 'student_languages.student_id').andOn('student_languages.code', raw('?', 'en_US'));
    }), {
      mysql: {
        sql: 'select * from `student` left outer join `student_languages` on `student`.`id` = `student_languages`.`student_id` and `student_languages`.`code` = ?',
        bindings: ['en_US']
      },
      mssql: {
        sql: 'select * from [student] left outer join [student_languages] on [student].[id] = [student_languages].[student_id] and [student_languages].[code] = ?',
        bindings: ['en_US']
      },
      postgres: {
        sql: 'select * from "student" left outer join "student_languages" on "student"."id" = "student_languages"."student_id" and "student_languages"."code" = ?',
        bindings: ['en_US']
      }
    });
  });

  it('should not break with null call #182', function() {
    testsql(qb().from('test').limit(null).offset(null), {
      mysql: {
        sql: 'select * from `test`',
        bindings: []
      },
      mssql: {
        sql: 'select * from [test]',
        bindings: []
      },
      postgres: {
        sql: 'select * from "test"',
        bindings: []
      }
    });
  });

  it('allows passing builder into where clause, #162', function() {
    var chain = qb().from('chapter').select('id').where('book', 1);
    var page = qb().from('page').select('id').whereIn('chapter_id', chain);
    var word = qb().from('word').select('id').whereIn('page_id', page);
    var three = chain.clone().del();
    var two = page.clone().del();
    var one = word.clone().del();

    testsql(one, {
      mysql: {
        sql: 'delete from `word` where `page_id` in (select `id` from `page` where `chapter_id` in (select `id` from `chapter` where `book` = ?))',
        bindings: [1]
      },
      mssql: {
        sql: 'delete from [word] where [page_id] in (select [id] from [page] where [chapter_id] in (select [id] from [chapter] where [book] = ?));select @@rowcount',
        bindings: [1]
      },
      postgres: {
        sql: 'delete from "word" where "page_id" in (select "id" from "page" where "chapter_id" in (select "id" from "chapter" where "book" = ?))',
        bindings: [1]
      }
    });

    testsql(two, {
      mysql: {
        sql: 'delete from `page` where `chapter_id` in (select `id` from `chapter` where `book` = ?)',
        bindings: [1]
      },
      mssql: {
        sql: 'delete from [page] where [chapter_id] in (select [id] from [chapter] where [book] = ?);select @@rowcount',
        bindings: [1]
      },
      postgres: {
        sql: 'delete from "page" where "chapter_id" in (select "id" from "chapter" where "book" = ?)',
        bindings: [1]
      }
    });

    testsql(three, {
      mysql: {
        sql: 'delete from `chapter` where `book` = ?',
        bindings: [1]
      },
      mssql: {
        sql: 'delete from [chapter] where [book] = ?;select @@rowcount',
        bindings: [1]
      },
      postgres: {
        sql: 'delete from "chapter" where "book" = ?',
        bindings: [1]
      }
    });
  });

  it('allows specifying the columns and the query for insert, #211', function() {
    var id = 1;
    var email = 'foo@bar.com';
    testsql(qb().into(raw('recipients (recipient_id, email)')).insert(
      qb().select(raw('?, ?', [id, email])).whereNotExists(function() {
        this.select(1).from('recipients').where('recipient_id', id);
      })), {
      mysql: {
        sql: 'insert into recipients (recipient_id, email) select ?, ? where not exists (select 1 from `recipients` where `recipient_id` = ?)',
        bindings: [1, 'foo@bar.com', 1]
      },
      mssql: {
        sql: 'insert into recipients (recipient_id, email) select ?, ? where not exists (select 1 from [recipients] where [recipient_id] = ?)',
        bindings: [1, 'foo@bar.com', 1]
      },
      postgres: {
        sql: 'insert into recipients (recipient_id, email) select ?, ? where not exists (select 1 from "recipients" where "recipient_id" = ?)',
        bindings: [1, 'foo@bar.com', 1]
      }
    });
  });

  it('does an update with join on mysql, #191', function() {
    var setObj = {'tblPerson.City': 'Boonesville'};
    var query = qb().table('tblPerson').update(setObj)
      .join('tblPersonData', 'tblPersonData.PersonId', '=', 'tblPerson.PersonId')
      .where('tblPersonData.DataId', 1)
      .where('tblPerson.PersonId', 5 );

    testsql(query, {
      mysql: {
        sql: 'update `tblPerson` inner join `tblPersonData` on `tblPersonData`.`PersonId` = `tblPerson`.`PersonId` set `tblPerson`.`City` = ? where `tblPersonData`.`DataId` = ? and `tblPerson`.`PersonId` = ?',
        bindings: ['Boonesville', 1, 5]
      },
      mssql: {
        sql: 'update [tblPerson] set [tblPerson].[City] = ? from [tblPerson] inner join [tblPersonData] on [tblPersonData].[PersonId] = [tblPerson].[PersonId] where [tblPersonData].[DataId] = ? and [tblPerson].[PersonId] = ?;select @@rowcount',
        bindings: ['Boonesville', 1, 5]
      },
      postgres: {
        sql: 'update "tblPerson" set "tblPerson"."City" = ? where "tblPersonData"."DataId" = ? and "tblPerson"."PersonId" = ?',
        bindings: ['Boonesville', 1, 5]
      }
    });
  });

  it('does crazy advanced inserts with clever raw use, #211', function() {
    var q1 = qb().select(raw("'user'"), raw("'user@foo.com'")).whereNotExists(function() {
      this.select(1).from('recipients').where('recipient_id', 1);
    })
    var q2 = qb().table('recipients').insert(raw('(recipient_id, email) ?', [q1]));

    testsql(q2, {
      // mysql: {
      //   sql: 'insert into `recipients` (recipient_id, email) select \'user\', \'user@foo.com\' where not exists (select 1 from `recipients` where `recipient_id` = ?)',
      //   bindings: [1]
      // },
      // mssql: {
      //   sql: 'insert into [recipients] (recipient_id, email) select \'user\', \'user@foo.com\' where not exists (select 1 from [recipients] where [recipient_id] = ?)',
      //   bindings: [1]
      // },
      postgres: {
        sql: 'insert into "recipients" (recipient_id, email) (select \'user\', \'user@foo.com\' where not exists (select 1 from "recipients" where "recipient_id" = ?))',
        bindings: [1]
      }
    });
  });

  it('supports capitalized operators', function() {
    testsql(qb().select('*').from('users').where('name', 'LIKE', '%test%'), {
      mysql: {
        sql: 'select * from `users` where `name` LIKE ?',
        bindings: ['%test%']
      },
      mssql: {
        sql: 'select * from [users] where [name] LIKE ?',
        bindings: ['%test%']
      },
      postgres: {
        sql: 'select * from "users" where "name" LIKE ?',
        bindings: ['%test%']
      }
    });
  });

  it('supports POSIX regex operators in Postgres', function() {
    testsql(qb().select('*').from('users').where('name', '~', '.*test.*'), {
      postgres: {
        sql: 'select * from "users" where "name" ~ ?',
        bindings: ['.*test.*']
      }
    });
  });

  it('throws if you try to use an invalid operator', function() {
    expect(function () {
      qb().select('*').where('id', 'isnt', 1).toString();
    })
    .to.throw("The operator \"isnt\" is not permitted");
  });

  it('throws if you try to use an invalid operator in an inserted statement', function() {
    var obj = qb().select('*').where('id', 'isnt', 1);
    expect(function () {
      qb().select('*').from('users').where('id', 'in', obj).toString();
    })
    .to.throw("The operator \"isnt\" is not permitted");
  });

  it("#287 - wraps correctly for arrays", function() {
    // arrays only work for postgres
    testsql(qb().select('*').from('value').join('table', 'table.array_column[1]', '=', raw('?', 1)), {
      mysql: {
        sql: 'select * from `value` inner join `table` on `table`.`array_column[1]` = ?',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [value] inner join [table] on [table].[array_column[1]] = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "value" inner join "table" on "table"."array_column"[1] = ?',
        bindings: [1]
      },
    });
  });

  it('allows wrap on raw to wrap in parens and alias', function() {
    testsql(qb().select(
      'e.lastname',
      'e.salary',
      raw(
        qb().select('avg(salary)').from('employee').whereRaw('dept_no = e.dept_no')
      ).wrap('(', ') avg_sal_dept')
    ).from('employee as e')
    .where('dept_no', '=', 'e.dept_no'), {
      // mysql: {
      //   sql: 'select `e`.`lastname`, `e`.`salary`, (select `avg(salary)` from `employee` where dept_no = e.dept_no) avg_sal_dept from `employee` as `e` where `dept_no` = ?',
      //   bindings: ['e.dept_no']
      // },
      oracle: {
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) avg_sal_dept from "employee" "e" where "dept_no" = ?',
        bindings: ['e.dept_no']
      },
      // mssql: {
      //   sql: 'select [e].[lastname], [e].[salary], (select [avg(salary)] from [employee] where dept_no = e.dept_no) avg_sal_dept from [employee] as [e] where [dept_no] = ?',
      //   bindings: ['e.dept_no']
      // },
      oracledb: {
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) avg_sal_dept from "employee" "e" where "dept_no" = ?',
        bindings: ['e.dept_no']
      },
      postgres: {
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) avg_sal_dept from "employee" as "e" where "dept_no" = ?',
        bindings: ['e.dept_no']
      }
    });
  });

  it('allows select as syntax', function() {
    testsql(qb().select(
      'e.lastname',
      'e.salary',
      qb().select('avg(salary)').from('employee').whereRaw('dept_no = e.dept_no').as('avg_sal_dept')
    ).from('employee as e')
    .where('dept_no', '=', 'e.dept_no'), {
      mysql: {
        sql: 'select `e`.`lastname`, `e`.`salary`, (select `avg(salary)` from `employee` where dept_no = e.dept_no) as `avg_sal_dept` from `employee` as `e` where `dept_no` = ?',
        bindings: ["e.dept_no"]
      },
      oracle: {
        // TODO: Check if possible
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) "avg_sal_dept" from "employee" "e" where "dept_no" = ?',
        bindings: ["e.dept_no"]
      },
      mssql: {
        sql: 'select [e].[lastname], [e].[salary], (select [avg(salary)] from [employee] where dept_no = e.dept_no) as [avg_sal_dept] from [employee] as [e] where [dept_no] = ?',
        bindings: ["e.dept_no"]
      },
      oracledb: {
        // TODO: Check if possible
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) "avg_sal_dept" from "employee" "e" where "dept_no" = ?',
        bindings: ["e.dept_no"]
      },
      postgres: {
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) as "avg_sal_dept" from "employee" as "e" where "dept_no" = ?',
        bindings: ["e.dept_no"]
      }
    });
  });

  it('allows function for subselect column', function() {
    testsql(qb().select(
      'e.lastname',
      'e.salary'
    ).select(function() {
      this.select('avg(salary)').from('employee').whereRaw('dept_no = e.dept_no').as('avg_sal_dept');
    }).from('employee as e')
    .where('dept_no', '=', 'e.dept_no'), {
      mysql: {
        sql: 'select `e`.`lastname`, `e`.`salary`, (select `avg(salary)` from `employee` where dept_no = e.dept_no) as `avg_sal_dept` from `employee` as `e` where `dept_no` = ?',
        bindings: ["e.dept_no"]
      },
      oracle: {
        // TODO: Check if possible
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) "avg_sal_dept" from "employee" "e" where "dept_no" = ?',
        bindings: ["e.dept_no"]
      },
      mssql: {
        sql: 'select [e].[lastname], [e].[salary], (select [avg(salary)] from [employee] where dept_no = e.dept_no) as [avg_sal_dept] from [employee] as [e] where [dept_no] = ?',
        bindings: ["e.dept_no"]
      },
      oracledb: {
        // TODO: Check if possible
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) "avg_sal_dept" from "employee" "e" where "dept_no" = ?',
        bindings: ["e.dept_no"]
      },
      postgres: {
        sql: 'select "e"."lastname", "e"."salary", (select "avg(salary)" from "employee" where dept_no = e.dept_no) as "avg_sal_dept" from "employee" as "e" where "dept_no" = ?',
        bindings: ["e.dept_no"]
      }
    });
  });

  it('allows first as syntax', function() {
    testsql(qb().select(
      'e.lastname',
      'e.salary',
      qb().first('salary').from('employee').whereRaw('dept_no = e.dept_no').orderBy('salary', 'desc').as('top_dept_salary')
    ).from('employee as e')
    .where('dept_no', '=', 'e.dept_no'), {
      mysql: {
        sql: 'select `e`.`lastname`, `e`.`salary`, (select `salary` from `employee` where dept_no = e.dept_no order by `salary` desc limit ?) as `top_dept_salary` from `employee` as `e` where `dept_no` = ?',
        bindings: [1, "e.dept_no"]
      },
      mssql: {
        sql: 'select [e].[lastname], [e].[salary], (select top (?) [salary] from [employee] where dept_no = e.dept_no order by [salary] desc) as [top_dept_salary] from [employee] as [e] where [dept_no] = ?',
        bindings: [1, "e.dept_no"]
      },
      postgres: {
        sql: 'select "e"."lastname", "e"."salary", (select "salary" from "employee" where dept_no = e.dept_no order by "salary" desc limit ?) as "top_dept_salary" from "employee" as "e" where "dept_no" = ?',
        bindings: [1, "e.dept_no"]
      }
    });
  });

  it('supports arbitrarily nested raws', function() {
    var chain = qb().select('*').from('places')
      .where(raw('ST_DWithin((places.address).xy, ?, ?) AND ST_Distance((places.address).xy, ?) > ? AND ?', [
        raw('ST_SetSRID(?,?)', [
          raw('ST_MakePoint(?,?)', [-10,10]),
          4326
        ]),
        100000,
        raw('ST_SetSRID(?,?)', [
          raw('ST_MakePoint(?,?)', [-5,5]),
          4326
        ]),
        50000,
        raw('places.id IN ?', [ [1,2,3] ])
      ]));

    testsql(chain, {
      mysql: {
        sql: 'select * from `places` where ST_DWithin((places.address).xy, ST_SetSRID(ST_MakePoint(?,?),?), ?) AND ST_Distance((places.address).xy, ST_SetSRID(ST_MakePoint(?,?),?)) > ? AND places.id IN ?',
        bindings: [-10, 10, 4326, 100000, -5, 5, 4326, 50000, [1,2,3] ]
      },
      mssql: {
        sql: 'select * from [places] where ST_DWithin((places.address).xy, ST_SetSRID(ST_MakePoint(?,?),?), ?) AND ST_Distance((places.address).xy, ST_SetSRID(ST_MakePoint(?,?),?)) > ? AND places.id IN ?',
        bindings: [-10, 10, 4326, 100000, -5, 5, 4326, 50000, [1,2,3] ]
      },
      postgres: {
        sql: 'select * from "places" where ST_DWithin((places.address).xy, ST_SetSRID(ST_MakePoint(?,?),?), ?) AND ST_Distance((places.address).xy, ST_SetSRID(ST_MakePoint(?,?),?)) > ? AND places.id IN ?',
        bindings: [-10, 10, 4326, 100000, -5, 5, 4326, 50000, [1,2,3] ]
      }
    });
  });

  it('has joinRaw for arbitrary join clauses', function() {
    testsql(qb().select('*').from('accounts').joinRaw('natural full join table1').where('id', 1), {
      mysql: {
        sql: 'select * from `accounts` natural full join table1 where `id` = ?',
        bindings: [1]
      },
      mssql: {
        sql: 'select * from [accounts] natural full join table1 where [id] = ?',
        bindings: [1]
      },
      postgres: {
        sql: 'select * from "accounts" natural full join table1 where "id" = ?',
        bindings: [1]
      }
    });
  });

  it('allows a raw query in the second param', function() {
    testsql(qb().select('*').from('accounts').innerJoin(
      'table1', raw('ST_Contains(buildings_pluto.geom, ST_Centroid(buildings_building.geom))')
    ), {
      mysql: {
        sql: 'select * from `accounts` inner join `table1` on ST_Contains(buildings_pluto.geom, ST_Centroid(buildings_building.geom))'
      },
      mssql: {
        sql: 'select * from [accounts] inner join [table1] on ST_Contains(buildings_pluto.geom, ST_Centroid(buildings_building.geom))'
      },
      postgres: {
        sql: 'select * from "accounts" inner join "table1" on ST_Contains(buildings_pluto.geom, ST_Centroid(buildings_building.geom))'
      }
    });
  });

  it('allows join "using"', function() {
    testsql(qb().select('*').from('accounts').innerJoin('table1', function() {
      this.using('id');
    }), {
      mysql: {
        sql: 'select * from `accounts` inner join `table1` using `id`'
      },
      mssql: {
        //sql: 'select * from [accounts] inner join [table1] on [accounts].[id] = [table1].[id]'
        sql: 'select * from [accounts] inner join [table1] using [id]'
      },
      postgres: {
        sql: 'select * from "accounts" inner join "table1" using "id"'
      }
    });
  });

  it('allows sub-query function on insert, #427', function() {
    testsql(qb().into('votes').insert(function() {
      this.select('*').from('votes').where('id', 99);
    }), {
      mysql: {
        sql: 'insert into `votes` select * from `votes` where `id` = ?',
        bindings: [99]
      },
      mssql: {
        sql: 'insert into [votes] select * from [votes] where [id] = ?',
        bindings: [99]
      },
      postgres: {
        sql: 'insert into "votes" select * from "votes" where "id" = ?',
        bindings: [99]
      }
    });
  });

  it('allows sub-query chain on insert, #427', function() {
    testsql(qb().into('votes').insert(qb().select('*').from('votes').where('id', 99)), {
      mysql: {
        sql: 'insert into `votes` select * from `votes` where `id` = ?',
        bindings: [99]
      },
      oracle: {
        sql: 'insert into "votes" select * from "votes" where "id" = ?',
        bindings: [99]
      },
      mssql: {
        sql: 'insert into [votes] select * from [votes] where [id] = ?',
        bindings: [99]
      },
      oracledb: {
        sql: 'insert into "votes" select * from "votes" where "id" = ?',
        bindings: [99]
      },
      postgres: {
        sql: 'insert into "votes" select * from "votes" where "id" = ?',
        bindings: [99]
      }
    });
  });

  it('allows for raw values in join, #441', function() {
    testsql(qb()
      .select('A.nid AS id')
      .from(raw('nidmap2 AS A'))
      .innerJoin(
        raw([
          'SELECT MIN(nid) AS location_id',
          'FROM nidmap2',
        ].join(' ')).wrap('(', ') AS B'),
        'A.x', '=', 'B.x'
      ), {
        mysql: {
          sql: 'select `A`.`nid` as `id` from nidmap2 AS A inner join (SELECT MIN(nid) AS location_id FROM nidmap2) AS B on `A`.`x` = `B`.`x`',
          bindings: []
        },
        mssql: {
          sql: 'select [A].[nid] as [id] from nidmap2 AS A inner join (SELECT MIN(nid) AS location_id FROM nidmap2) AS B on [A].[x] = [B].[x]',
          bindings: []
        },
        oracle: {
          sql: 'select "A"."nid" "id" from nidmap2 AS A inner join (SELECT MIN(nid) AS location_id FROM nidmap2) AS B on "A"."x" = "B"."x"',
          bindings: []
        },
        oracledb: {
          sql: 'select "A"."nid" "id" from nidmap2 AS A inner join (SELECT MIN(nid) AS location_id FROM nidmap2) AS B on "A"."x" = "B"."x"',
          bindings: []
        },
        postgres: {
          sql: 'select "A"."nid" as "id" from nidmap2 AS A inner join (SELECT MIN(nid) AS location_id FROM nidmap2) AS B on "A"."x" = "B"."x"',
          bindings: []
        }
      });
  });

  it('allows insert values of sub-select without raw, #627', function() {
    testsql(qb().table('entries').insert({
      secret: 123,
      sequence: qb().count('*').from('entries').where('secret', 123)
    }), {
      mysql: {
        sql: 'insert into `entries` (`secret`, `sequence`) values (?, (select count(*) from `entries` where `secret` = ?))',
        bindings: [123, 123]
      },
      mssql: {
        sql: 'insert into [entries] ([secret], [sequence]) values (?, (select count(*) from [entries] where [secret] = ?))',
        bindings: [123, 123]
      },
      postgres: {
        sql: 'insert into "entries" ("secret", "sequence") values (?, (select count(*) from "entries" where "secret" = ?))',
        bindings: [123, 123]
      }
    });
  });

  it('correctly orders parameters when selecting from subqueries, #704', function() {
    var subquery = qb().select(raw('? as f', ['inner raw select'])).as('g');
    testsql(qb()
      .select(raw('?', ['outer raw select']), 'g.f')
      .from(subquery)
      .where('g.secret', 123),
      {
        mysql: {
          sql: 'select ?, `g`.`f` from (select ? as f) as `g` where `g`.`secret` = ?',
          bindings: ['outer raw select', 'inner raw select', 123]
        },
        oracle: {
          sql: 'select ?, "g"."f" from (select ? as f) "g" where "g"."secret" = ?',
          bindings: ['outer raw select', 'inner raw select', 123]
        },
        mssql: {
          sql: 'select ?, [g].[f] from (select ? as f) as [g] where [g].[secret] = ?',
          bindings: ['outer raw select', 'inner raw select', 123]
        },
        oracledb: {
          sql: 'select ?, "g"."f" from (select ? as f) "g" where "g"."secret" = ?',
          bindings: ['outer raw select', 'inner raw select', 123]
        },
        postgres: {
          sql: 'select ?, "g"."f" from (select ? as f) as "g" where "g"."secret" = ?',
          bindings: ['outer raw select', 'inner raw select', 123]
        }
      });
  });

  it('escapes queries properly, #737', function() {
    testsql(qb()
      .select('id","name', 'id`name')
      .from('test`'),
      {
        mysql: {
          sql: 'select `id","name`, `id``name` from `test```',
          bindings: []
        },
        mssql: {
          sql: 'select [id","name], [id`name] from [test`]',
          bindings: []
        },
        postgres: {
          sql: 'select "id"",""name", "id`name" from "test`"',
          bindings: []
        }
      });
  });

  it('has a fromJS method for json construction of queries', function() {
    testsql(qb().fromJS({
      select: '*',
      from: 'accounts',
      where: {
        id: 1
      },
      whereIn: ['name', ['a', 'b', 'c']]
    }), {
      mysql: {
        sql: 'select * from `accounts` where `id` = ? and `name` in (?, ?, ?)',
        bindings: [1, 'a', 'b', 'c']
      },
      mssql: {
        sql: 'select * from [accounts] where [id] = ? and [name] in (?, ?, ?)',
        bindings: [1, 'a', 'b', 'c']
      },
      postgres: {
        sql: 'select * from "accounts" where "id" = ? and "name" in (?, ?, ?)',
        bindings: [1, 'a', 'b', 'c']
      }
    })
  })

  it('has a modify method which accepts a function that can modify the query', function() {
    // arbitrary number of arguments can be passed to `.modify(queryBuilder, ...)`,
    // builder is bound to `this`
    var withBars = function(queryBuilder, table, fk) {
      if(!this || this !== queryBuilder) {
        throw 'Expected query builder passed as first argument and bound as `this` context';
      }
      this
        .leftJoin('bars', table + '.' + fk, 'bars.id')
        .select('bars.*')
    };

    testsql(qb().select('foo_id').from('foos').modify(withBars, 'foos', 'bar_id'), {
      mysql: {
        sql: 'select `foo_id`, `bars`.* from `foos` left join `bars` on `foos`.`bar_id` = `bars`.`id`'
      },
      mssql: {
        sql: 'select [foo_id], [bars].* from [foos] left join [bars] on [foos].[bar_id] = [bars].[id]'
      },
      postgres: {
        sql: 'select "foo_id", "bars".* from "foos" left join "bars" on "foos"."bar_id" = "bars"."id"'
      }
    })
  })

  it('Allows for empty where #749', function() {
    testsql(qb().select('foo').from('tbl').where(function() {}), {
      mysql:   'select `foo` from `tbl`',
      mssql:   'select [foo] from [tbl]',
      postgres: 'select "foo" from "tbl"'
    })
  })

  it("escapes single quotes properly", function() {
    testquery(qb().select('*').from('users').where('last_name', 'O\'Brien'), {
      mysql: 'select * from `users` where `last_name` = \'O\\\'Brien\'',
      postgres: 'select * from "users" where "last_name" = \'O\'\'Brien\''
    });
  });

  it("escapes double quotes property", function(){
    testquery(qb().select('*').from('players').where('name', 'Gerald "Ice" Williams'), {
      postgres: 'select * from "players" where "name" = \'Gerald "Ice" Williams\''
    });
  });

  it('escapes backslashes properly', function() {
    testquery(qb().select('*').from('files').where('path', 'C:\\test.txt'), {
      postgres: 'select * from "files" where "path" = E\'C:\\\\test.txt\''
    });
  });

  it("allows join without operator and with value 0 #953", function() {
    testsql(qb().select('*').from('users').join('photos', 'photos.id', 0), {
      mysql: {
        sql: 'select * from `users` inner join `photos` on `photos`.`id` = 0'
      },
      mssql: {
        sql: 'select * from [users] inner join [photos] on [photos].[id] = 0'
      },
      postgres: {
        sql: 'select * from "users" inner join "photos" on "photos"."id" = 0'
      }
    });
  });

  it("allows join with operator and with value 0 #953", function() {
    testsql(qb().select('*').from('users').join('photos', 'photos.id', '>', 0), {
      mysql: {
        sql: 'select * from `users` inner join `photos` on `photos`.`id` > 0'
      },
      mssql: {
        sql: 'select * from [users] inner join [photos] on [photos].[id] > 0'
      },
      postgres: {
        sql: 'select * from "users" inner join "photos" on "photos"."id" > 0'
      }
    });
  });

  it("where with date object", function () {
    var date = new Date();
    testsql(qb().select('*').from('users').where("birthday", ">=", date), {
      mysql: {
        sql: 'select * from `users` where `birthday` >= ?',
        bindings: [date]
      },
      mssql: {
        sql: 'select * from [users] where [birthday] >= ?',
        bindings: [date]
      },
      postgres: {
        sql: 'select * from "users" where "birthday" >= ?',
        bindings: [date]
      }
    });
  });

  it("raw where with date object", function() {
    var date = new Date();
    testsql(qb().select('*').from('users').whereRaw("birthday >= ?", date), {
      mysql: {
        sql: 'select * from `users` where birthday >= ?',
        bindings: [date]
      },
      mssql: {
        sql: 'select * from [users] where birthday >= ?',
        bindings: [date]
      },
      postgres: {
        sql: 'select * from "users" where birthday >= ?',
        bindings: [date]
      }
    });
  });

  it('#965 - .raw accepts Array and Non-Array bindings', function() {
    var expected = function(fieldName, expectedBindings) {
      return {
        mysql:   {
          sql:      'select * from `users` where ' + fieldName + ' = ?',
          bindings: expectedBindings
        },
        mssql:   {
          sql:      'select * from [users] where ' + fieldName + ' = ?',
          bindings: expectedBindings
        },
        postgres: {
          sql:      'select * from "users" where ' + fieldName + ' = ?',
          bindings: expectedBindings
        }
      };
    };

    //String
    testsql(qb().select('*').from('users').where(raw('username = ?', 'knex')), expected('username', ['knex']));
    testsql(qb().select('*').from('users').where(raw('username = ?', ['knex'])), expected('username', ['knex']));

    //Number
    testsql(qb().select('*').from('users').where(raw('isadmin = ?', 0)), expected('isadmin', [0]));
    testsql(qb().select('*').from('users').where(raw('isadmin = ?', [1])), expected('isadmin', [1]));

    //Date
    var date = new Date(2016, 0, 5, 10, 19, 30, 599);
    var sqlUpdTime = '2016-01-05 10:19:30.599';
    testsql(qb().select('*').from('users').where(raw('updtime = ?', date)), expected('updtime', [date]));
    testsql(qb().select('*').from('users').where(raw('updtime = ?', [date])), expected('updtime', [date]));
    testquery(qb().select('*').from('users').where(raw('updtime = ?', date)), {
      mysql: 'select * from `users` where updtime = \'' + sqlUpdTime + '\'',
      postgres: 'select * from "users" where updtime = \'' + sqlUpdTime + '\''
    });
  });

  it("#1118 orWhere({..}) generates or (and - and - and)", function() {
    testsql(qb().select('*').from('users').where('id', '=', 1).orWhere({
      email: 'foo',
      id: 2
    }), {
      mysql: {
        sql: 'select * from `users` where `id` = ? or (`email` = ? and `id` = ?)',
        bindings: [1, 'foo', 2]
      },
      mssql: {
        sql: 'select * from [users] where [id] = ? or ([email] = ? and [id] = ?)',
        bindings: [1, 'foo', 2]
      },
      postgres: {
        sql: 'select * from "users" where "id" = ? or ("email" = ? and "id" = ?)',
        bindings: [1, 'foo', 2]
      }
    });
  });

  it('#1228 Named bindings', function() {
    testsql(qb().select('*').from('users').whereIn('id', raw('select (:test)', {test: [1,2,3]})), {
      mysql: {
        sql: 'select * from `users` where `id` in (select (?))',
        bindings: [[1,2,3]]
      },
      mssql: {
        sql: 'select * from [users] where [id] in (select (?))',
        bindings: [[1,2,3]]
      },
      postgres: {
        sql: 'select * from "users" where "id" in (select (?))',
        bindings: [[1,2,3]]
      }
    });


    var namedBindings = {
      name:     'users.name',
      thisGuy:  'Bob',
      otherGuy: 'Jay'
    };
    //Had to do it this way as the 'raw' statement's .toQuery is called before testsql, meaning mssql and other dialects would always get the output of qb() default client
    //as MySQL, which means testing the query per dialect won't work. [users].[name] would be `users`.`name` for mssql which is incorrect.
    var mssql = clients.mssql;
    var mysql = clients.mysql;
    var sqlite3 = clients.sqlite3;

    var mssqlQb = mssql.queryBuilder().select('*').from('users').where(mssql.raw(':name: = :thisGuy or :name: = :otherGuy', namedBindings)).toSQL();
    var mysqlQb = mysql.queryBuilder().select('*').from('users').where(mysql.raw(':name: = :thisGuy or :name: = :otherGuy', namedBindings)).toSQL();
    var sqliteQb = sqlite3.queryBuilder().select('*').from('users').where(sqlite3.raw(':name: = :thisGuy or :name: = :otherGuy', namedBindings)).toSQL();

    expect(mssqlQb.sql).to.equal('select * from [users] where [users].[name] = ? or [users].[name] = ?');
    expect(mssqlQb.bindings).to.deep.equal(['Bob', 'Jay']);

    expect(mysqlQb.sql).to.equal('select * from `users` where `users`.`name` = ? or `users`.`name` = ?');
    expect(mysqlQb.bindings).to.deep.equal(['Bob', 'Jay']);

    expect(sqliteQb.sql).to.equal('select * from "users" where "users"."name" = ? or "users"."name" = ?');
    expect(sqliteQb.bindings).to.deep.equal(['Bob', 'Jay']);
  });

  it('#1268 - valueForUndefined should be in toSQL(QueryCompiler)', function() {
    testsql(qb().insert([{id: void 0, name: 'test', occupation: void 0}, {id: 1, name: void 0, occupation: 'none'}]).into('users'), {
      mysql: {
        sql: 'insert into `users` (`id`, `name`, `occupation`) values (DEFAULT, ?, DEFAULT), (?, DEFAULT, ?)',
        bindings: ['test', 1, 'none']
      },
      oracle: {
        sql: 'begin execute immediate \'insert into "users" ("id", "name", "occupation") values (DEFAULT, :1, DEFAULT)\' using ?; execute immediate \'insert into "users" ("id", "name", "occupation") values (:1, DEFAULT, :2)\' using ?, ?;end;',
        bindings: ['test', 1, 'none']
      },
      mssql: {
        sql: 'insert into [users] ([id], [name], [occupation]) values (DEFAULT, ?, DEFAULT), (?, DEFAULT, ?)',
        bindings: ['test', 1, 'none']
      },
      postgres: {
        sql: 'insert into "users" ("id", "name", "occupation") values (DEFAULT, ?, DEFAULT), (?, DEFAULT, ?)',
        bindings: ['test', 1, 'none']
      }
    });

    expect(function() {
      clients.sqlite3.queryBuilder().insert([{id: void 0}]).into('users').toString();
    })
    .to
    .throw(TypeError);

    expect(function() {
      clientsWithNullAsDefault.sqlite3.queryBuilder().insert([{id: void 0}]).into('users').toString();
    })
    .to
    .not
    .throw(TypeError);
  });


  it('#1402 - raw should take "not" into consideration in querybuilder', function() {
    testsql(qb().from('testtable').whereNot(raw('is_active')), {
      mysql: {
        sql: 'select * from `testtable` where not is_active',
        bindings: []
      },
      oracle: {
        sql: 'select * from "testtable" where not is_active',
        bindings: []
      },
      mssql: {
        sql: 'select * from [testtable] where not is_active',
        bindings: []
      },
      postgres: {
        sql: 'select * from "testtable" where not is_active',
        bindings: []
      }
    })
  });


  it('Any undefined binding in a SELECT query should throw an error', function() {
    var qbuilders = [
      qb().from('accounts').where({Login: void 0}).select(),
      qb().from('accounts').where('Login', void 0).select(),
      qb().from('accounts').where('Login', '>=', void 0).select(),
      qb().from('accounts').whereIn('Login', ['test', 'val', void 0]).select(),
      qb().from('accounts').where({Login: ['1', '2', '3', void 0]}),
      qb().from('accounts').where({Login: {Test: '123', Value: void 0}}),
      qb().from('accounts').where({Login: ['1', ['2', [void 0]]]}),
      qb().from('accounts').update({test: '1', test2: void 0}).where({abc: 'test', cba: void 0})
    ];
    qbuilders.forEach(function(qbuilder) {
      try {
        //Must be present, but makes no difference since it throws.
        testsql(qbuilder, {
          mysql: {
            sql: '',
            bindings: []
          },
          oracle: {
            sql: '',
            bindings: []
          },
          mssql: {
            sql: '',
            bindings: []
          },
          postgres: {
            sql: '',
            bindings: []
          }
        });
        expect(true).to.equal(false, 'Expected to throw error in compilation about undefined bindings.');
      } catch(error) {
        expect(error.message).to.contain('Undefined binding(s) detected when compiling ' + qbuilder._method.toUpperCase() + ' query:'); //This test is not for asserting correct queries
      }
    });
  });


  it('Any undefined binding in a RAW query should throw an error', function() {
    var expectedErrorMessageContains = 'Undefined binding(s) detected when compiling RAW query:'; //This test is not for asserting correct queries
    var raws = [
      raw('?', [undefined]),
      raw(':col = :value', {col: 'test', value: void 0}),
      raw('? = ?', ['test', void 0]),
      raw('? = ?', ['test', {test: void 0}]),
      raw('?', [['test', void 0]])
    ];
    raws.forEach(function(raw) {
      try {
        raw = raw.toSQL();
        expect(true).to.equal(false, 'Expected to throw error in compilation about undefined bindings.');
      } catch(error) {
        expect(error.message).to.contain(expectedErrorMessageContains); //This test is not for asserting correct queries
      }
    });
  });

  it('Support escaping of named bindings', function() {
    var namedBindings = { a: 'foo', b: 'bar', c: 'baz' };

    var raws = [
      [raw(':a: = :b OR :c', namedBindings), '"foo" = ? OR ?', [namedBindings.b, namedBindings.c]],
      [raw(':a: = \\:b OR :c', namedBindings), '"foo" = :b OR ?', [namedBindings.c]],
      [raw('\\:a: = :b OR :c', namedBindings), ':a: = ? OR ?', [namedBindings.b, namedBindings.c]],
      [raw(':a: = \\:b OR \\:c', namedBindings), '"foo" = :b OR :c', []],
      [raw('\\:a: = \\:b OR \\:c', namedBindings), ':a: = :b OR :c', []]
    ];

    raws.forEach(function(raw) {
      var result = raw[0].toSQL();
      expect(result.sql).to.equal(raw[1]);
      expect(result.bindings).to.deep.equal(raw[2]);
    })
  })

  it('Respect casting with named bindings', function() {
    var namedBindings = { a: 'foo', b: 'bar', c: 'baz' };

    var raws = [
      [raw(':a: = :b::TEXT OR :c', namedBindings), '"foo" = ?::TEXT OR ?', [namedBindings.b, namedBindings.c]],
      [raw(':a: = :b::TEXT OR :c::TEXT', namedBindings), '"foo" = ?::TEXT OR ?::TEXT', [namedBindings.b, namedBindings.c]],
      [raw(":a: = 'bar'::TEXT OR :b OR :c::TEXT", namedBindings), '"foo" = \'bar\'::TEXT OR ? OR ?::TEXT', [namedBindings.b, namedBindings.c]],
      [raw(":a:::TEXT = OR :b::TEXT OR :c", namedBindings), '"foo"::TEXT = OR ?::TEXT OR ?', [namedBindings.b, namedBindings.c]],
      [raw('\\:a: = :b::TEXT OR :c', namedBindings), ':a: = ?::TEXT OR ?', [namedBindings.b, namedBindings.c]],
      [raw(':a: = \\:b::TEXT OR \\:c', namedBindings), '"foo" = :b::TEXT OR :c', []],
      [raw('\\:a: = \\:b::TEXT OR \\:c', namedBindings), ':a: = :b::TEXT OR :c', []]
    ];

    raws.forEach(function(raw) {
      var result = raw[0].toSQL();
      expect(result.sql).to.equal(raw[1]);
      expect(result.bindings).to.deep.equal(raw[2]);
    });
  });

  it("query \\\\? escaping", function() {
    testquery(qb().select('*').from('users').where('id', '=', 1).whereRaw('?? \\? ?', ['jsonColumn', 'jsonKey?']), {
      mysql: 'select * from `users` where `id` = 1 and `jsonColumn` ? \'jsonKey?\'',
      postgres: 'select * from "users" where "id" = 1 and "jsonColumn" ? \'jsonKey?\''
    });
  });

  it("wrapped 'with' clause select", function() {
    testsql(qb().with('withClause', function() {
      this.select('foo').from('users');
    }).select('*').from('withClause'), {
      mssql: 'with [withClause] as (select [foo] from [users]) select * from [withClause]',
      sqlite3: 'with "withClause" as (select "foo" from "users") select * from "withClause"',
      postgres: 'with "withClause" as (select "foo" from "users") select * from "withClause"',
      oracledb: 'with "withClause" as (select "foo" from "users") select * from "withClause"',
      oracle: 'with "withClause" as (select "foo" from "users") select * from "withClause"'
    });
  });

  it("wrapped 'with' clause insert", function() {
    testsql(qb().with('withClause', function() {
      this.select('foo').from('users');
    }).insert(raw('select * from "withClause"')).into('users'), {
      mssql: 'with [withClause] as (select [foo] from [users]) insert into [users] select * from "withClause"',
      sqlite3: 'with "withClause" as (select "foo" from "users") insert into "users" select * from "withClause"',
      postgres: 'with "withClause" as (select "foo" from "users") insert into "users" select * from "withClause"'
    });
  });

  it("wrapped 'with' clause multiple insert", function() {
    testsql(qb().with('withClause', function() {
      this.select('foo').from('users').where({name: 'bob'});
    }).insert([{email: 'thisMail', name: 'sam'}, {email: 'thatMail', name: 'jack'}]).into('users'), {
      mssql: {
        sql: 'with [withClause] as (select [foo] from [users] where [name] = ?) insert into [users] ([email], [name]) values (?, ?), (?, ?)',
        bindings: ['bob', 'thisMail', 'sam', 'thatMail', 'jack']
      },
      sqlite3: {
        sql: 'with "withClause" as (select "foo" from "users" where "name" = ?) insert into "users" ("email", "name") select ? as "email", ? as "name" union all select ? as "email", ? as "name"',
        bindings: ['bob', 'thisMail', 'sam', 'thatMail', 'jack']
      },
      postgres: {
        sql: 'with "withClause" as (select "foo" from "users" where "name" = ?) insert into "users" ("email", "name") values (?, ?), (?, ?)',
        bindings: ['bob', 'thisMail', 'sam', 'thatMail', 'jack']
      }
    });
  });

  it("wrapped 'with' clause update", function() {
    testsql(qb().with('withClause', function() {
      this.select('foo').from('users');
    }).update({foo: 'updatedFoo'}).where('email', '=', 'foo').from('users'), {
      mssql: 'with [withClause] as (select [foo] from [users]) update [users] set [foo] = ? where [email] = ?;select @@rowcount',
      sqlite3: 'with "withClause" as (select "foo" from "users") update "users" set "foo" = ? where "email" = ?',
      postgres: 'with "withClause" as (select "foo" from "users") update "users" set "foo" = ? where "email" = ?'
    });
  });

  it("wrapped 'with' clause delete", function() {
    testsql(qb().with('withClause', function() {
      this.select('email').from('users');
    }).del().where('foo', '=', 'updatedFoo').from('users'), {
      mssql: 'with [withClause] as (select [email] from [users]) delete from [users] where [foo] = ?;select @@rowcount',
      sqlite3: 'with "withClause" as (select "email" from "users") delete from "users" where "foo" = ?',
      postgres: 'with "withClause" as (select "email" from "users") delete from "users" where "foo" = ?'
    });
  });

  it("raw 'with' clause", function() {
    testsql(qb().with('withRawClause', raw('select "foo" as "baz" from "users"')).select('*').from('withRawClause'), {
      mssql: 'with [withRawClause] as (select "foo" as "baz" from "users") select * from [withRawClause]',
      sqlite3: 'with "withRawClause" as (select "foo" as "baz" from "users") select * from "withRawClause"',
      postgres: 'with "withRawClause" as (select "foo" as "baz" from "users") select * from "withRawClause"',
      oracledb: 'with "withRawClause" as (select "foo" as "baz" from "users") select * from "withRawClause"',
      oracle: 'with "withRawClause" as (select "foo" as "baz" from "users") select * from "withRawClause"'
      });
  });

  it("chained wrapped 'with' clause", function() {
    testsql(qb().with('firstWithClause', function() {
      this.select('foo').from('users');
    }).with('secondWithClause', function() {
      this.select('bar').from('users');
    }).select('*').from('secondWithClause'), {
      mssql: 'with [firstWithClause] as (select [foo] from [users]), [secondWithClause] as (select [bar] from [users]) select * from [secondWithClause]',
      sqlite3: 'with "firstWithClause" as (select "foo" from "users"), "secondWithClause" as (select "bar" from "users") select * from "secondWithClause"',
      postgres: 'with "firstWithClause" as (select "foo" from "users"), "secondWithClause" as (select "bar" from "users") select * from "secondWithClause"',
      oracledb: 'with "firstWithClause" as (select "foo" from "users"), "secondWithClause" as (select "bar" from "users") select * from "secondWithClause"',
      oracle: 'with "firstWithClause" as (select "foo" from "users"), "secondWithClause" as (select "bar" from "users") select * from "secondWithClause"'
    });
  });

  it("nested 'with' clause", function() {
    testsql(qb().with('withClause', function() {
      this.with('withSubClause', function() {
        this.select('foo').as('baz').from('users');
      }).select('*').from('withSubClause');
    }).select('*').from('withClause'), {
      mssql: 'with [withClause] as (with [withSubClause] as ((select [foo] from [users]) as [baz]) select * from [withSubClause]) select * from [withClause]',
      sqlite3: 'with "withClause" as (with "withSubClause" as ((select "foo" from "users") as "baz") select * from "withSubClause") select * from "withClause"',
      postgres: 'with "withClause" as (with "withSubClause" as ((select "foo" from "users") as "baz") select * from "withSubClause") select * from "withClause"',
      oracledb: 'with "withClause" as (with "withSubClause" as ((select "foo" from "users") "baz") select * from "withSubClause") select * from "withClause"',
      oracle: 'with "withClause" as (with "withSubClause" as ((select "foo" from "users") "baz") select * from "withSubClause") select * from "withClause"'
    });
  });

  it("nested 'with' clause with bindings", function() {
    testsql(qb().with('withClause', function() {
      this.with('withSubClause', raw('select "foo" as "baz" from "users" where "baz" > ? and "baz" < ?',
      [1, 20])).select('*').from('withSubClause');
    }).select('*').from('withClause').where({id: 10}), {
      mssql: {
          sql: 'with [withClause] as (with [withSubClause] as (select "foo" as "baz" from "users" where "baz" > ? and "baz" < ?) select * from [withSubClause]) select * from [withClause] where [id] = ?',
          bindings: [1, 20, 10]
        },
      sqlite3: {
          sql: 'with "withClause" as (with "withSubClause" as (select "foo" as "baz" from "users" where "baz" > ? and "baz" < ?) select * from "withSubClause") select * from "withClause" where "id" = ?',
          bindings: [1, 20, 10]
        },
      postgres: {
          sql: 'with "withClause" as (with "withSubClause" as (select "foo" as "baz" from "users" where "baz" > ? and "baz" < ?) select * from "withSubClause") select * from "withClause" where "id" = ?',
          bindings: [1, 20, 10]
        },
      oracledb: {
          sql: 'with "withClause" as (with "withSubClause" as (select "foo" as "baz" from "users" where "baz" > ? and "baz" < ?) select * from "withSubClause") select * from "withClause" where "id" = ?',
          bindings: [1, 20, 10]
        },
      oracle: {
          sql: 'with "withClause" as (with "withSubClause" as (select "foo" as "baz" from "users" where "baz" > ? and "baz" < ?) select * from "withSubClause") select * from "withClause" where "id" = ?',
          bindings: [1, 20, 10]
        }
    });
  });

  it("nested and chained wrapped 'with' clause", function() {
    testsql(qb().with('firstWithClause', function() {
      this.with('firstWithSubClause', function() {
        this.select('foo').as('foz').from('users');
      }).select('*').from('firstWithSubClause');
    }).with('secondWithClause', function() {
      this.with('secondWithSubClause', function() {
        this.select('bar').as('baz').from('users');
      }).select('*').from('secondWithSubClause');
    }).select('*').from('secondWithClause'), {
      mssql: 'with [firstWithClause] as (with [firstWithSubClause] as ((select [foo] from [users]) as [foz]) select * from [firstWithSubClause]), [secondWithClause] as (with [secondWithSubClause] as ((select [bar] from [users]) as [baz]) select * from [secondWithSubClause]) select * from [secondWithClause]',
      sqlite3: 'with "firstWithClause" as (with "firstWithSubClause" as ((select "foo" from "users") as "foz") select * from "firstWithSubClause"), "secondWithClause" as (with "secondWithSubClause" as ((select "bar" from "users") as "baz") select * from "secondWithSubClause") select * from "secondWithClause"',
      postgres: 'with "firstWithClause" as (with "firstWithSubClause" as ((select "foo" from "users") as "foz") select * from "firstWithSubClause"), "secondWithClause" as (with "secondWithSubClause" as ((select "bar" from "users") as "baz") select * from "secondWithSubClause") select * from "secondWithClause"',
      oracledb: 'with "firstWithClause" as (with "firstWithSubClause" as ((select "foo" from "users") "foz") select * from "firstWithSubClause"), "secondWithClause" as (with "secondWithSubClause" as ((select "bar" from "users") "baz") select * from "secondWithSubClause") select * from "secondWithClause"',
      oracle: 'with "firstWithClause" as (with "firstWithSubClause" as ((select "foo" from "users") "foz") select * from "firstWithSubClause"), "secondWithClause" as (with "secondWithSubClause" as ((select "bar" from "users") "baz") select * from "secondWithSubClause") select * from "secondWithClause"'
    });
  });

  it('#1710, properly escapes arrays in where clauses in postgresql', function() {
    testquery(qb().select('*').from('sometable').where('array_field', '&&', [7]), {
      postgres: "select * from \"sometable\" where \"array_field\" && '{7}'"
    });
    testquery(qb().select('*').from('sometable').where('array_field', '&&', ['abc', 'def']), {
      postgres: "select * from \"sometable\" where \"array_field\" && '{\"abc\",\"def\"}'"
    });
    testquery(qb().select('*').from('sometable').where('array_field', '&&', ['abc', 'def', ['g', 2]]), {
      postgres: "select * from \"sometable\" where \"array_field\" && '{\"abc\",\"def\",{\"g\",2}}'"
    });
  })

  it('#2003, properly escapes objects with toPostgres specialization', function () {
    function TestObject() { }
    TestObject.prototype.toPostgres = function() {
      return 'foobar'
    }
    testquery(qb().table('sometable').insert({ id: new TestObject() }), {
      postgres: "insert into \"sometable\" (\"id\") values ('foobar')"
    });
  })
});

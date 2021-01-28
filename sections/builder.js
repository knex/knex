export default [
  {
    type: "heading",
    size: "lg",
    content: "Knex Query Builder",
    href: "Builder"
  },
  {
    type: "text",
    content: "The heart of the library, the knex query builder is the interface used for building and executing standard SQL queries, such as `select`, `insert`, `update`, `delete`."
  },
  {
    type: "heading",
    size: "md",
    content: "Identifier Syntax",
    href: "Builder-identifier-syntax"
  },
  {
    type: "text",
    content: [
      "In many places in APIs identifiers like table name or column name can be passed to methods.",
      "Most commonly one needs just plain `tableName.columnName`, `tableName` or `columnName`, but in many cases one also needs to pass an alias how that identifier is referred later on in the query.",
      "There are two ways to declare an alias for identifier. One can directly give `as aliasName` suffix for the identifier (e.g. `identifierName as aliasName`) or one can pass an object `{ aliasName: 'identifierName' }`.",
      "If the object has multiple aliases `{ alias1: 'identifier1', alias2: 'identifier2' }`, then all the aliased identifiers are expanded to comma separated list.",
      "NOTE: identifier syntax has no place for selecting schema, so if you are doing `schemaName.tableName`, query might be rendered wrong. Use `.withSchema('schemaName')` instead."
    ]
  },
  {
    type: "runnable",
    content: `
      knex({ a: 'table', b: 'table' })
        .select({
          aTitle: 'a.title',
          bTitle: 'b.title'
        })
        .whereRaw('?? = ??', ['a.column_1', 'b.column_2'])
    `
  },
  {
    type: "method",
    method: "knex",
    example: "knex(tableName, options={only: boolean}) / knex.[methodName]",
    description: "The query builder starts off either by specifying a tableName you wish to query against, or by calling any method directly on the knex object. This kicks off a jQuery-like chain, with which you can call additional query builder methods as needed to construct the query, eventually calling any of the interface methods, to either convert toString, or execute the query with a promise, callback, or stream. Optional second argument for passing options:*   **only**: if `true`, the ONLY keyword is used before the `tableName` to discard inheriting tables' data. **NOTE:** only supported in PostgreSQL for now.",
    children: [{
      type: "heading",
      size: "md",
      content: "Usage with TypeScript"
    }, {
      type: "text",
      content: "If using TypeScript, you can pass the type of database row as a type parameter to get better autocompletion support down the chain."
    }, {
      type: "code",
      language: "ts",
      content: `
        interface User {
          id: number;
          name: string;
          age: number;
        }

        knex('users')
          .where('id')
          .first(); // Resolves to any

        knex<User>('users') // User is the type of row in database
          .where('id', 1) // Your IDE will be able to help with the completion of id
          .first(); // Resolves to User | undefined
      `
    }, {
      type: "text",
      content: "It is also possible to take advantage of auto-completion support (in TypeScript-aware IDEs) with generic type params when writing code in plain JavaScript through JSDoc comments."
    }, {
      type: "code",
      language: "ts",
      content: `
        /**
         * @typedef {Object} User
         * @property {number} id
         * @property {number} age
         * @property {string} name
         *
         * @returns {Knex.QueryBuilder<User, {}>}
         */
        const Users = () => knex('Users')

        Users().where('id', 1) // 'id' property can be autocompleted by editor
      `
    }, {
      type: "heading",
      size: "md",
      content: "Caveat with type inference and mutable fluent APIs"
    }, {
      type: "text",
      content: "Most of the knex APIs mutate current object and return it. This pattern does not work well with type-inference."
    }, {
      type: "code",
      language: "ts",
      content: `
        knex<User>('users')
          .select('id')
          .then((users) => { // Type of users is inferred as Pick<User, "id">[]
            // Do something with users
          });

        knex<User>('users')
          .select('id')
          .select('age')
          .then((users) => { // Type of users is inferred as Pick<User, "id" | "age">[]
            // Do something with users
          });

        // The type of usersQueryBuilder is determined here
        const usersQueryBuilder = knex<User>('users').select('id');

        if (someCondition) {
          // This select will not change the type of usersQueryBuilder
          // We can not change the type of a pre-declared variabe in TypeScript
          usersQueryBuilder.select('age');
        }
        usersQueryBuilder.then((users) => {
          // Type of users here will be Pick<User, "id">[]
          // which may not be what you expect.
        });

        // You can specify the type of result explicitly through a second type parameter:
        const queryBuilder = knex<User, Pick<User, "id" | "age">>('users');

        // But there is no type constraint to ensure that these properties have actually been
        // selected.

        // So, this will compile:
        queryBuilder.select('name').then((users) => {
          // Type of users is Pick<User, "id"> but it will only have name
        })
      `
    }, {
      type: "text",
      content: "If you don't want to manually specify the result type, it is recommended to always use the type of last value of the chain and assign result of any future chain continuation to a separate variable (which will have a different type)."
    }]
  },
  {
    type: "method",
    method: "timeout",
    example: ".timeout(ms, options={cancel: boolean})",
    description: "Sets a timeout for the query and will throw a TimeoutError if the timeout is exceeded. The error contains information about the query, bindings, and the timeout that was set. Useful for complex queries that you want to make sure are not taking too long to execute. Optional second argument for passing options:*   **cancel**: if `true`, cancel query if timeout is reached. **NOTE:** only supported in MySQL and PostgreSQL for now.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select().from('books').timeout(1000)
        `
      },
      {
        type: "runnable",
        content: `
          knex.select().from('books').timeout(1000, {cancel: true}) // MySQL and PostgreSQL only
        `
      }
    ]
  },
  {
    type: "method",
    method: "select",
    example: ".select([*columns])",
    description: "Creates a select query, taking an optional array of columns for the query, eventually defaulting to * if none are specified when the query is built. The response of a select call will resolve with an array of objects selected from the database.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('title', 'author', 'year').from('books')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select().table('books')
        `
      },
      {
        type: "heading",
        size: "md",
        content: "Usage with TypeScript"
      },
      {
        type: "text",
        content: "We are generally able to infer the result type based on the columns being selected as long as the select arguments match exactly the key names in record type. However, aliasing and scoping can get in the way of inference."
      },
      {
        type: "code",
        language: "ts",
        content: `
          knex.select('id').from<User>('users'); // Resolves to Pick<User, "id">[]

          knex.select('users.id').from<User>('users'); // Resolves to any[]
          // ^ TypeScript doesn't provide us a way to look into a string and infer the type
          //   from a substring, so we fall back to any

          // We can side-step this using knex.ref:
          knex.select(knex.ref('id').withSchema('users')).from<User>('users'); // Resolves to Pick<User, "id">[]

          knex.select('id as identifier').from<User>('users'); // Resolves to any[], for same reason as above

          // Refs are handy here too:
          knex.select(knex.ref('id').as('identifier')).from<User>('users'); // Resolves to { identifier: number; }[]
        `
      }
    ]
  },
  {
    type: "method",
    method: "as",
    example: ".as(name)",
    description: "Allows for aliasing a subquery, taking the string you wish to name the current query. If the query is not a sub-query, it will be ignored.",
    children: [
      {
        type: "runnable",
        content: `
          knex.avg('sum_column1').from(function() {
            this.sum('column1 as sum_column1').from('t1').groupBy('column1').as('t1')
          }).as('ignored_alias')
        `
      }
    ]
  },
  {
    type: "method",
    method: "column",
    example: ".column(columns)",
    description: "Specifically set the columns to be selected on a select query, taking an array, an object or a list of column names. Passing an object will automatically alias the columns with the given keys.",
    children: [
      {
        type: "runnable",
        content: `
          knex.column('title', 'author', 'year').select().from('books')
        `
      },
      {
        type: "runnable",
        content: `
          knex.column(['title', 'author', 'year']).select().from('books')
        `
      },
      {
        type: "runnable",
        content: `
          knex.column('title', {by: 'author'}, 'year').select().from('books')
        `
      }
    ]
  },
  {
    type: "method",
    method: "from",
    example: ".from([tableName], options={only: boolean})",
    description: "Specifies the table used in the current query, replacing the current table name if one has already been specified. This is typically used in the sub-queries performed in the advanced where or union methods. Optional second argument for passing options:*   **only**: if `true`, the ONLY keyword is used before the `tableName` to discard inheriting tables' data. **NOTE:** only supported in PostgreSQL for now.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users')
        `
      },
      {
        type: "heading",
        size: "md",
        content: "Usage with TypeScript"
      },
      {
        type: "text",
        content: "We can specify the type of database row through the TRecord type parameter"
      },
      {
        type: "code",
        language: "ts",
        content: `
          knex.select('id').from('users'); // Resolves to any[]

          knex.select('id').from<User>('users'); // Results to Pick<User, "id">[]
        `
      }
    ]
  },
  {
    type: "method",
    method: "with",
    example: ".with(alias, function|raw)",
    description: "Add a \"with\" clause to the query. \"With\" clauses are supported by PostgreSQL, Oracle, SQLite3 and MSSQL.",
    children: [
      {
        type: "runnable",
        content: `
          knex.with('with_alias', knex.raw('select * from "books" where "author" = ?', 'Test')).select('*').from('with_alias')
        `
      },
      {
        type: "runnable",
        content: `
          knex.with('with_alias', (qb) => {
            qb.select('*').from('books').where('author', 'Test')
          }).select('*').from('with_alias')
        `
      }
    ]
  },
  {
    type: "method",
    method: "withRecursive",
    example: ".withRecursive(alias, function|raw)",
    description: "Indentical to the `with` method except \"recursive\" is appended to \"with\" to make self-referential CTEs possible.",
    children: [
      {
        type: "runnable",
        content: `
          knex.withRecursive('ancestors', (qb) => {
            qb.select('*').from('people').where('people.id', 1).union((qb) => {
              qb.select('*').from('people').join('ancestors', 'ancestors.parentId', 'people.id')
            })
          }).select('*').from('ancestors')
        `
      }
    ]
  },
  {
    type: "method",
    method: "withSchema",
    example: ".withSchema([schemaName])",
    description: "Specifies the schema to be used as prefix of table name.",
    children: [
      {
        type: "runnable",
        content: `
          knex.withSchema('public').select('*').from('users')
        `
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "Where Clauses",
    href: "Builder-wheres"
  },
  {
    type: "text",
    content: [
      "Several methods exist to assist in dynamic where clauses. In many places functions may be used in place of values, constructing subqueries. In most places existing knex queries may be used to compose sub-queries, etc. Take a look at a few of the examples for each method for instruction on use:",
      "**Important:** Supplying knex with an `undefined` value to any of the `where` functions will cause knex to throw an error during sql compilation. This is both for yours and our sake. Knex cannot know what to do with undefined values in a where clause, and generally it would be a programmatic error to supply one to begin with. The error will throw a message containing the type of query and the compiled query-string. Example:"
    ]
  },
  {
    type: "runnable",
    content: `
      knex('accounts')
        .where('login', undefined)
        .select()
        .toSQL()
    `
  },
  {
    type: "method",
    method: "where",
    example: ".where(~mixed~)",
    children: []
  },
  {
    type: "text",
    content: "Object Syntax:"
  },
  {
    type: "runnable",
    content: `
      knex('users').where({
        first_name: 'Test',
        last_name:  'User'
      }).select('id')
    `
  },
  {
    type: "text",
    content: "Key, Value:"
  },
  {
    type: "runnable",
    content: `
      knex('users').where('id', 1)
    `
  },
  {
    type: "text",
    content: "Functions:"
  },
  {
    type: "runnable",
    content: `
      knex('users')
      .where((builder) =>
        builder.whereIn('id', [1, 11, 15]).whereNotIn('id', [17, 19])
      )
      .andWhere(function() {
        this.where('id', '>', 10)
      })
    `
  },
  {
    type: "text",
    content: "Grouped Chain:"
  },
  {
    type: "runnable",
    content: `
      knex('users').where(function() {
        this.where('id', 1).orWhere('id', '>', 10)
      }).orWhere({name: 'Tester'})
    `
  },
  {
    type: "text",
    content: "Operator:"
  },
  {
    type: "runnable",
    content: `
      knex('users').where('columnName', 'like', '%rowlikeme%')
    `
  },
  {
    type: "text",
    content: "The above query demonstrates the common use case of returning all users for which a specific pattern appears within a designated column."
  },
  {
    type: "runnable",
    content: `
      knex('users').where('votes', '>', 100)
    `
  },
  {
    type: "runnable",
    content: `
      const subquery = knex('users').where('votes', '>', 100).andWhere('status', 'active').orWhere('name', 'John').select('id');

      knex('accounts').where('id', 'in', subquery)
    `
  },
  {
    type: "text",
    content: ".orWhere with an object automatically wraps the statement and creates an `or (and - and - and)` clause"
  },
  {
    type: "runnable",
    content: `
      knex('users').where('id', 1).orWhere({votes: 100, user: 'knex'})
    `
  },
  {
    type: "method",
    method: "whereNot",
    example: ".whereNot(~mixed~)",
    children: []
  },
  {
    type: "text",
    content: "Object Syntax:"
  },
  {
    type: "runnable",
    content: `
      knex('users').whereNot({
        first_name: 'Test',
        last_name:  'User'
      }).select('id')
    `
  },
  {
    type: "text",
    content: "Key, Value:"
  },
  {
    type: "runnable",
    content: `
      knex('users').whereNot('id', 1)
    `
  },
  {
    type: "text",
    content: "Grouped Chain:"
  },
  {
    type: "runnable",
    content: `
      knex('users').whereNot(function() {
        this.where('id', 1).orWhereNot('id', '>', 10)
      }).orWhereNot({name: 'Tester'})
    `
  },
  {
    type: "text",
    content: "Operator:"
  },
  {
    type: "runnable",
    content: `
      knex('users').whereNot('votes', '>', 100)
    `
  },
  {
    type: "text",
    content: "CAVEAT: WhereNot is not suitable for \"in\" and \"between\" type subqueries. You should use \"not in\" and \"not between\" instead."
  },
  {
    type: "runnable",
    content: `
      const subquery = knex('users')
        .whereNot('votes', '>', 100)
        .andWhere('status', 'active')
        .orWhere('name', 'John')
        .select('id');

      knex('accounts').where('id', 'not in', subquery)
    `
  },
  {
    type: "method",
    method: "whereIn",
    example: ".whereIn(column|columns, array|callback|builder) / .orWhereIn",
    description: "Shorthand for .where('id', 'in', obj), the .whereIn and .orWhereIn methods add a \"where in\" clause to the query. Note that passing empty array as the value results in a query that never returns any rows (`WHERE 1 = 0`)",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('name').from('users')
            .whereIn('id', [1, 2, 3])
            .orWhereIn('id', [4, 5, 6])
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('name').from('users')
            .whereIn('account_id', function() {
              this.select('id').from('accounts');
            })
        `
      },
      {
        type: "runnable",
        content: `
          const subquery = knex.select('id').from('accounts');

          knex.select('name').from('users')
            .whereIn('account_id', subquery)
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('name').from('users')
            .whereIn(['account_id', 'email'], [[3, 'test3@example.com'], [4, 'test4@example.com']])
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('name').from('users')
            .whereIn(['account_id', 'email'], knex.select('id', 'email').from('accounts'))
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereNotIn",
    example: ".whereNotIn(column, array|callback|builder) / .orWhereNotIn",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereNotIn('id', [1, 2, 3])
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').where('name', 'like', '%Test%').orWhereNotIn('id', [1, 2, 3])
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereNull",
    example: ".whereNull(column) / .orWhereNull",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereNull('updated_at')
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereNotNull",
    example: ".whereNotNull(column) / .orWhereNotNull",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereNotNull('created_at')
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereExists",
    example: ".whereExists(builder | callback) / .orWhereExists",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereExists(function() {
            this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
          })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').whereExists(knex.select('*').from('accounts').whereRaw('users.account_id = accounts.id'))
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereNotExists",
    example: ".whereNotExists(builder | callback) / .orWhereNotExists",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereNotExists(function() {
            this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
          })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').whereNotExists(knex.select('*').from('accounts').whereRaw('users.account_id = accounts.id'))
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereBetween",
    example: ".whereBetween(column, range) / .orWhereBetween",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereBetween('votes', [1, 100])
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereNotBetween",
    example: ".whereNotBetween(column, range) / .orWhereNotBetween",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereNotBetween('votes', [1, 100])
        `
      }
    ]
  },
  {
    type: "method",
    method: "whereRaw",
    example: ".whereRaw(query, [bindings])",
    description: "Convenience helper for .where(knex.raw(query)).",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').whereRaw('id = ?', [1])
        `
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "Join Methods"
  },
  {
    type: "text",
    content: "Several methods are provided which assist in building joins."
  },
  {
    type: "method",
    method: "join",
    example: ".join(table, first, [operator], second)",
    description: "The join builder can be used to specify joins between tables, with the first argument being the joining table, the next three arguments being the first join column, the join operator and the second join column, respectively.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users')
            .join('contacts', 'users.id', '=', 'contacts.user_id')
            .select('users.id', 'contacts.phone')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users')
            .join('contacts', 'users.id', 'contacts.user_id')
            .select('users.id', 'contacts.phone')
        `
      }
    ]
  },
  {
    type: "text",
    content: "For grouped joins, specify a function as the second argument for the join query, and use `on` with `orOn` or `andOn` to create joins that are grouped with parentheses."
  },
  {
    type: "runnable",
    content: `
      knex.select('*').from('users').join('accounts', function() {
        this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
      })
    `
  },
  {
    type: "text",
    content: "For nested join statements, specify a function as first argument of `on`, `orOn` or `andOn`"
  },
  {
    type: "runnable",
    content: `
      knex.select('*').from('users').join('accounts', function() {
        this.on(function() {
          this.on('accounts.id', '=', 'users.account_id')
          this.orOn('accounts.owner_id', '=', 'users.id')
        })
      })
    `
  },
  {
    type: "text",
    content: "It is also possible to use an object to represent the join syntax."
  },
  {
    type: "runnable",
    content: `
      knex.select('*').from('users').join('accounts', {'accounts.id': 'users.account_id'})
    `
  },
  {
    type: "text",
    content: "If you need to use a literal value (string, number, or boolean) in a join instead of a column, use `knex.raw`."
  },
  {
    type: "runnable",
    content: `
      knex.select('*').from('users').join('accounts', 'accounts.type', knex.raw('?', ['admin']))
    `
  },
  {
    type: "method",
    method: "innerJoin",
    example: ".innerJoin(table, ~mixed~)",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.from('users').innerJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.table('users').innerJoin('accounts', 'users.id', '=', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').innerJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "leftJoin",
    example: ".leftJoin(table, ~mixed~)",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').leftJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').leftJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "leftOuterJoin",
    example: ".leftOuterJoin(table, ~mixed~)",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').leftOuterJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').leftOuterJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "rightJoin",
    example: ".rightJoin(table, ~mixed~)",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').rightJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').rightJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "rightOuterJoin",
    example: ".rightOuterJoin(table, ~mixed~)",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').rightOuterJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').rightOuterJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "fullOuterJoin",
    example: ".fullOuterJoin(table, ~mixed~)",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').fullOuterJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').fullOuterJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "crossJoin",
    example: ".crossJoin(table, ~mixed~)",
    description: "Cross join conditions are only supported in MySQL and SQLite3. For join conditions rather use innerJoin.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').crossJoin('accounts')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').crossJoin('accounts', 'users.id', 'accounts.user_id')
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').crossJoin('accounts', function() {
            this.on('accounts.id', '=', 'users.account_id').orOn('accounts.owner_id', '=', 'users.id')
          })
        `
      }
    ]
  },
  {
    type: "method",
    method: "joinRaw",
    example: ".joinRaw(sql, [bindings])",
    description: "",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('accounts').joinRaw('natural full join table1').where('id', 1)
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('accounts').join(knex.raw('natural full join table1')).where('id', 1)
        `
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "OnClauses",
    href: "Builder-on"
  },
  {
    type: "method",
    method: "onIn",
    example: ".onIn(column, values)",
    description: "Adds a onIn clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onIn('contacts.id', [7, 15, 23, 41])
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onNotIn",
    example: ".onNotIn(column, values)",
    description: "Adds a onNotIn clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onNotIn('contacts.id', [7, 15, 23, 41])
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onNull",
    example: ".onNull(column)",
    description: "Adds a onNull clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onNull('contacts.email')
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onNotNull",
    example: ".onNotNull(column)",
    description: "Adds a onNotNull clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onNotNull('contacts.email')
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onExists",
    example: ".onExists(builder | callback)",
    description: "Adds a onExists clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onExists(function() {
            this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
          })
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onNotExists",
    example: ".onNotExists(builder | callback)",
    description: "Adds a onNotExists clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onNotExists(function() {
            this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
          })
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onBetween",
    example: ".onBetween(column, range)",
    description: "Adds a onBetween clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onBetween('contacts.id', [5, 30])
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "onNotBetween",
    example: ".onNotBetween(column, range)",
    description: "Adds a onNotBetween clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').join('contacts', function() {
          this.on('users.id', '=', 'contacts.id').onNotBetween('contacts.id', [5, 30])
        })
        `
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "ClearClauses",
    href: "Builder-clear"
  },
  {
    type: "method",
    method: "clear",
    example: ".clear(statement)",
    description: "Clears the specified operator from the query. Avalilables: 'select' alias 'columns', 'with', 'select', 'columns', 'where', 'union', 'join', 'group', 'order', 'having', 'limit', 'offset', 'counter', 'counters'. Counter(s) alias for method .clearCounter()",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('email', 'name').from('users').where('id', '<', 10).clear('select').clear('where')
        `
      }
    ]
  },
  {
    type: "method",
    method: "clearSelect",
    example: ".clearSelect()",
    description: "Deprecated, use clear('select'). Clears all select clauses from the query, excluding subqueries.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('email', 'name').from('users').clearSelect()
        `
      }
    ]
  },
  {
    type: "method",
    method: "clearWhere",
    example: ".clearWhere()",
    description: "Deprecated, use clear('where'). Clears all where clauses from the query, excluding subqueries.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('email', 'name').from('users').where('id', 1).clearWhere()
        `
      }
    ]
  },
  {
    type: "method",
    method: "clearGroup",
    example: ".clearGroup()",
    description: "Deprecated, use clear('group'). Clears all group clauses from the query, excluding subqueries.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select().from('users').groupBy('id').clearGroup()
        `
      }
    ]
  },
  {
    type: "method",
    method: "clearOrder",
    example: ".clearOrder()",
    description: "Deprecated, use clear('order'). Clears all order clauses from the query, excluding subqueries.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select().from('users').orderBy('name', 'desc').clearOrder()
        `
      }
    ]
  },
  {
    type: "method",
    method: "clearHaving",
    example: ".clearHaving()",
    description: "Deprecated, use clear('having'). Clears all having clauses from the query, excluding subqueries.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select().from('users').having('id', '>', 5).clearHaving()
        `
      }
    ]
  },
  {
    type: "method",
    method: "clearCounters",
    example: ".clearCounters()",
    description: "Clears all increments/decrements clauses from the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex('accounts')
            .where('id', '=', 1)
            .update({ email: 'foo@bar.com' })
            .decrement({
              balance: 50,
            })
            .clearCounters()
        `
      }
    ]
  },
  {
    type: "method",
    method: "distinct",
    example: ".distinct([*columns])",
    description: "Sets a distinct clause on the query. If the parameter is falsy or empty array, method falls back to '*'.",
    children: [
      {
        type: "runnable",
        content: `
          // select distinct 'first_name' from customers
          knex('customers')
            .distinct('first_name', 'last_name')
        `
      },
      {
        type: "runnable",
        content: `
            // select which eleminates duplicate rows
           knex('customers')
            .distinct()
        `
      }
    ]
  },
  {
    type: "method",
    method: "distinctOn",
    example: ".distinctOn([*columns])",
    description: "PostgreSQL only. Adds a distinctOn clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').distinctOn('age')
        `
      }
    ]
  },
  {
    type: "method",
    method: "groupBy",
    example: ".groupBy(*names)",
    description: "Adds a group by clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').groupBy('count')
        `
      }
    ]
  },
  {
    type: "method",
    method: "groupByRaw",
    example: ".groupByRaw(sql)",
    description: "Adds a raw group by clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('year', knex.raw('SUM(profit)')).from('sales').groupByRaw('year WITH ROLLUP')
        `
      }
    ]
  },
  {
    type: "method",
    method: "orderBy",
    example: ".orderBy(column|columns, [direction])",
    description: "Adds an order by clause to the query. column can be string, or list mixed with string and object.",
    children: [
      {
        type: "text",
        content: "Single Column:"
      },
      {
        type: "runnable",
        content: `
          knex('users').orderBy('email')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').orderBy('name', 'desc')
        `
      },
      {
        type: "text",
        content: "Multiple Columns:"
      },
      {
        type: "runnable",
        content: `
          knex('users').orderBy(['email', { column: 'age', order: 'desc' }])
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').orderBy([{ column: 'email' }, { column: 'age', order: 'desc' }])
        `
      }
    ]
  },
  {
    type: "method",
    method: "orderByRaw",
    example: ".orderByRaw(sql)",
    description: "Adds an order by raw clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('table').orderByRaw('col DESC NULLS LAST')
        `
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "Having Clauses",
    href: "Builder-havings"
  },
  {
    type: "method",
    method: "having",
    example: ".having(column, operator, value)",
    description: "Adds a having clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users')
            .groupBy('count')
            .orderBy('name', 'desc')
            .having('count', '>', 100)
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingIn",
    example: ".havingIn(column, values)",
    description: "Adds a havingIn clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').havingIn('id', [5, 3, 10, 17])
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingNotIn",
    example: ".havingNotIn(column, values)",
    description: "Adds a havingNotIn clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').havingNotIn('id', [5, 3, 10, 17])
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingNull",
    example: ".havingNull(column)",
    description: "Adds a havingNull clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').havingNull('email')
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingNotNull",
    example: ".havingNotNull(column)",
    description: "Adds a havingNotNull clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').havingNotNull('email')
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingExists",
    example: ".havingExists(builder | callback)",
    description: "Adds a havingExists clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').havingExists(function() {
          this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingNotExists",
    example: ".havingNotExists(builder | callback)",
    description: "Adds a havingNotExists clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
        knex.select('*').from('users').havingNotExists(function() {
          this.select('*').from('accounts').whereRaw('users.account_id = accounts.id');
        })
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingBetween",
    example: ".havingBetween(column, range)",
    description: "Adds a havingBetween clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').havingBetween('id', [5, 10])
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingNotBetween",
    example: ".havingNotBetween(column, range)",
    description: "Adds a havingNotBetween clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').havingNotBetween('id', [5, 10])
        `
      }
    ]
  },
  {
    type: "method",
    method: "havingRaw",
    example: ".havingRaw(column, operator, value)",
    description: "Adds a havingRaw clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users')
            .groupBy('count')
            .orderBy('name', 'desc')
            .havingRaw('count > ?', [100])
        `
      }
    ]
  },
  {
    type: "method",
    method: "offset",
    example: ".offset(value)",
    description: "Adds an offset clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').offset(10)
        `
      }
    ]
  },
  {
    type: "method",
    method: "limit",
    example: ".limit(value)",
    description: "Adds a limit clause to the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').limit(10).offset(30)
        `
      }
    ]
  },
  {
    type: "method",
    method: "union",
    example: ".union([*queries], [wrap])",
    description: "Creates a union query, taking an array or a list of callbacks, builders, or raw statements to build the union statement, with optional boolean wrap. If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').union(function() {
            this.select('*').from('users').whereNull('first_name')
          })
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').union([
            knex.select('*').from('users').whereNull('first_name')
          ])
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').union(
            knex.raw('select * from users where first_name is null'),
            knex.raw('select * from users where email is null')
          )
        `
      }
    ]
  },
  {
    type: "method",
    method: "unionAll",
    example: ".unionAll([*queries], [wrap])",
    description: "Creates a union all query, with the same method signature as the union method.  If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').unionAll(function() {
            this.select('*').from('users').whereNull('first_name');
          })
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').unionAll([
            knex.select('*').from('users').whereNull('first_name')
          ])
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').unionAll(
            knex.raw('select * from users where first_name is null'),
            knex.raw('select * from users where email is null')
          )
        `
      }
    ]
  },
  {
    type: "method",
    method: "intersect",
    example: ".intersect([*queries], [wrap])",
    description: "Creates an intersect query, taking an array or a list of callbacks, builders, or raw statements to build the intersect statement, with optional boolean wrap. If the `wrap` parameter is `true`, the queries will be individually wrapped in parentheses. The intersect method is unsupported on MySQL.",
    children: [
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').intersect(function() {
            this.select('*').from('users').whereNull('first_name')
          })
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').intersect([
            knex.select('*').from('users').whereNull('first_name')
          ])
        `
      },
      {
        type: "runnable",
        content: `
          knex.select('*').from('users').whereNull('last_name').intersect(
            knex.raw('select * from users where first_name is null'),
            knex.raw('select * from users where email is null')
          )
        `
      }
    ]
  },
  {
    type: "method",
    method: "insert",
    example: ".insert(data, [returning], [options])",
    description: "Creates an insert query, taking either a hash of properties to be inserted into the row, or an array of inserts, to be executed as a single insert command. If returning array is passed e.g. ['id', 'title'], it resolves the promise / fulfills the callback with an array of all the added rows with specified columns. It's a shortcut for [returning method](#Builder-returning)",
    children: [
      {
        type: "runnable",
        content: `
          // Returns [1] in \"mysql\", \"sqlite\", \"oracle\"; [] in \"postgresql\" unless the 'returning' parameter is set.
          knex('books').insert({title: 'Slaughterhouse Five'})
        `
      },
      {
        type: "runnable",
        content: `
          // Normalizes for empty keys on multi-row insert:
          knex('coords').insert([{x: 20}, {y: 30},  {x: 10, y: 20}])
        `
      },
      {
        type: "runnable",
        content: `
          // Returns [2] in \"mysql\", \"sqlite\"; [2, 3] in \"postgresql\"
          knex.insert([{title: 'Great Gatsby'}, {title: 'Fahrenheit 451'}], ['id']).into('books')
        `
      },
      {
        type: "text",
        content: "For MSSQL, triggers on tables can interrupt returning a valid value from the standard insert statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set."
      },
      {
        type: "code",
        language: "js",
        content: `
          // Adding the option includeTriggerModifications allows you to 
          // run statements on tables that contain triggers. Only affects MSSQL.
          knex('books')
            .insert({title: 'Alice in Wonderland'}, ['id'], { includeTriggerModifications: true })
        `
      }
    ]
  },
  {
    type: "text",
    content: "If one prefers that undefined keys are replaced with `NULL` instead of `DEFAULT` one may give `useNullAsDefault` configuration parameter in knex config."
  },
  {
    type: "code",
    language: "js",
    content: `
      const knex = require('knex')({
        client: 'mysql',
        connection: {
          host : '127.0.0.1',
          user : 'your_database_user',
          password : 'your_database_password',
          database : 'myapp_test'
        },
        useNullAsDefault: true
      });

      knex('coords').insert([{x: 20}, {y: 30}, {x: 10, y: 20}])
      // insert into \`coords\` (\`x\`, \`y\`) values (20, NULL), (NULL, 30), (10, 20)"
    `
  },
  {
    type: "method",
    method: "onConflict",
    example: "insert(..).onConflict(column) / insert(..).onConflict([column1, column2, ...])",
    description: "Implemented for the PostgreSQL, MySQL, and SQLite databases. A modifier for insert queries that specifies alternative behaviour in the case of a conflict. A conflict occurs when a table has a PRIMARY KEY or a UNIQUE index on a column (or a composite index on a set of columns) and a row being inserted has the same value as a row which already exists in the table in those column(s). The default behaviour in case of conflict is to raise an error and abort the query. Using this method you can change this behaviour to either silently ignore the error by using .onConflict().ignore() or to update the existing row with new data (perform an \"UPSERT\") by using .onConflict().merge().",
    children: [
      {
        type: "text",
        content: "Note: For PostgreSQL and SQLite, the column(s) specified by this method must either be the table's PRIMARY KEY or have a UNIQUE index on them, or the query will fail to execute. When specifying multiple columns, they must be a composite PRIMARY KEY or have composite UNIQUE index. MySQL will ignore the specified columns and always use the table's PRIMARY KEY. For cross-platform support across PostgreSQL, MySQL, and SQLite you must both explicitly specifiy the columns in .onConflict() and those column(s) must be the table's PRIMARY KEY."
      },
      {
        type: "text",
        content: "See documentation on .ignore() and .merge() methods for more details."
      }
    ]
  },
  {
    type: "method",
    method: "ignore",
    example: "insert(..).onConflict(..).ignore()",
    description: "Implemented for the PostgreSQL, MySQL, and SQLite databases. Modifies an insert query, and causes it to be silently dropped without an error if a conflict occurs. Uses INSERT IGNORE in MySQL, and adds an ON CONFLICT (columns) DO NOTHING clause to the insert statement in PostgreSQL and SQLite.",
    children: [
      {
        type: "runnable",
        content: `
          knex('tableName')
            .insert({
              email: "ignore@example.com",
              name: "John Doe"
            })
            .onConflict('email')
            .ignore()
        `
      }
    ]
  },
  {
    type: "method",
    method: "merge",
    example: "insert(..).onConflict(..).merge() / insert(..).onConflict(..).merge(updates)",
    description: "Implemented for the PostgreSQL, MySQL, and SQLite databases. Modifies an insert query, to turn it into an 'upsert' operation. Uses ON DUPLICATE KEY UPDATE in MySQL, and adds an ON CONFLICT (columns) DO UPDATE clause to the insert statement in PostgreSQL and SQLite.",
    children: [
      {
        type: "runnable",
        content: `
          knex('tableName')
            .insert({
              email: "ignore@example.com",
              name: "John Doe"
            })
            .onConflict('email')
            .merge()
        `
      },
      {
        type: "text",
        content: "This also works with batch inserts:"
      },
      {
        type: "runnable",
        content: `
          knex('tableName')
            .insert(
              { email: "john@example.com", name: "John Doe" },
              { email: "jane@example.com", name: "Jane Doe" },
              { email: "alex@example.com", name: "Alex Doe" },
            )
            .onConflict('email')
            .merge()
        `
      },
      {
        type: "text",
        content: "It is also possible to specify data to update seperately from the data to insert. This is useful if you only want to update a subset of the columns. For example, you may want to set a 'created_at' column when inserting but would prefer not to update it if the row already exists:"
      },
      {
        type: "code",
        language: "js",
        content: `
          const timestamp = Date.now();
          knex('tableName')
            .insert({
              email: "ignore@example.com",
              name: "John Doe",
              created_at: timestamp,
              updated_at: timestamp,
            })
            .onConflict('email')
            .merge({
              name: "John Doe",
              updated_at: timestamp,
            })
        `
      },
      {
        type: "text",
        content: "**For PostgreSQL/SQLite databases only**, it is also possible to add [a WHERE clause](#Builder-wheres) to conditionally update only the matching rows:"
      },
      {
        type: "code",
        language: "js",
        content: `
          const timestamp = Date.now();
          knex('tableName')
            .insert({
              email: "ignore@example.com",
              name: "John Doe",
              created_at: timestamp,
              updated_at: timestamp,
            })
            .onConflict('email')
            .merge({
              name: "John Doe",
              updated_at: timestamp,
            })
            .where('updated_at', '<', timestamp)
        `
      },
    ]
  },
  {
    type: "method",
    method: "update",
    example: ".update(data, [returning], [options]) / .update(key, value, [returning], [options])",
    description: "Creates an update query, taking a hash of properties or a key/value pair to be updated based on the other query constraints. If returning array is passed e.g. ['id', 'title'], it resolves the promise / fulfills the callback with an array of all the updated rows with specified columns. It's a shortcut for [returning method](#Builder-returning)",
    children: [
      {
        type: "runnable",
        content: `
          knex('books')
            .where('published_date', '<', 2000)
            .update({
              status: 'archived',
              thisKeyIsSkipped: undefined
            })
        `
      },
      {
        type: "runnable",
        content: `
          // Returns [1] in \"mysql\", \"sqlite\", \"oracle\"; [] in \"postgresql\" unless the 'returning' parameter is set.
          knex('books').update('title', 'Slaughterhouse Five')
        `
      },
      {
        type: "runnable",
        content: `
          // Returns [ { id: 42, title: "The Hitchhiker's Guide to the Galaxy" } ]
          knex('books')
            .where({ id: 42 })
            .update({ title: "The Hitchhiker's Guide to the Galaxy" }, ['id', 'title'])
        `
      },
      {
        type: "text",
        content: "For MSSQL, triggers on tables can interrupt returning a valid value from the standard update statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set."
      },
      {
        type: "code",
        language: "js",
        content: `
          // Adding the option includeTriggerModifications allows you 
          // to run statements on tables that contain triggers. Only affects MSSQL.
          knex('books')
            .update({title: 'Alice in Wonderland'}, ['id', 'title'], { includeTriggerModifications: true })
        `
      }
    ]
  },
  {
    type: "method",
    method: "del / delete",
    example: ".del([returning], [options])",
    description: "Aliased to del as delete is a reserved word in JavaScript, this method deletes one or more rows, based on other conditions specified in the query. Resolves the promise / fulfills the callback with the number of affected rows for the query.",
    children: [
      {
        type: "runnable",
        content: `
          knex('accounts')
            .where('activated', false)
            .del()
        `
      },
      {
        type: "text",
        content: "For MSSQL, triggers on tables can interrupt returning a valid value from the standard delete statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set."
      },
      {
        type: "code",
        language: "js",
        content: `
          // Adding the option includeTriggerModifications allows you 
          // to run statements on tables that contain triggers. Only affects MSSQL.
          knex('books')
            .where('title', 'Alice in Wonderland')
            .del(['id', 'title'], { includeTriggerModifications: true })
        `
      }
    ]
  },
  {
    type: "method",
    method: "returning",
    example: ".returning(column, [options]) / .returning([column1, column2, ...], [options])",
    description: "Utilized by PostgreSQL, MSSQL, and Oracle databases, the returning method specifies which column should be returned by the insert, update and delete methods. Passed column parameter may be a string or an array of strings. When passed in a string, makes the SQL result be reported as an array of values from the specified column. When passed in an array of strings, makes the SQL result be reported as an array of objects, each containing a single property for each of the specified columns. The returning method is not supported on Amazon Redshift.",
    children: [
      {
        type: "runnable",
        content: `
          // Returns [1]
          knex('books')
            .returning('id')
            .insert({title: 'Slaughterhouse Five'})
        `
      },
      {
        type: "runnable",
        content: `
          // Returns [2] in \"mysql\", \"sqlite\"; [2, 3] in \"postgresql\"
          knex('books')
            .returning('id')
            .insert([{title: 'Great Gatsby'}, {title: 'Fahrenheit 451'}])
        `
      },
      {
        type: "runnable",
        content: `
          // Returns [ { id: 1, title: 'Slaughterhouse Five' } ]
          knex('books')
            .returning(['id','title'])
            .insert({title: 'Slaughterhouse Five'})
        `
      },
      {
        type: "text",
        content: "For MSSQL, triggers on tables can interrupt returning a valid value from the standard DML statements. You can add the `includeTriggerModifications` option to get around this issue. This modifies the SQL so the proper values can be returned. This only modifies the statement if you are using MSSQL, a returning value is specified, and the `includeTriggerModifications` option is set."
      },
      {
        type: "code",
        language: "js",
        content: `
          // Adding the option includeTriggerModifications allows you 
          // to run statements on tables that contain triggers. Only affects MSSQL.
          knex('books')
            .returning(['id','title'], { includeTriggerModifications: true })
            .insert({title: 'Slaughterhouse Five'})
        `
      }
    ]
  },
  {
    type: "method",
    method: "transacting",
    example: ".transacting(transactionObj)",
    description: "Used by knex.transaction, the transacting method may be chained to any query and passed the object you wish to join the query as part of the transaction for.",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          const Promise = require('bluebird');
          knex.transaction(function(trx) {
            knex('books').transacting(trx).insert({name: 'Old Books'})
              .then(function(resp) {
                const id = resp[0];
                return someExternalMethod(id, trx);
              })
              .then(trx.commit)
              .catch(trx.rollback);
          })
          .then(function(resp) {
            console.log('Transaction complete.');
          })
          .catch(function(err) {
            console.error(err);
          });
        `
      }
    ]
  },
  {
    type: "method",
    method: "forUpdate",
    example: ".transacting(t).forUpdate()",
    description: "Dynamically added after a transaction is specified, the forUpdate adds a FOR UPDATE in PostgreSQL and MySQL during a select statement. Not supported on Amazon Redshift due to lack of table locks.",
    children: [
      {
        type: "runnable",
        content: `
          knex('tableName')
            .transacting(trx)
            .forUpdate()
            .select('*')
        `
      }
    ]
  },
  {
    type: "method",
    method: "forShare",
    example: ".transacting(t).forShare()",
    description: "Dynamically added after a transaction is specified, the forShare adds a FOR SHARE in PostgreSQL and a LOCK IN SHARE MODE for MySQL during a select statement. Not supported on Amazon Redshift due to lack of table locks.",
    children: [
      {
        type: "runnable",
        content: `
          knex('tableName')
            .transacting(trx)
            .forShare()
            .select('*')
        `
      }
    ]
  },
  {
    type: "method",
    method: "skipLocked",
    example: ".skipLocked()",
    description: "MySQL 8.0+ and PostgreSQL 9.5+ only. This method can be used after a lock mode has been specified with either forUpdate or forShare, and will cause the query to skip any locked rows, returning an empty set if none are available.",
    children: [
      {
        type: "runnable",
        content: `
          knex('tableName')
            .select('*')
            .forUpdate()
            .skipLocked()
        `
      }
    ]
  },
  {
    type: "method",
    method: "noWait",
    example: ".noWait()",
    description: "MySQL 8.0+ and PostgreSQL 9.5+ only. This method can be used after a lock mode has been specified with either forUpdate or forShare, and will cause the query to fail immediately if any selected rows are currently locked.",
    children: [
      {
        type: "runnable",
        content: `
          knex('tableName')
            .select('*')
            .forUpdate()
            .noWait()
        `
      }
    ]
  },
  {
    type: "method",
    method: "count",
    example: ".count(column|columns|raw, [options])",
    description: "Performs a count on the specified column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions. The value returned from count (and other aggregation queries) is an array of objects like: `[{'COUNT(*)': 1}]`. The actual keys are dialect specific, so usually we would want to specify an alias (Refer examples below). Note that in Postgres, count returns a bigint type which will be a String and not a Number ([more info](https://github.com/brianc/node-pg-types#use)).",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').count('active')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count('active', {as: 'a'})
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count('active as a')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count({ a: 'active' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count({ a: 'active', v: 'valid' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count('id', 'active')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count({ count: ['id', 'active'] })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').count(knex.raw('??', ['active']))
        `
      },
      {
        type: "heading",
        size: "md",
        content: "Usage with TypeScript"
      },
      {
        type: "text",
        content: "The value of count will, by default, have type of `string | number`. This may be counter-intuitive but some connectors (eg. postgres) will automatically cast BigInt result to string when javascript's Number type is not large enough for the value."
      },
      {
        type: "code",
        language: "ts",
        content: `
          knex('users').count('age') // Resolves to: Record<string, number | string>

          knex('users').count({count: '*'}) // Resolves to { count?: string | number | undefined; }
        `
      },
      {
        type: "text",
        content: "Working with `string | number` can be inconvenient if you are not working with large tables. Two alternatives are available:"
      },
      {
        type: "code",
        language: "ts",
        content: `
          // Be explicit about what you want as a result:
          knex('users').count<Record<string, number>>('age');

          // Setup a one time declaration to make knex use number as result type for all
          // count and countDistinct invocations (for any table)
          declare module "knex/types/result" {
              interface Registry {
                  Count: number;
              }
          }
        `
      }
    ]
  },
  {
    type: "text",
    content: "Use **countDistinct** to add a distinct expression inside the aggregate function."
  },
  {
    type: "runnable",
    content: `
      knex('users').countDistinct('active')
    `
  },
  {
    type: "method",
    method: "min",
    example: ".min(column|columns|raw, [options])",
    description: "Gets the minimum value for the specified column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').min('age')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min('age', {as: 'a'})
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min('age as a')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min({ a: 'age' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min({ a: 'age', b: 'experience' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min('age', 'logins')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min({ min: ['age', 'logins'] })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').min(knex.raw('??', ['age']))
        `
      }
    ]
  },
  {
    type: "method",
    method: "max",
    example: ".max(column|columns|raw, [options])",
    description: "Gets the maximum value for the specified column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').max('age')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max('age', {as: 'a'})
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max('age as a')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max({ a: 'age' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max('age', 'logins')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max({ max: ['age', 'logins'] })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max({ max: 'age', exp: 'experience' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').max(knex.raw('??', ['age']))
        `
      }
    ]
  },
  {
    type: "method",
    method: "sum",
    example: ".sum(column|columns|raw)",
    description: "Retrieve the sum of the values of a given column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').sum('products')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').sum('products as p')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').sum({ p: 'products' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').sum('products', 'orders')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').sum({ sum: ['products', 'orders'] })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').sum(knex.raw('??', ['products']))
        `
      }
    ]
  },
  {
    type: "text",
    content: "Use **sumDistinct** to add a distinct expression inside the aggregate function."
  },
  {
    type: "runnable",
    content: `
      knex('users').sumDistinct('products')
    `
  },
  {
    type: "method",
    method: "avg",
    example: ".avg(column|columns|raw)",
    description: "Retrieve the average of the values of a given column or array of columns (note that some drivers do not support multiple columns). Also accepts raw expressions.",
    children: [
      {
        type: "runnable",
        content: `
          knex('users').avg('age')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').avg('age as a')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').avg({ a: 'age' })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').avg('age', 'logins')
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').avg({ avg: ['age', 'logins'] })
        `
      },
      {
        type: "runnable",
        content: `
          knex('users').avg(knex.raw('??', ['age']))
        `
      }
    ]
  },
  {
    type: "text",
    content: "Use **avgDistinct** to add a distinct expression inside the aggregate function."
  },
  {
    type: "runnable",
    content: `
      knex('users').avgDistinct('age')
    `
  },
  {
    type: "method",
    method: "increment",
    example: ".increment(column, amount)",
    description: "Increments a column value by the specified amount. Object syntax is supported for `column`.",
    children: [
      {
        type: "runnable",
        content: `
          knex('accounts')
            .where('userid', '=', 1)
            .increment('balance', 10)
        `
      },
      {
        type: "runnable",
        content: `
          knex('accounts')
            .where('id', '=', 1)
            .increment({
              balance: 10,
              times: 1,
            })
        `
      }
    ]
  },
  {
    type: "method",
    method: "decrement",
    example: ".decrement(column, amount)",
    description: "Decrements a column value by the specified amount. Object syntax is supported for `column`.",
    children: [
      {
        type: "runnable",
        content: `
          knex('accounts').where('userid', '=', 1).decrement('balance', 5)
        `
      },
      {
        type: "runnable",
        content: `
          knex('accounts')
            .where('id', '=', 1)
            .decrement({
              balance: 50,
            })
        `
      }
    ]
  },
  {
    type: "method",
    method: "truncate",
    example: ".truncate()",
    description: "Truncates the current table.",
    children: [
      {
        type: "runnable",
        content: `
          knex('accounts').truncate()
        `
      }
    ]
  },
  {
    type: "method",
    method: "pluck",
    example: ".pluck(id)",
    description: "This will pluck the specified column from each row in your results, yielding a promise which resolves to the array of values selected.",
    children: [
      {
        type: "code",
        language: "js",
        content: "knex.table('users').pluck('id').then(function(ids) { console.log(ids); });"
      }
    ]
  },
  {
    type: "method",
    method: "first",
    example: ".first([columns])",
    description: "Similar to select, but only retrieves & resolves with the first record from the query.",
    children: [
      {
        type: "code",
        language: "js",
        content: "knex.table('users').first('id', 'name').then(function(row) { console.log(row); });"
      }
    ]
  },
  {
    type: "method",
    method: "hintComment",
    example: ".hintComment(hint|hints)",
    description: "Add hints to the query using comment-like syntax `/*+ ... */`. MySQL and Oracle use this syntax for optimizer hints. Also various DB proxies and routers use this syntax to pass hints to alter their behavior. In other dialects the hints are ignored as simple comments.",
    children: [
      {
        type: "runnable",
        content: `
          knex('accounts').where('userid', '=', 1).hintComment('NO_ICP(accounts)')
        `
      }
    ]
  },
  {
    type: "method",
    method: "clone",
    example: ".clone()",
    description: "Clones the current query chain, useful for re-using partial query snippets in other queries without mutating the original.",
    children: []
  },
  {
    type: "method",
    method: "denseRank",
    example: ".denseRank(alias, ~mixed~)",
    children: [    ]
  },
  {
    type: "text",
    content: "Add a dense_rank() call to your query. For all the following queries, alias can be set to a falsy value if not needed."
  },
  {
    type: "text",
    content: "String Syntax — .denseRank(alias, orderByClause, [partitionByClause]) :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').denseRank('alias_name', 'email', 'firstName')
    `
  },
  {
    type: "text",
    content: "It also accepts arrays of strings as argument :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').denseRank('alias_name', ['email', 'address'], ['firstName', 'lastName'])
    `
  },
  {
    type: "text",
    content: "Raw Syntax — .denseRank(alias, rawQuery) :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').denseRank('alias_name', knex.raw('order by ??', ['email']))
    `
  },
  {
    type: "text",
    content: "Function Syntax — .denseRank(alias, function) :",
  },
  {
    type: "text",
    content: "Use orderBy() and partitionBy() (both chainable) to build your query :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').denseRank('alias_name', function() {
        this.orderBy('email').partitionBy('firstName')
      })
    `
  },
  {
    type: "method",
    method: "rank",
    example: ".rank(alias, ~mixed~)",
    children: [    ]
  },
  {
    type: "text",
    content: "Add a rank() call to your query. For all the following queries, alias can be set to a falsy value if not needed."
  },
  {
    type: "text",
    content: "String Syntax — .rank(alias, orderByClause, [partitionByClause]) :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rank('alias_name', 'email', 'firstName')
    `
  },
  {
    type: "text",
    content: "It also accepts arrays of strings as argument :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rank('alias_name', ['email', 'address'], ['firstName', 'lastName'])
    `
  },
  {
    type: "text",
    content: "Raw Syntax — .rank(alias, rawQuery) :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rank('alias_name', knex.raw('order by ??', ['email']))
    `
  },
  {
    type: "text",
    content: "Function Syntax — .rank(alias, function) :",
  },
  {
    type: "text",
    content: "Use orderBy() and partitionBy() (both chainable) to build your query :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rank('alias_name', function() {
        this.orderBy('email').partitionBy('firstName')
      })
    `
  },
  {
    type: "method",
    method: "rowNumber",
    example: ".rowNumber(alias, ~mixed~)",
    children: [    ]
  },
  {
    type: "text",
    content: "Add a row_number() call to your query. For all the following queries, alias can be set to a falsy value if not needed."
  },
  {
    type: "text",
    content: "String Syntax — .rowNumber(alias, orderByClause, [partitionByClause]) :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rowNumber('alias_name', 'email', 'firstName')
    `
  },
  {
    type: "text",
    content: "It also accepts arrays of strings as argument :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rowNumber('alias_name', ['email', 'address'], ['firstName', 'lastName'])
    `
  },
  {
    type: "text",
    content: "Raw Syntax — .rowNumber(alias, rawQuery) :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rowNumber('alias_name', knex.raw('order by ??', ['email']))
    `
  },
  {
    type: "text",
    content: "Function Syntax — .rowNumber(alias, function) :",
  },
  {
    type: "text",
    content: "Use orderBy() and partitionBy() (both chainable) to build your query :",
  },
  {
    type: "runnable",
    content: `
      knex('users').select('*').rowNumber('alias_name', function() {
        this.orderBy('email').partitionBy('firstName')
      })
    `
  },
  {
    type: "method",
    method: "modify",
    example: ".modify(fn, *arguments)",
    description: "Allows encapsulating and re-using query snippets and common behaviors as functions. The callback function should receive the query builder as its first argument, followed by the rest of the (optional) parameters passed to modify.",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          const withUserName = function(queryBuilder, foreignKey) {
            queryBuilder.leftJoin('users', foreignKey, 'users.id').select('users.user_name');
          };
          knex.table('articles').select('title', 'body').modify(withUserName, 'articles_user.id').then(function(article) {
            console.log(article.user_name);
          });
        `
      }
    ]
  },
  {
    type: "method",
    method: "columnInfo",
    example: ".columnInfo([columnName])",
    description: "Returns an object with the column info about the current table, or an individual column if one is passed, returning an object with the following keys:*   **defaultValue**: the default value for the column*   **type**: the column type*   **maxLength**: the max length set for the column*   **nullable**: whether the column may be null",
    children: [
      {
        type: "code",
        language: "js",
        content: "knex('users').columnInfo().then(function(info) { // ... });"
      }
    ]
  },
  {
    type: "method",
    method: "debug",
    example: ".debug([enabled])",
    description: "Overrides the global debug setting for the current query chain. If enabled is omitted, query debugging will be turned on.",
    children: []
  },
  {
    type: "method",
    method: "connection",
    example: ".connection(dbConnection)",
    description: "The method sets the db connection to use for the query without using the connection pool. You should pass to it the same object that acquireConnection() for the corresponding driver returns",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          const Pool = require('pg-pool')
          const pool = new Pool({ ... })
          const connection = await pool.connect();
            try {
              return await knex.connection(connection); // knex here is a query builder with query already built
            } catch (error) {
              // Process error
            } finally {
              connection.release();
            }
        `
      }
    ]
  },
  {
    type: "method",
    method: "options",
    example: ".options()",
    description: "Allows for mixing in additional options as defined by database client specific libraries:",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          knex('accounts as a1')
            .leftJoin('accounts as a2', function() {
              this.on('a1.email', '<>', 'a2.email');
            })
            .select(['a1.email', 'a2.email'])
            .where(knex.raw('a1.id = 1'))
            .options({ nestTables: true, rowMode: 'array' })
            .limit(2)
            .then(...
        `
      }
    ]
  },
  {
    type: "method",
    method: "queryContext",
    example: ".queryContext(context)",
    href: "Builder-queryContext",
    children: [
      {
        type: 'text',
        content: [
          "Allows for configuring a context to be passed to the [wrapIdentifier](#Installation-wrap-identifier) and",
          "[postProcessResponse](#Installation-post-process-response) hooks:",
        ].join(" ")
      },
      {
        type: "code",
        language: "js",
        content: `
          knex('accounts as a1')
            .queryContext({ foo: 'bar' })
            .select(['a1.email', 'a2.email'])
        `
      },
      {
        type: "text",
        content: [
          "The context can be any kind of value and will be passed to the hooks without modification.",
          "However, note that **objects will be shallow-cloned** when a query builder instance is [cloned](#Builder-clone),",
          "which means that they will contain all the properties of the original object but will not be the same object reference.",
          "This allows modifying the context for the cloned query builder instance.",
        ].join(" ")
      },
      {
        type: "text",
        content: "Calling `queryContext` with no arguments will return any context configured for the query builder instance."
      }
    ]
  },
  {
    type: "heading",
    size: "md",
    content: "Extending Query Builder",
    href: "Builder-extending"
  },
  {
    type: "text",
    content: [
      "**Important:** this feature is experimental and its API may change in the future.",
      "It allows to add custom function the the Query Builder.",
      "Example:"
    ]
  },
  {
    type: "code",
    language: "js",
    content: `
      const Knex = require('knex');
      Knex.QueryBuilder.extend('customSelect', function(value) {
        return this.select(this.client.raw(\`\${value} as value\`));
      });

      const meaningOfLife = await knex('accounts')
        .customSelect(42);
    `
  },
  {
    type: "text",
    content: [
      "If using TypeScript, you can extend the QueryBuilder interface with your custom method.",
      "1. Create a `knex.d.ts` file inside a `@types` folder (or any other folder).",
    ]
  },
  {
    type: "code",
    language: "ts",
    content: `
      // knex.d.ts

      import { Knex } from 'knex';

      declare module 'knex' {
        interface QueryBuilder {
        customSelect<TRecord, TResult>(value: number): Knex.QueryBuilder<TRecord, TResult>;
      }
    `
  },
  {
    type: "text",
    content: [
      "2. Add the new `@types` folder to `typeRoots` in your `tsconfig.json`.",
    ]
  },
  {
    type: "code",
    language: "ts",
    content: `
      // tsconfig.json

      {
        "compilerOptions": {
          "typeRoots": [
            "node_modules/@types",
            "@types"
          ],
        }
      }
    `
  },
]

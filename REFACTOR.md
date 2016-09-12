### 1.0 Refactor branch info (subject to change)

I've commented on several prior tickets about the 1.0 API refactor, and have been working locally on a few iterations of modifying the API to get closer to what I'd see as an ideal API which would make Knex worthy of a 1.0 release.

With the number of weird edge cases which currently exist in the interal API, I felt it'd be smoother not to push a big bang rewrite of everything but instead incrementally refactor by:

1. laying out the plan of what should be added
1. prioritizing most essential changes 
1. backing in toward other nice-to-have's and better overall structure

This way, anyone interested can comment / give input about the overall ideas direction and contribute fixes, etc.

#### Overview:

Currently, there are a few internal classes which make up the structure of core Knex:

1. Client:
  1. generation of SQL specific to a dialect
  1. normalizing API's between multiple clients
  1. pool / resource management
1. Transaction: deal exlusively with wrapping an SQL block with transaction statements
1. Builder / Compiler: Taking the knex API and formatting into parameterized SQL statements

#### Overview, 1.0:

In the 1.0 version of Knex, we will be separating these classes a bit differently:

1. Dialect: Normalizes sql across languages
1. Adapter: Normalizes db interaction across
1. Client: Adapter + Dialect
1. Context: Client + Single Connection + Logging 
1. Transaction: Specialized Context

##### Context

The "Context" is the important addition, as it will ensure multiple connections are executed on the same connection, and provide a single knex object which groups info about multiple queries, particularly useful for logging all queries which happen across a single req/res cycle. A connection will not be checked out from the pool until the first query is executed, making contexts inexpensive and worth using by default at the middleware level:

```js
const knex = require('knex')(process.env.KNEX_CONNECTION_STRING)

app.use((req, res, next) => {
  req.knex = knex.context()
  onFinshed(res, (err, res) => {
    req.knex.close()
    req.knex = null
  })  
  next()
})
```

##### Transactions

Transactions will also utilize context, making them inexpensive to use, it won't acquire a connection until the first query is executed on a connection:

```js
const onFinished = require('on-finished')
const onHeaders = require('on-headers')
const knex = require('knex')(process.env.KNEX_CONNECTION_STRING)

app.use((req, res, next) => {
  
  // Use a transaction for mutative methods:
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    req.knex = knex.transaction()
    // Need to commit / rollback the transaction in later middleware
    onHeaders(res, function(err) {
      if (req.knex.isActiveTransaction()) { // (API TBD)
        throw new Error(`Transaction not comitted / rolled back in ${req.url}`)
      }
    })

  // Otherwise, checkout a connection without a transaction block:
  } else {
    req.knex = knex.context()
    onFinshed(res, (err, res) => {
      req.knex.close()
      req.knex = null
    })    
  }
  
  next()
})
```

#### Other Important API additions / changes:

1. knex.sql tagged template string
1. Standardized API for custom value interpolation
1. Hooks
1. Better value escaping per-dialect
1. Custom logging / more user-fieldly logging & errors
1. Ability to use knex without a connection pool / with clustered pools
1. Missing features like modifying columns, etc.
1. Proper A+ promise behavior when calling `.then` on the same chain more than once

##### knex.sql

This will allow folks to easily build sql strings, ensuring proper parameterization / escaping:

```js
knex.sql`
  SELECT * FROM ${knex.escapeId(table)} where id = ${id}
`.then(() => {
  
})
```

along with this, you'll be able to use async / await with knex.sql

```js
await knex.sql`
  SELECT * FROM 'accounts' where id = ${id}
`
```

##### Standardized APIs for custom value interpolation

The goal here is for folks to be able to create a standard way of dealing with the interpolated values (simplifying the current internal formatter, and allowing for easy third party extension).

Current proposed API: Object tagged with a global symbol `Symbol.for('knex/expression')`, containing a required "toSQL" method, which returns an object with an `sql` and optional `bindings`.

```js
const KNEX = Symbol.for('knex/expression')

const value = {
  [KNEX]: true,
  toSQL() {
    return {
      sql: 'SOME SQL STRING',
      bindings: []
    }
  }
}
```

Internal classes will begin to use this convention, with the `KNEX` property set to the name of the class, which will be used in favor of `instanceof` checks, allowing folks to potentially create their own extensions / query building classes.

##### Hooks

Hooks will act similarly to events, but allow for mutating query values as they come in from the SQL server but before they are executed.

###### Definite additions:

- transformRow: Transforms each row as they come in, similar to a stream
- transformResult: Transforms the entire response, before resolving the promise

###### Likely additions: 

- beforeFirst: Before first query is executed for a context, useful for transactions / connection variable preparation
- beforeQuery: Before a query is executed
- afterQuery: After a query is executed, before the result is provided
- beforeEnd: Before a connection is released from a context & put back in the pool, optionally async


##### Ability to use knex without a connection pool / with clustered pools

Folks have asked for this before, and I think creating a convention for supplying a config option for acquiring raw driver connections / supplying custom pools will do the trick here.

##### Missing features like modifying columns, etc.

I know column modification is a huge missing feature, this is something that should be easier to add in as things are cleaned up.

----

###### Possible Additions: 

- interceptQuery: Intercept a query and respond with a fake value, maybe useful when testing

##### Standardized value escaping per dialect

Currently the value escaping happens in a few different places, sometimes in the knex client, sometimes in the underlying DB library, sometimes in helper functions for cases like Oracle, etc. What we'd like to do here is have a standardized way of knowing what is escaped where.

##### Better logging

There should be a configurable logging creation, which will use console.log by default but allow users to supply their own log configuration for debugging. An API spec will be added here once we get there.

#### Reach goals

1. `asPartial`
1. test refactor
1. properly constructed prepared statements
1. modularize things into a monorepo (lerna or similar)
1. seeds / migrations improvements

##### asPartial

Discussed in a few tickets, something that would be useful, but would require quite a bit of internal refactoring in the query building chain. Will add more info if/when we get here.

##### Test refactor

Tests are a bit of a mess right now, difficult to follow, test across different drivers etc. This is a big task, which is why it's added as a reach goal - but it's something that should happen 

##### Properly constructed prepared statements

The difficulty with properly constructed prepared statements is the requirement that prepared statements execute on the same connection. The "context" addition should help in getting closer to this, but that still does not help with knowing which connection to checkout from the pool. Something to keep in mind.

##### Modularizing

For knex, this isn't necessarily a goal - most of the pieces of knex aren't really re-usable outside of knex, but it'd be good to design things more modularly for testing purposes, etc.

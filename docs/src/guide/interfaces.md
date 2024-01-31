# Interfaces

Knex.js provides several options to deal with query output. The following methods are present on the query builder, schema builder, and the raw builder:

## Promises

[Promises](https://github.com/petkaantonov/bluebird#what-are-promises-and-why-should-i-use-them) are the preferred way of dealing with queries in knex, as they allow you to return values from a fulfillment handler, which in turn become the value of the promise. The main benefit of promises are the ability to catch thrown errors without crashing the node app, making your code behave like a **.try / .catch / .finally** in synchronous code.

```js
knex
  .select('name')
  .from('users')
  .where('id', '>', 20)
  .andWhere('id', '<', 200)
  .limit(10)
  .offset(x)
  .then(function (rows) {
    return _.pluck(rows, 'name');
  })
  .then(function (names) {
    return knex.select('id').from('nicknames').whereIn('nickname', names);
  })
  .then(function (rows) {
    console.log(rows);
  })
  .catch(function (error) {
    console.error(error);
  });
```

### then

**.then(onFulfilled, [onRejected])**

Coerces the current query builder chain into a promise state, accepting the resolve and reject handlers as specified by the Promises/A+ spec. As stated in the spec, more than one call to the then method for the current query chain will resolve with the same value, in the order they were called; the query will not be executed multiple times.

```js
knex
  .select('*')
  .from('users')
  .where({ name: 'Tim' })
  .then(function (rows) {
    return knex
      .insert({ user_id: rows[0].id, name: 'Test' }, 'id')
      .into('accounts');
  })
  .then(function (id) {
    console.log('Inserted Account ' + id);
  })
  .catch(function (error) {
    console.error(error);
  });
```

### catch

**.catch(onRejected)**

Coerces the current query builder into a promise state, catching any error thrown by the query, the same as calling .then(null, onRejected).

```js
return knex
  .insert({ id: 1, name: 'Test' }, 'id')
  .into('accounts')
  .catch(function (error) {
    console.error(error);
  })
  .then(function () {
    return knex.select('*').from('accounts').where('id', 1);
  })
  .then(function (rows) {
    console.log(rows[0]);
  })
  .catch(function (error) {
    console.error(error);
  });
```

## Callbacks

### asCallback

**.asCallback(callback)**

If you'd prefer a callback interface over promises, the asCallback function accepts a standard node style callback for executing the query chain. Note that as with the then method, subsequent calls to the same query chain will return the same result.

```js
knex
  .select('name')
  .from('users')
  .where('id', '>', 20)
  .andWhere('id', '<', 200)
  .limit(10)
  .offset(x)
  .asCallback(function (err, rows) {
    if (err) return console.error(err);
    knex
      .select('id')
      .from('nicknames')
      .whereIn('nickname', _.pluck(rows, 'name'))
      .asCallback(function (err, rows) {
        if (err) return console.error(err);
        console.log(rows);
      });
  });
```

## Streams

Streams are a powerful way of piping data through as it comes in, rather than all at once. You can read more about streams [here at substack's stream handbook](https://github.com/substack/stream-handbook). See the following for example uses of stream & pipe. If you wish to use streams with PostgreSQL, you must also install the [pg-query-stream](https://github.com/brianc/node-pg-query-stream) module. If you wish to use streams with the `pgnative` dialect, please be aware that the results will not be streamed as they are received, but rather streamed after the entire result set has returned. On an HTTP server, make sure to [manually close your streams](https://github.com/knex/knex/wiki/Manually-Closing-Streams) if a request is aborted.

### stream

**.stream([options], [callback])**

If called with a callback, the callback is passed the stream and a promise is returned. Otherwise, the readable stream is returned.  
When the stream is consumed as an [iterator](https://nodejs.org/api/stream.html#readablesymbolasynciterator), if the loop terminates with a `break`, `return`, or a `throw`, the stream will be destroyed. In other terms, iterating over a stream will consume the stream fully.

```js
// Retrieve the stream:
const stream = knex.select('*').from('users').stream();
stream.pipe(writableStream);
```

```js
// With options:
const stream = knex.select('*').from('users').stream({ highWaterMark: 5 });
stream.pipe(writableStream);
```

```js
// Use as an iterator
const stream = knex.select('*').from('users').stream();

for await (const row of stream) {
  /* ... */
}
```

```js
// Use as a promise:
const stream = knex
  .select('*')
  .from('users')
  .where(knex.raw('id = ?', [1]))
  .stream(function (stream) {
    stream.pipe(writableStream);
  })
  .then(function () {
    /* ... */
  })
  .catch(function (e) {
    console.error(e);
  });
```

### pipe

**.pipe(writableStream)**

Pipe a stream for the current query to a writableStream.

```js
const stream = knex.select('*').from('users').pipe(writableStream);
```

## Events

### query

A query event is fired just before a query takes place, providing data about the query, including the connection's `__knexUid` / `__knexTxId` properties and any other information about the query as described in toSQL. Useful for logging all queries throughout your application.

```js
knex
  .select('*')
  .from('users')
  .on('query', function (data) {
    app.log(data);
  })
  .then(function () {
    // ...
  });
```

### query-error

A query-error event is fired when an error occurs when running a query, providing the error object and data about the query, including the connection's `__knexUid` / `__knexTxId` properties and any other information about the query as described in toSQL. Useful for logging all query errors throughout your application.

```js
knex
  .select(['NonExistentColumn'])
  .from('users')
  .on('query-error', function (error, obj) {
    app.log(error);
  })
  .then(function () {
    /* ... */
  })
  .catch(function (error) {
    // Same error object as the query-error event provides.
  });
```

### query-response

A query-response event is fired when a successful query has been run, providing the response of the query and data about the query, including the connection's `__knexUid` / `__knexTxId` properties and any other information about the query as described in toSQL, and finally the query builder used for the query.

```js
knex
  .select('*')
  .from('users')
  .on('query-response', function (response, obj, builder) {
    // ...
  })
  .then(function (response) {
    // Same response as the emitted event
  })
  .catch(function (error) {});
```

### start

A `start` event is fired right before a query-builder is compiled.

::: info
While this event can be used to alter a builders state prior to compilation it is not to be recommended. Future goals include ways of doing this in a different manner such as hooks.
:::

```js
knex
  .select('*')
  .from('users')
  .on('start', function (builder) {
    builder.where('IsPrivate', 0);
  })
  .then(function (Rows) {
    //Only contains Rows where IsPrivate = 0
  })
  .catch(function (error) {});
```

## Other

### toString

**.toString()**

Returns an array of query strings filled out with the correct values based on bindings, etc. Useful for debugging, but should not be used to create queries for running them against DB.

```js
const toStringQuery = knex.select('*').from('users').where('id', 1).toString();

// Outputs: console.log(toStringQuery);
// select * from "users" where "id" = 1
```

### toSQL

**.toSQL()**  
**.toSQL().toNative()**

Returns an array of query strings filled out with the correct values based on bindings, etc. Useful for debugging and building queries for running them manually with DB driver. `.toSQL().toNative()` outputs object with sql string and bindings in a dialects format in the same way that knex internally sends them to underlying DB driver.

```js
knex
  .select('*')
  .from('users')
  .where(knex.raw('id = ?', [1]))
  .toSQL();
// Outputs:
// {
//   bindings: [1],
//   method: 'select',
//   sql: 'select * from "users" where id = ?',
//   options: undefined,
//   toNative: function () {}
// }

knex
  .select('*')
  .from('users')
  .where(knex.raw('id = ?', [1]))
  .toSQL()
  .toNative();
// Outputs for postgresql dialect:
// {
//   bindings: [1],
//   sql: 'select * from "users" where id = $1',
// }
```

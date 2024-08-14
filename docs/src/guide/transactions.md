# Transactions

Transactions are an important feature of relational databases, as they allow correct recovery from failures and keep a database consistent even in cases of system failure. All queries within a transaction are executed on the same database connection, and run the entire set of queries as a single unit of work. Any failure will mean the database will rollback any queries executed on that connection to the pre-transaction state.

Transactions are handled by passing a handler function into `knex.transaction`. The handler function accepts a single argument, an object which may be used in two ways:

1.  As the "promise aware" knex connection
2.  As an object passed into a query with [transacting](/guide/query-builder#transacting) and eventually call commit or rollback.

Consider these two examples:

```js
// Using trx as a query builder:
knex
  .transaction(function (trx) {
    const books = [
      { title: 'Canterbury Tales' },
      { title: 'Moby Dick' },
      { title: 'Hamlet' },
    ];

    return trx
      .insert({ name: 'Old Books' }, 'id')
      .into('catalogues')
      .then(function (ids) {
        books.forEach((book) => (book.catalogue_id = ids[0]));
        return trx('books').insert(books);
      });
  })
  .then(function (inserts) {
    console.log(inserts.length + ' new books saved.');
  })
  .catch(function (error) {
    // If we get here, that means that
    // neither the 'Old Books' catalogues insert,
    // nor any of the books inserts will have taken place.
    console.error(error);
  });
```

And then this example:

```js
// Using trx as a transaction object:
knex
  .transaction(function (trx) {
    const books = [
      { title: 'Canterbury Tales' },
      { title: 'Moby Dick' },
      { title: 'Hamlet' },
    ];

    knex
      .insert({ name: 'Old Books' }, 'id')
      .into('catalogues')
      .transacting(trx)
      .then(function (ids) {
        books.forEach((book) => (book.catalogue_id = ids[0]));
        return knex('books').insert(books).transacting(trx);
      })
      .then(trx.commit)
      .catch(trx.rollback);
  })
  .then(function (inserts) {
    console.log(inserts.length + ' new books saved.');
  })
  .catch(function (error) {
    // If we get here, that means that
    // neither the 'Old Books' catalogues insert,
    // nor any of the books inserts will have taken place.
    console.error(error);
  });
```

Same example as above using await/async:

```ts
try {
  await knex.transaction(async (trx) => {
    const books = [
      { title: 'Canterbury Tales' },
      { title: 'Moby Dick' },
      { title: 'Hamlet' },
    ];

    const ids = await trx('catalogues').insert(
      {
        name: 'Old Books',
      },
      'id'
    );

    books.forEach((book) => (book.catalogue_id = ids[0]));
    const inserts = await trx('books').insert(books);

    console.log(inserts.length + ' new books saved.');
  });
} catch (error) {
  // If we get here, that means that neither the 'Old Books' catalogues insert,
  // nor any of the books inserts will have taken place.
  console.error(error);
}
```

Same example as above using another await/async approach:

```ts
try {
  await knex.transaction(async (trx) => {
    const books = [
      { title: 'Canterbury Tales' },
      { title: 'Moby Dick' },
      { title: 'Hamlet' },
    ];

    const ids = await knex('catalogues')
      .insert(
        {
          name: 'Old Books',
        },
        'id'
      )
      .transacting(trx);

    books.forEach((book) => (book.catalogue_id = ids[0]));
    await knex('books').insert(books).transacting(trx);

    console.log(inserts.length + ' new books saved.');
  });
} catch (error) {
  console.error(error);
}
```

Throwing an error directly from the transaction handler function automatically rolls back the transaction, same as returning a rejected promise.

Notice that if a promise is not returned within the handler, it is up to you to ensure `trx.commit`, or `trx.rollback` are called, otherwise the transaction connection will hang.

Calling `trx.rollback` will return a rejected Promise. If you don't pass any argument to `trx.rollback`, a generic `Error` object will be created and passed in to ensure the Promise always rejects with something.

Note that Amazon Redshift does not support savepoints in transactions.

In some cases you may prefer to create transaction but only execute statements in it later. In such case call method `transaction` without a handler function:

```ts
// Using trx as a transaction object:
const trx = await knex.transaction();

const books = [
  { title: 'Canterbury Tales' },
  { title: 'Moby Dick' },
  { title: 'Hamlet' },
];

trx('catalogues')
  .insert({ name: 'Old Books' }, 'id')
  .then(function (ids) {
    books.forEach((book) => (book.catalogue_id = ids[0]));
    return trx('books').insert(books);
  })
  .then(trx.commit)
  .catch(trx.rollback);
```

If you want to create a reusable transaction instance, but do not want to actually start it until it is used, you can create a transaction provider instance. It will start transaction after being called for the first time, and return same transaction on subsequent calls:

```ts
// Does not start a transaction yet
const trxProvider = knex.transactionProvider();

const books = [
  { title: 'Canterbury Tales' },
  { title: 'Moby Dick' },
  { title: 'Hamlet' },
];

// Starts a transaction
const trx = await trxProvider();
const ids = await trx('catalogues').insert({ name: 'Old Books' }, 'id');
books.forEach((book) => (book.catalogue_id = ids[0]));
await trx('books').insert(books);

// Reuses same transaction
const sameTrx = await trxProvider();
const ids2 = await sameTrx('catalogues').insert({ name: 'New Books' }, 'id');
books.forEach((book) => (book.catalogue_id = ids2[0]));
await sameTrx('books').insert(books);
```

You can access the promise that gets resolved after transaction is rolled back explicitly by user or committed, or rejected if it gets rolled back by DB itself, when using either way of creating transaction, from field `executionPromise`:

```ts
const trxProvider = knex.transactionProvider();
const trx = await trxProvider();
const trxPromise = trx.executionPromise;

const trx2 = await knex.transaction();
const trx2Promise = trx2.executionPromise;

const trxInitPromise = new Promise(async (resolve, reject) => {
  knex.transaction((transaction) => {
    resolve(transaction);
  });
});
const trx3 = await trxInitPromise;
const trx3Promise = trx3.executionPromise;
```

You can check if a transaction has been committed or rolled back with the method `isCompleted`:

```ts
const trx = await knex.transaction();
trx.isCompleted(); // false
await trx.commit();
trx.isCompleted(); // true

const trx2 = knex.transactionProvider();
await trx2.rollback();
trx2.isCompleted(); // true
```

You can check the property `knex.isTransaction` to see if the current knex instance you are working with is a transaction.

## Transaction Modes

In case you need to specify an isolation level for your transaction, you can use a config parameter `isolationLevel`. Not supported by oracle and sqlite, options are `read uncommitted`, `read committed`, `repeatable read`, `snapshot` (mssql only), `serializable`.

```ts
// Simple read skew example
const isolationLevel = 'read committed';
const trx = await knex.transaction({ isolationLevel });
const result1 = await trx(tableName).select();
await knex(tableName).insert({ id: 1, value: 1 });
const result2 = await trx(tableName).select();
await trx.commit();
// result1 may or may not deep equal result2 depending on isolation level
```

You may also set the transaction mode as `read only` using the `readOnly` config parameter. It is currently only supported on mysql, postgres, and redshift.

```ts
const trx = await knex.transaction({ readOnly: true });
// 💥 Cannot `INSERT` while inside a `READ ONLY` transaction
const result = await trx(tableName).insert({ id: 1, foo: 'bar' });
```

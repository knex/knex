# Utility

A collection of utilities that the knex library provides for convenience.

## batchInsert
**knex.batchInsert(tableName)**

The `batchInsert` utility will insert a batch of rows wrapped inside a transaction _(which is automatically created unless explicitly given a transaction using [transacting](#Builder-transacting))_, at a given `chunkSize`.

It's primarily designed to be used when you have thousands of rows to insert into a table.

By default, the `chunkSize` is set to 1000.

BatchInsert also allows for [returning values](#Builder-returning) and supplying transactions using [transacting](#Builder-transacting).

```js
const rows = [{/*...*/}, {/*...*/}];
const chunkSize = 30;
knex.batchInsert('TableName', rows, chunkSize)
  .returning('id')
  .then(function(ids) { /*...*/ })
  .catch(function(error) { /*...*/ });

knex.transaction(function(tr) {
  return knex.batchInsert('TableName', rows, chunkSize)
    .transacting(tr)
  })
  .then(function() { /*...*/ })
  .catch(function(error) { /*...*/ });
```

## now

**knex.fn.now(precision)**

Return the current timestamp with a precision (optional)

```js
table.datetime('some_time', { precision: 6 }).defaultTo(knex.fn.now(6))
```

## binToUuid

**knex.fn.binToUuid(binaryUuid)**

Convert a binary uuid (binary(16)) to a string uuid (char(36))

```js
knex.schema.createTable('uuid_table', (t) => {
  t.uuid('uuid_col_binary', { useBinaryUuid: true });
});
knex('uuid_table').insert({
  uuid_col_binary:  knex.fn.uuidToBin('3f06af63-a93c-11e4-9797-00505690773f'),
});
```

## uuidToBin

**knex.fn.uuidToBin(uuid)**

Convert a uuid (char(16)) to a binary uuid (binary(36))

```ts
const res = await knex('uuid_table').select('uuid_col_binary');
knex.fn.binToUuid(res[0].uuid_col_binary)
```

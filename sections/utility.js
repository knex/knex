export default [
  {
    type: "heading",
    size: "lg",
    content: "Utility",
    href: "Utility"
  },
  {
    type: "text",
    content: "A collection of utilities that the knex library provides for convenience."
  },
  {
    type: "heading",
    size: "md",
    content: "Batch Insert",
    href: "Utility-BatchInsert"
  },
  {
    type: "text",
    content: [
      "The `batchInsert` utility will insert a batch of rows wrapped inside a transaction _(which is automatically created unless explicitly given a transaction using [transacting](#Builder-transacting))_, at a given `chunkSize`.",
      "It's primarily designed to be used when you have thousands of rows to insert into a table.",
      "By default, the `chunkSize` is set to 1000.",
      "BatchInsert also allows for [returning values](#Builder-returning) and supplying transactions using [transacting](#Builder-transacting)."
    ]
  },
  {
    type: "code",
    language: "js",
    content: `
      const rows = [{...}, {...}];
      const chunkSize = 30;
      knex.batchInsert('TableName', rows, chunkSize)
        .returning('id')
        .then(function(ids) { ... })
        .catch(function(error) { ... });

      knex.transaction(function(tr) {
        return knex.batchInsert('TableName', rows, chunkSize)
          .transacting(tr)
        })
        .then(function() { ... })
        .catch(function(error) { ... });
    `
  },
  {
    type: "method",
    method: "now",
    example: "knex.fn.now(precision)",
    description: "Return the current timestamp with a precision (optional)",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          table.datetime('some_time', { precision: 6 }).defaultTo(knex.fn.now(6))
        `
      }
    ]
  },
  {
    type: "method",
    method: "binToUuid",
    example: "knex.fn.binToUuid(binaryUuid)",
    description: "Convert a binary uuid (binary(16)) to a string uuid (char(36))",
    children: [
      {
        type: "code",
        language: "js",
        content: `
        knex.schema.createTable('uuid_table', (t) => {
          t.uuid('uuid_col_binary', { useBinaryUuid: true });
        });
        knex('uuid_table').insert({
          uuid_col_binary:  knex.fn.uuidToBin('3f06af63-a93c-11e4-9797-00505690773f'),
        });
        `
      }
    ]
  },
  {
    type: "method",
    method: "uuidToBin",
    example: "knex.fn.uuidToBin(uuid)",
    description: "Convert a uuid (char(16)) to a binary uuid (binary(36))",
    children: [
      {
        type: "code",
        language: "js",
        content: `
          const res = await knex('uuid_table').select('uuid_col_binary');
          knex.fn.binToUuid(res[0].uuid_col_binary)
        `
      }
    ]
  }
]

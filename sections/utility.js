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
  }
]

export default [
  {
    type: "heading",
    size: "md",
    content: "Seed API",
    href: "Seeds-API"
  },
  {
    type: "text",
    content: "`knex.seed` is the class utilized by the knex seed CLI. Each method takes an optional `config` object, which may specify the relative `directory` for the migrations."
  },
  {
    type: "method",
    method: "make",
    example: "knex.seed.make(name, [config])",
    description: "Creates a new seed file, with the name of the seed file being added.",
    children: [    ]
  },
  {
    type: "method",
    method: "run",
    example: "knex.seed.run([config])",
    description: "Runs all seed files for the current environment.",
    children: [    ]
  }
]

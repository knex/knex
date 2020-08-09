export default [
  {
    type: "heading",
    size: "md",
    content: "Seed API",
    href: "Seeds-API"
  },
  {
    type: "text",
    content: [
      "`knex.seed` is the class utilized by the knex seed CLI.",
      "Each method takes an optional `config` object, which may specify the following properties:"
    ]
  },
  {
    type: "list",
    content: [
      "`directory`: a relative path to the directory containing the seed files. Can be an array of paths (default `./seeds`)",
      "`loadExtensions`: array of file extensions which knex will treat as seeds. For example, if you have typescript transpiled into javascript in the same folder, you want to execute only javascript seeds. In this case, set `loadExtensions` to `['.js']`  (Notice the dot!)  (default `['.co', '.coffee', '.eg', '.iced', '.js', '.litcoffee', '.ls', '.ts']`)",
      "`specific`: a specific seed file to run from the seeds directory, if its value is `undefined` it will run all the seeds (default `undefined`)",
      "`sortDirsSeparately`: if true and multiple directories are specified, all migrations from a single directory will be executed before executing migrations in the next folder (default `false`)"
    ]
  },
  {
    type: "heading",
    size: "sm",
    content: "Methods",
    href: "Seeds-API-methods"
  },
  {
    type: "method",
    method: "make",
    example: "knex.seed.make(name, [config])",
    description: "Creates a new seed file, with the name of the seed file being added. If the seed directory config is an array of paths, the seed file will be generated in the latest specified.",
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

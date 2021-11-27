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
      "`recursive`: if true, will find seed files recursively in the directory / directories specified",
      "`specific`: a specific seed file or an array of seed files to run from the seeds directory, if its value is `undefined` it will run all the seeds (default `undefined`). If an array is specified, seed files will be run in the same order as the array",
      "`sortDirsSeparately`: if true and multiple directories are specified, all seeds from a single directory will be executed before executing seeds in the next folder (default `false`)",
      "`seedSource`: specify a custom seed source, see [Custom Seed Source](#custom-seed-sources) for more info (default filesystem)",
      "`extension`: extension to be used for newly generated seeds (default `js`)",
      "`timestampFilenamePrefix`: whether timestamp should be added as a prefix for newly generated seeds (default `false`)",
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
  },
  {
    type: "heading",
    size: "md",
    content: "Custom seed sources",
    href: "custom-seed-sources"
  },
  {
    type: "text",
    content:
        "Knex supports custom seed sources, allowing you full control of where your seeds come from. This can be useful for custom folder structures, when bundling with webpack/browserify and other scenarios."
  },
  {
    type: "code",
    language: "js",
    content: `
      // Create a custom seed source class
      class MySeedSource {
        // Must return a Promise containing a list of seeds. 
        // Seeds can be whatever you want, they will be passed as
        // arguments to getSeed
        getSeeds() {
          // In this example we are just returning seed names
          return Promise.resolve(['seed1'])
        }

        getSeed(seed) {
          switch(seed) {
            case 'seed1':
              return (knex) => { /* ... */ }
          }
        }
      }

      // pass an instance of your seed source as knex config
      knex.seed.run({ seedSource: new MySeedSource() })
    `
  }
]

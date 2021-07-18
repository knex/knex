export default [
    {
        type: "heading",
        size: "md",
        content: "ECMAScript modules (ESM) Interoperability",
        href: "esm-interop"
      },
      {
    
        type: "text",
        content: `ECMAScript Module support for knex CLI's configuration, migration and seeds  
        enabled by the \`--esm\` flag, ECMAScript Interoperability is provided by the [*'esm'*](https://github.com/standard-things/esm) module.      
        You can find [here](https://github.com/standard-things/esm) more information about 'esm' superpowers.      
        `
      },
      {
        type:"text",
        content: `Node 'mjs' files are handled by NodeJS own import mechanics  
        and do not require the use of the '--esm' flag.  
        But you might need it anyway for Node v10 under certain scenarios.  
        You can find details about NodeJS ECMAScript modules [here](https://nodejs.org/api/esm.html)
        `
      },
      {
        type:"text",
        content: `While it is possible to mix and match different module formats (extensions)  
        between your knexfile, seeds and migrations,         
        some format combinations will require specific NodeJS versions,   
        _Notably mjs/cjs files will follow NodeJS import and require restrictions._  
        You can see [here](https://github.com/knex/knex/blob/master/test/cli/esm-interop.spec.js) many possible scenarios,  
        and [here](https://github.com/knex/knex/tree/master/test/jake-util/knexfile-imports) some sample configurations`
      },
      {
        type: "text",
        content: `Node v10.* require the use of the '--experimental-module' flag in order to use the 'mjs' or 'cjs' extension.`
      },
      {
        type: "code",
        language: "bash",
        content: `
        # launching knex on Node v10 to use mjs/cjs modules
        node --experimental-modules ./node_modules/.bin/knex $@
        `
      },
      {
        type: "text",
        content: `When using migration and seed files with '.cjs' or '.mjs' extensions,
        you will need to specify that explicitly:  
    
        `
      },
      {
        type: "code",
        language: "js",
        content: `
        /* 
         * knexfile.mjs
         */
        export default {      
          migrations: {
            // ... client, connection,etc .... 
            directory: './migrations',
            loadExtensions: ['.mjs'] // 
          }
        }`
      },
      {
        type: "text",
        content: `When using '.mjs' extensions for your knexfile and '.js' for the seeds/migrations,
        you will need to specify that explicitly.  
    
        `
      },
      {
        type: "code",
        language: "js",
        content: `
        /* 
         * knexfile.mjs
         */
        export default {      
          migrations: {
            // ... client, connection,etc .... 
            directory: './migrations',
            loadExtensions: ['.js'] // knex will search for 'mjs' file by default
          }
        }`
      },
      {
        type: "text",
        content: `For the knexfile you can use a default export,   
        it will take precedence over named export.
        `
      },
      {
        type: "code",
        language: "js",
        content: `
        /**
         * filename: knexfile.js
         * For the knexfile you can use a default export
         **/        
        export default {
          client: 'sqlite3',
          connection: {
            filename: '../test.sqlite3',
          },
          migrations: {
            directory: './migrations',
          },
          seeds: {
            directory: './seeds',
          },
        }
        `
      },
      {
        type: "code",
        language: "js",
        content: `
        /**
         * filename: knexfile.js
         * Let knex find the configuration by providing named exports,
         * but if exported a default, it will take precedence, and it will be used instead
         **/
        const config = {
          client: 'sqlite3',
          connection: {
            filename: '../test.sqlite3',
          },
          migrations: {
            directory: './migrations',
          },
          seeds: {
            directory: './seeds',
          },
        };
        /** this will be used, it has precedence over named export */
        export default config;
        /** Named exports, will be used if you didn't provide a default export */
        export const { client, connection, migrations, seeds } = config;       
        `
      },
      {
        type: "text",
        content: `Seed and migration files need to follow Knex conventions`
      },
      {
        type: "code",
        language: "js",
        content: `
        // file: seed.js
        /** 
         * Same as with the CommonJS modules
         * You will need to export a "seed" named function.
         * */
        export function seed(next) {
          // ... seed logic here
        }`
      },
      {
        type: "code",
        language: "js",
        content: `
        // file: migration.js
        /** 
         * Same as the CommonJS version, the miration file should export 
         * "up" and "down" named functions
         */
        export function up(knex) {
          // ... migration logic here
        }
        export function down(knex) {
        // ... migration logic here
        }`
      },
]

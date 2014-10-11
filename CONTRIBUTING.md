## How to contribute to Knex.js

* Before sending a pull request for a feature or bug fix, be sure to have
[tests](https://github.com/tgriesser/knex/tree/master/test).

* Use the same coding style as the rest of the
[codebase](https://github.com/tgriesser/knex/blob/master/knex.js).

* All pull requests should be made to the `master` branch.


## Integration Tests

Integrations tests need a configuration file to use that describes the connection to the database. By default knex will need a configuration for mysql, mysql2, postgres and sqlite3 dialects.

It can be modified with the `KNEX_TEST_INTEGRATION_DIALECTS` environment variable. Example: `export KNEX_TEST_INTEGRATION_DIALECTS=postges` to only run tests for the postgres dialect.

Configuration file path is defined by `KNEX_TEST` environment variable. Example: `export KNEX_TEST=/path/knex_config.js`.

`knex_config.js` being

    module.exports = {
        postgres: {
            host     : '127.0.0.1',
            user     : 'jdoe',
            password : '',
            database : 'knex_test'
        }
    };

If a custom configuration file is not provided knex will use the following defaults:

'maria', 'mysql' and 'mysql2'

    {
        db: 'knex_test',
        user: 'root',
        charset: 'utf-8'
    }

'oracle'

    {
        adapter: 'oracle',
        database: 'knex_test',
        user: 'oracle'
    }

'postgres'

    {
        adapter: 'postgresql',
        database: 'knex_test',
        user: 'postgres'
    }

'sqlite3'

    {
        fileaname: __dirname + '/test.sqlite3'
    }

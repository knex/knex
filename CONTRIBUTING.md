## How to contribute to Knex.js

* Make changes in the `/src` directory and run `npm run dev` to
update the files in `/lib`

* Before sending a pull request for a feature or bug fix, be sure to have
[tests](https://github.com/tgriesser/knex/tree/master/test).

* Use the same coding style as the rest of the
[codebase](https://github.com/tgriesser/knex/blob/master/knex.js).

* All pull requests should be made to the `master` branch.

## Integration Tests

### The Easy Way

By default, Knex runs tests against MySQL (using [mysql](https://github.com/felixge/node-mysql) and [mysql2](https://github.com/sidorares/node-mysql2)), Postgres, and SQLite. The easiest way to run the tests is by creating the database `'knex_test'` and granting permissions to the database's default username:

* **MySQL**: *root*
* **Postgres**: *postgres*

No setup is required for SQLite.

### Specifying Databases
You can optionally specify which dialects to test using the `DB` environment variable. Values should be space separated and can include:
* mysql
* mysql2
* postgres
* sqlite3
* maria
* oracle

```bash
$ DB='postgres mysql' npm test
```

### Custom Configuration
If you'd like to override the database configuration (to use a different host, for example), you can override the path to the [default test configuration](https://github.com/tgriesser/knex/blob/master/test/knexfile.js) using the `KNEX_TEST` environment variable.

```bash
$ KNEX_TEST='./path/to/my/config.js' npm test
```

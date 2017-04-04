## How to contribute to Knex.js

* Make changes in the `/src` directory and run `npm run babel` (runs once and
  then quits) or `npm run dev` (runs once and then watches for changes) to
  update the files in `/lib`. `npm test` will also do this.

* Before sending a pull request for a feature or bug fix, be sure to have
[tests](https://github.com/tgriesser/knex/tree/master/test).

* Use the same coding style as the rest of the
[codebase](https://github.com/tgriesser/knex/blob/master/knex.js).

* All pull requests should be made to the `master` branch.

## Documentation

Documentation is no longer maintained in knex master repository. All the documentation pull requests should be sent to https://github.com/knex/documentation

Documentation pull requests should not be merged before knex version which has the new documented feature is released.

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
* mssql

```bash
$ DB='postgres mysql' npm test
```

### Custom Configuration
If you'd like to override the database configuration (to use a different host, for example), you can override the path to the [default test configuration](https://github.com/tgriesser/knex/blob/master/test/knexfile.js) using the `KNEX_TEST` environment variable.

```bash
$ KNEX_TEST='./path/to/my/config.js' npm test
```

### Creating Postgres User

Depending on your setup you might not have the default postgres user. To create a new user, login to Postgres and use the following queries to add the user. This assumes you've already created the `knex_test` database.

```
CREATE ROLE postgres WITH LOGIN PASSWORD '';
GRANT ALL PRIVILEGES ON DATABASE "knex_test" TO postgres;
```

Once this is done, check it works by attempting to login:

```
psql -h localhost -U postgres -d knex_test
```

## Want to be Collaborator?

There is always room for more collaborators. Be active on resolving github issues / sending pull requests / reviewing code and we will ask you to join.

### Etiquette (/ˈɛtᵻkɛt/ or /ˈɛtᵻkɪt/, French: [e.ti.kɛt])

Make pull requests for your changes, do not commit directly to master (release stuff like fixing changelog are ok though).

All the pull requests must be peer reviewed by other collaborator, so don't merge your request before that. If there is no response ping others.

If you are going to add new feature to knex (not just a bugfix) it should be discussed first with others to agree on details.

Join Gitter chat if you feel to chat outside of github issues.

## How to contribute to Knex.js

* Make changes in the `/src` directory and run `npm run babel` (runs once and
  then quits) or `npm run dev` (runs once and then watches for changes) to
  update the files in `/lib`. `npm test` will also do this.

* Before sending a pull request for a feature or bug fix, be sure to have
[tests](https://github.com/tgriesser/knex/tree/master/test). Every pull request that changes the queries should have 
also **integration tests which are ran against real database** (in addition to unit tests which checks which kind of queries
are being created).

* Use the same coding style as the rest of the
[codebase](https://github.com/tgriesser/knex/blob/master/knex.js).

* All pull requests should be made to the `master` branch.

* Pull request description should have link to corresponding PR of documentation branch.

## Documentation

Documentation is no longer maintained in knex master repository. All the documentation pull requests should be sent to https://github.com/knex/documentation

Documentation pull requests should not be merged before knex version which has the new documented feature is released.

## I would like to add support for new dialect to knex, is it possible?

Currently there are already way too many dialects supported in `knex` and instead of adding new dialect to central codebase, all the dialects should be moved to separate npm packages out from `knex` core library with their respective maintainers and test suites. 

So if you like to write your own dialect, you can just inherit own dialect from knex base classes and use it by passing dilaect to knex in knex configuration (https://runkit.com/embed/90b3cpyr4jh2):

```js
// simple dialect overriding sqlite3 dialect to use sqlite3-offline driver
require('sqlite3-offline');
const Knex = require("knex");

const Dialect = require(`knex/lib/dialects/sqlite3/index.js`);
Dialect.prototype._driver = () => require('sqlite3-offline');

const knex = Knex({
  client: Dialect,
  connection: ':memory:'
});

console.log(
  knex.select(knex.raw(1)).toSQL()
);

await knex.schema.createTable('fooobar', (t) => {
  t.bigincrements('id');
  t.string('data');
});
await knex('fooobar').insert({ data: 'nomnom' });

console.log("Gimme all the data:", await knex('fooobar'));
```

## What is minimal code to reproduce bug and why I have to provide that when I can just tell whats the problem is

Writing minimal reproduction code for the problem is timeconsuming and some times it also really hard when for 
example when the original code where the bug happens is written using express or mocha. So why it is necessary 
for me to commit so much time to it when the problem is in `knex`? Contributors should be grateful that I reported
the bug I found. 

The point of runnable code to reproduce the problem is to easily verify that there really is a problem and that the one 
who did the report did nothing wrong (surprisingly often problem is in the user code). So instead of just description 
what to do the complete code encourages devs to actually test out that problem exists and start solving it and it 
saves lots of time.

tl;dr list:

1. Actually in most of the cases developer already figures out what was the problem when writing the minimal test case
or if there was problem how stuff was initilized or how async code was written it is easy to point out the problem.

2. It motivates developer to actually try out if the bug really exist by not having to figure out from incomplete example
environment in which and how bug actually manifests.

3. There are curently very few people fixing knex issues and if one has to put easily 15-30 minutes time to issue just 
to see that I cannot reproduce this issue it just wastes development hours that were available for improving knex.


Test case should initialize needed tables, insert needed data and fail...

```
const knex = require('knex')({
  client: 'pg',
  connection: 'postgres:///knex_test'
});

async function main() {
  await knex.schema.createTable(...);
  await knex('table').insert({foo: 'bar}');
  await knex.destroy();
}

main(); 
```

Usually issues without reproduction code available are just closed and if the same issue is reported multiple
times maybe someone looks into it.

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
* oracledb
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

### Running OracleDB tests in docker

Since node-oracledb driver is so hard to install on every platform, oracle tests
are actually ran inside docker container. Container has Oracle XE g11,
node 8 and node-oracledb driver installed and copies local knex directory in 
to be able to run the tests.

```
NODE_VER=10 npm run oracledb:test
```

You can also manually start shell in the docker image and run build commands manually:
```
docker run -i -t knex-test-oracledb /bin/bash

root@34f1f1cd20cf:/#

/usr/sbin/startup.sh
cd knex
npm install
npm install oracledb
npm test
```

### Runnin MSSQL SQL Server tests

SQL Server needs to be started as docker container before running tests

```
# start mssql docker container
npm run mssql:init

# run tests, do changes etc.
npm run mssql:test

# stop mssql container
npm run mssql:destroy
```

## Want to be Collaborator?

There is always room for more collaborators. Be active on resolving github issues / sending pull requests / reviewing code and we will ask you to join.

### Etiquette (/ˈɛtᵻkɛt/ or /ˈɛtᵻkɪt/, French: [e.ti.kɛt])

Make pull requests for your changes, do not commit directly to master (release stuff like fixing changelog are ok though).

All the pull requests must be peer reviewed by other collaborator, so don't merge your request before that. If there is no response ping others.

If you are going to add new feature to knex (not just a bugfix) it should be discussed first with others to agree on details.

Join Gitter chat if you feel to chat outside of github issues.

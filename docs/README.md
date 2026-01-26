# knex.js documentation

The vitepress documentation for [http://knexjs.org](http://knexjs.org)

#### SQL outputs in code fences:

Add `// @sql` on its own line immediately before a statement in a JS/TS fenced
code block to have the docs build render the dialect-specific SQL below the
snippet. Use multiple markers to capture multiple statements; marker lines are
stripped from the rendered output.

#### Schema builder SQL outputs (resolved):

Schema builder snippets are resolved ahead of time because some dialects need
live schema introspection. Run the resolver manually when you change the schema
builder docs:

When updating DDL snippets, build the docs with the workspace Knex (current
tree) and regenerate the resolved outputs:

```bash
cd docs
npm install
npm install --no-save ../
# Use the direct script to avoid the pre-script that installs knex@latest.
node scripts/resolve-schema-snippets-docker.mjs
npm run build
```

Standard resolver entry point:

```bash
# full pass (live databases for all supported dialects; Redshift compile-only)
npm run resolve-schema-snippets
```

Advanced usage:

```bash
# run one dialect
npm run resolve-schema-snippets -- --dialect postgres

# run one database group
npm run resolve-schema-snippets -- --db mysql

# direct resolver (uses your own connection info)
node scripts/resolve-schema-snippets.mjs --dialect postgres --mode live

```

The direct resolver expects connection details for non-SQLite dialects only when running in live mode via:
It defaults to compile-only unless you pass `--mode live`.

- `KNEX_DOCS_PG` (PostgreSQL)
- `KNEX_DOCS_MY` (MySQL)
- `KNEX_DOCS_MS` (MSSQL)
- `KNEX_DOCS_OR` (Oracle)
- `KNEX_DOCS_CR` (CockroachDB)
- `KNEX_DOCS_RS` (Redshift)

Each value can be a connection string or a JSON config object. SQLite uses an
in-memory database in live mode.

The resolver writes `docs/generated/schema-snippets.json`. Docs builds will
warn and render "Snippet not available" if this file is missing or incomplete.
Docs builds read this file, so refresh it whenever snippet code changes.
The resolver uses a fixture schema defined in
`docs/scripts/resolve-schema-snippets.mjs`, so point it at a disposable
database.

`npm run resolve-schema-snippets` starts docker databases sequentially
(start -> resolve -> stop) and resolves every supported dialect using a live
database. Redshift is always compile-only because there is no docker service
for it.
Use `--mode compile` only for debugging; it skips live database work and will
omit introspection-driven DDL output.
Oracle requires local driver libraries; see `scripts/oracledb-install-driver-libs.sh`
if needed. PgNative requires the `pg-native` module.

The only schema builder snippets that _require_ a live database for accurate
SQL output are:

- MySQL: `renameColumn`, `setNullable`, `dropNullable`. These need the
  existing column definition to build the `ALTER TABLE ... CHANGE/MODIFY`
  statement, so Knex runs `SHOW FULL FIELDS` against a live database.
- MSSQL: `setNullable`, `dropNullable`. These need the existing column
  definition to build the `ALTER TABLE ... ALTER COLUMN` statement, so Knex
  queries the database for the column metadata.

#### Development:

If your docs change should reflect the current workspace Knex, install it in
`docs` before running the dev server or build:

```bash
cd docs
npm install --no-save ../
```

```bash
npm run dev # or yarn dev
```

```bash
npm i # or yarn install
npm run dev # or yarn dev

```

#### Production:

```bash
npm run build # or yarn build
```

#### License:

MIT

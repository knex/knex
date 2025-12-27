import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Knex from 'knex';
import {
  evaluateSnippet,
  formatSqlError,
  instrumentMarkedStatements,
} from './snippet-utils.mjs';
import formatSqlWithBindings from './format-sql-bindings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(__dirname, '..', '..');
// Only schema builder docs need resolved outputs.
const schemaDocs = [
  path.resolve(repoRoot, 'docs', 'src', 'guide', 'schema-builder.md'),
];
const outputPath = path.resolve(
  repoRoot,
  'docs',
  'generated',
  'schema-snippets.json'
);
const OUTPUT_VERSION = 1;
const DEFAULT_MODE = 'compile';
const MODES = new Set(['live', 'compile']);
const SQL_OUTPUT_SEPARATOR = '-- ----';

const SQL_MARKER_LINE = /^\s*\/\/\s*@sql\b/m;
const FENCE_LANGUAGES = new Set(['js', 'ts']);
const CODE_FENCE_RE = /```([a-zA-Z0-9_-]+)([^\n]*)\n([\s\S]*?)```/g;

const DIALECTS = [
  { name: 'sqlite3', client: 'sqlite3', envKey: null, sqlite: true },
  { name: 'postgres', client: 'postgres', envKey: 'KNEX_DOCS_PG' },
  { name: 'mysql', client: 'mysql', envKey: 'KNEX_DOCS_MY' },
  { name: 'mssql', client: 'mssql', envKey: 'KNEX_DOCS_MS' },
  { name: 'oracledb', client: 'oracledb', envKey: 'KNEX_DOCS_OR' },
  { name: 'cockroachdb', client: 'cockroachdb', envKey: 'KNEX_DOCS_CR' },
  { name: 'redshift', client: 'redshift', envKey: 'KNEX_DOCS_RS' },
];

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const mode = parseMode(args);
  const dialectFilter = parseDialectFilter(args);
  const selectedDialects = filterDialects(dialectFilter);
  const snippets = loadSnippets(schemaDocs);
  const data = loadExistingOutput(outputPath);

  for (const dialect of selectedDialects) {
    const allowDb = shouldUseLiveDb(mode, dialect);
    if (dialect.name === 'oracledb' && allowDb) {
      await runWithRetry(
        () => resolveDialect(dialect, snippets, data, allowDb),
        {
          retries: 8,
          delayMs: 5000,
          isRetryable: isOracleInitError,
          onRetry: (attempt, error) => {
            console.warn(
              `Oracle not ready yet (attempt ${attempt}). Retrying...`
            );
          },
        }
      );
    } else {
      await resolveDialect(dialect, snippets, data, allowDb);
    }
  }

  writeOutput(outputPath, data);
}

function printHelp() {
  const dialects = DIALECTS.map((dialect) => dialect.name).join(', ');
  console.log(`Resolve schema builder SQL snippets.

Usage:
  node docs/scripts/resolve-schema-snippets.mjs [--dialect <name>[,<name>...]] [--mode <live|compile>]

Examples:
  node docs/scripts/resolve-schema-snippets.mjs
  node docs/scripts/resolve-schema-snippets.mjs --dialect postgres
  node docs/scripts/resolve-schema-snippets.mjs --mode live

Dialects:
  ${dialects}

Environment variables:
  KNEX_DOCS_PG       PostgreSQL connection string or JSON
  KNEX_DOCS_MY       MySQL connection string or JSON
  KNEX_DOCS_MS       MSSQL connection string or JSON
  KNEX_DOCS_OR       Oracle connection string or JSON
  KNEX_DOCS_CR       CockroachDB connection string or JSON
  KNEX_DOCS_RS       Redshift connection string or JSON

Modes:
  live     Use live databases for all dialects except Redshift.
  compile  Do not connect to databases except SQLite.

Notes:
  SQLite always uses a live in-memory database.
  Redshift is always compile-only.
`);
}

function parseMode(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--mode') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('Missing value for --mode');
      }
      i += 1;
      if (!MODES.has(value)) {
        throw new Error(`Unknown mode: ${value}`);
      }
      return value;
    }
  }
  return DEFAULT_MODE;
}

function parseDialectFilter(args) {
  const names = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--dialect' || arg === '-d') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('Missing value for --dialect');
      }
      i += 1;
      names.push(...value.split(',').map((name) => name.trim()));
    }
  }

  const filtered = names.filter(Boolean);
  return filtered.length ? new Set(filtered) : null;
}

function filterDialects(filter) {
  if (!filter) {
    return DIALECTS;
  }
  const filtered = DIALECTS.filter((dialect) => filter.has(dialect.name));
  const unknown = [...filter].filter(
    (name) => !DIALECTS.some((dialect) => dialect.name === name)
  );
  if (unknown.length) {
    throw new Error(`Unknown dialect(s): ${unknown.join(', ')}`);
  }
  return filtered;
}

function loadSnippets(files) {
  const snippets = [];
  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    let sqlFenceIndex = 0;
    for (const match of source.matchAll(CODE_FENCE_RE)) {
      const lang = String(match[1] || '').toLowerCase();
      const code = match[3] || '';
      if (!FENCE_LANGUAGES.has(lang)) {
        continue;
      }
      if (!SQL_MARKER_LINE.test(code)) {
        continue;
      }
      const instrumented = instrumentMarkedStatements(
        code,
        lang,
        SQL_MARKER_LINE
      );
      if (!instrumented) {
        continue;
      }
      snippets.push({
        filePath,
        index: sqlFenceIndex,
        lang,
        code,
        instrumented,
      });
      sqlFenceIndex += 1;
    }
  }
  return snippets;
}

function loadExistingOutput(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      version: OUTPUT_VERSION,
      generatedAt: new Date().toISOString(),
      files: {},
    };
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (!data || typeof data !== 'object') {
    throw new Error(`Invalid JSON in ${filePath}`);
  }
  if (data.version !== OUTPUT_VERSION) {
    throw new Error(
      `Unsupported snippet file version ${data.version} (expected ${OUTPUT_VERSION})`
    );
  }
  if (!data.files || typeof data.files !== 'object') {
    data.files = {};
  }
  return data;
}

function writeOutput(filePath, data) {
  data.generatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function createKnex(dialect, allowDb) {
  if (dialect.sqlite) {
    // Docs builds run against the published Knex package (not repo source).
    // Older releases pass nested arrays to SQLite dropColumn; patch here so
    // schema snippets render correctly until a fixed Knex release is used.
    try {
      const SqliteDdl = require('knex/lib/dialects/sqlite3/schema/ddl');
      if (SqliteDdl?.prototype && !SqliteDdl.prototype.__knexDocsPatched) {
        const originalDropColumn = SqliteDdl.prototype.dropColumn;
        SqliteDdl.prototype.dropColumn = function (columns) {
          const normalized =
            Array.isArray(columns) &&
            columns.length === 1 &&
            Array.isArray(columns[0])
              ? columns[0]
              : columns;
          return originalDropColumn.call(this, normalized);
        };
        SqliteDdl.prototype.__knexDocsPatched = true;
      }
    } catch (error) {
      console.warn(
        `sqlite3: unable to patch dropColumn normalization (${error?.message || error})`
      );
    }
    return Knex({
      client: dialect.client,
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
      pool: { min: 1, max: 1 },
    });
  }

  let connection = null;
  if (allowDb && dialect.envKey) {
    const raw = process.env[dialect.envKey];
    if (raw) {
      const trimmed = raw.trim();
      if (trimmed) {
        connection = trimmed.startsWith('{') ? JSON.parse(trimmed) : trimmed;
      }
    }
  }
  if (allowDb && !connection) {
    throw new Error(
      `Missing ${dialect.envKey} connection info for ${dialect.name}. ` +
        `Run "npm run resolve-schema-snippets -- --dialect ${dialect.name}" ` +
        `to use docker, or set ${dialect.envKey}.`
    );
  }

  const config = {
    client: dialect.client,
    ...(connection ? { connection } : {}),
  };
  if (!allowDb && dialect.name === 'oracledb') {
    // Provide a version for compile-only formatting when no DB connection exists.
    config.version = '12.2';
  }
  return Knex(config);
}

async function resolveDialect(dialect, snippets, data, allowDb) {
  const knex = createKnex(dialect, allowDb);
  try {
    if (allowDb) {
      await setupFixtureSchema(knex);
    }
    await resolveDialectSnippets(knex, dialect.name, snippets, data, {
      allowDb,
      warn: (message) => {
        console.warn(`${dialect.name}: ${message}`);
      },
    });
  } catch (error) {
    if (dialect.name === 'oracledb') {
      const message =
        error instanceof Error ? error.message : String(error || '');
      if (/DPI-1047|libclntsh|Oracle Client library/i.test(message)) {
        throw new Error(
          'Oracle client libraries could not be loaded. ' +
            'Install them via scripts/oracledb-install-driver-libs.sh, ' +
            'or use the thin driver by leaving NODE_ORACLEDB_DRIVER_MODE unset.',
          { cause: error }
        );
      }
    }
    throw error;
  } finally {
    await knex.destroy();
  }
}

function shouldUseLiveDb(mode, dialect) {
  if (dialect.name === 'redshift') {
    return false;
  }
  if (dialect.sqlite) {
    return true;
  }
  return mode === 'live';
}

async function runWithRetry(fn, { retries, delayMs, isRetryable, onRetry }) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries || !isRetryable(error)) {
        throw error;
      }
      onRetry?.(attempt, error);
      await sleep(delayMs);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isOracleInitError(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /ORA-01033/i.test(message);
}

async function setupFixtureSchema(knex) {
  // Fixture schema supports metadata-driven DDL (rename/nullable changes).
  const dropOrder = [
    'posts',
    'users',
    'job',
    'accounts',
    'product',
    'company',
    'user',
    'Items',
    'timestamps_example',
  ];

  for (const table of dropOrder) {
    await knex.schema.dropTableIfExists(table);
  }

  await knex.schema.createTable('company', (table) => {
    table.increments('companyId').primary();
    table.string('name');
  });

  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.string('first_name');
    table.string('last_name');
    table.string('email');
    table.integer('age');
    table.integer('companyId').unsigned();
    table.integer('user_id').unsigned();
    table.foreign('companyId').references('company.companyId');
  });

  await knex.schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.integer('author').unsigned();
    table.string('title', 30);
    table.text('content');
  });

  await knex.schema.createTable('user', (table) => {
    table.increments('id').primary();
    table.string('username', 35);
    table.integer('age');
  });

  await knex.schema.createTable('job', (table) => {
    table.increments('id').primary();
    table.string('email');
    table.integer('account_id');
    table.integer('program_id');
  });

  await knex.schema.createTable('accounts', (table) => {
    table.increments('id').primary();
    table.string('email');
  });

  await knex.schema.createTable('product', (table) => {
    table.increments('id').primary();
    table.integer('price_min');
    table.integer('price');
    table.integer('price_decrease');
  });

  await knex.schema.createTable('Items', (table) => {
    table.increments('id').primary();
    table.integer('user_id_in_items');
  });

  await knex.schema.createTable('timestamps_example', (table) => {
    table.increments('id').primary();
    table.timestamps(true, true);
  });
}

async function resolveDialectSnippets(
  knex,
  dialectName,
  snippets,
  data,
  options = {}
) {
  for (const snippet of snippets) {
    const captures = evaluateSnippet(snippet.instrumented, snippet.lang, knex);
    const groups = [];

    for (const capture of captures) {
      const group = [];
      if ('error' in capture) {
        group.push({ type: 'error', text: formatSqlError(capture.error) });
      } else {
        try {
          const sqlStrings = await resolveCaptureSql(
            capture.value,
            knex,
            options
          );
          for (const sql of sqlStrings) {
            group.push({ type: 'sql', text: sql });
          }
        } catch (error) {
          group.push({ type: 'error', text: formatSqlError(error) });
        }
      }

      if (group.length) {
        groups.push(group);
      }
    }

    const chunks = [];
    for (let i = 0; i < groups.length; i += 1) {
      if (i > 0) {
        chunks.push({ type: 'sql', text: SQL_OUTPUT_SEPARATOR });
      }
      chunks.push(...groups[i]);
    }

    const relativePath = path
      .relative(repoRoot, snippet.filePath)
      .split(path.sep)
      .join('/');
    const fileEntry = data.files[relativePath] || { snippets: {} };
    const snippetKey = String(snippet.index);
    const snippetEntry = fileEntry.snippets[snippetKey] || { dialects: {} };

    snippetEntry.dialects[dialectName] = chunks;
    fileEntry.snippets[snippetKey] = snippetEntry;
    data.files[relativePath] = fileEntry;
  }
}

async function resolveCaptureSql(value, knex, options) {
  if (!value) {
    return [];
  }

  if (isKnexBuilder(value)) {
    if (isSchemaBuilder(value)) {
      return resolveSchemaBuilder(value, knex, options);
    }
    return toSqlStrings(value, knex);
  }

  let resolved = value;
  if (resolved && typeof resolved.then === 'function') {
    resolved = await resolved;
  }

  if (!resolved) {
    return [];
  }

  if (isSchemaBuilder(resolved)) {
    return resolveSchemaBuilder(resolved, knex, options);
  }

  if (isKnexBuilder(resolved)) {
    return toSqlStrings(resolved, knex);
  }

  if (typeof resolved === 'string' || Array.isArray(resolved)) {
    return collectSqlFromValue(resolved, knex);
  }

  if (isDdlResult(resolved)) {
    return collectSqlFromValue(resolved, knex);
  }

  return toSqlStrings(resolved, knex);
}

async function resolveSchemaBuilder(builder, knex, options = {}) {
  const queries = builder.toSQL();
  const list = Array.isArray(queries) ? queries : [queries];
  const outputs = [];

  for (const query of list) {
    const sqls = await resolveSchemaQuery(query, knex, options);
    outputs.push(...sqls);
  }
  return outputs;
}

async function resolveSchemaQuery(query, knex, options = {}) {
  if (!query) {
    return [];
  }

  if (typeof query === 'string') {
    return [query];
  }

  if (Array.isArray(query)) {
    const combined = [];
    for (const entry of query) {
      combined.push(...(await resolveSchemaQuery(entry, knex, options)));
    }
    return combined;
  }

  if (query.statementsProducer) {
    // statementsProducer needs a live connection to compute DDL.
    if (!options.allowDb) {
      options.warn?.('Skipping statementsProducer output (compile-only mode).');
      return [];
    }
    return withConnection(knex, async (connection) => {
      const statements = await query.statementsProducer(undefined, connection);
      return collectSqlFromValue(statements, knex);
    });
  }

  if (query.output) {
    const fallbackSql = collectSqlFromValue(query, knex);
    if (options.allowDb) {
      const outputSql = await withConnection(knex, async (connection) => {
        return resolveOutputQuery(query, knex, connection);
      });
      if (outputSql.length) {
        return outputSql;
      }
    }
    return fallbackSql;
  }

  return collectSqlFromValue(query, knex);
}

async function resolveOutputQuery(query, knex, connection) {
  const recorded = [];
  const onQuery = (data) => {
    if (!data || typeof data.sql !== 'string') {
      return;
    }
    recorded.push(
      ...collectSqlFromValue(
        { sql: data.sql, bindings: data.bindings },
        knex
      )
    );
  };
  knex.on('query', onQuery);
  try {
    const runner = createCaptureRunner(knex, connection, recorded);
    const response = await knex.client.query(connection, query);

    const processed = await withRawPatch(query, knex, async () => {
      return knex.client.processResponse(response, runner);
    });

    const processedSql = collectSqlFromValue(processed, knex);
    return mergeOutputSql(recorded, processedSql);
  } finally {
    knex.removeListener('query', onQuery);
  }
}

function createCaptureRunner(knex, connection, recorded) {
  const runner = {
    client: knex.client,
    connection,
    query: async (queryObj) => {
      if (!queryObj) {
        return undefined;
      }
      if (queryObj.statementsProducer) {
        const statements = await queryObj.statementsProducer(
          undefined,
          connection
        );
        recorded.push(...collectSqlFromValue(statements, knex));
        return [];
      }
      const sql = getSqlString(queryObj);
      // Only execute safe introspection queries; record everything else.
      if (shouldExecuteQuery(sql)) {
        const response = await knex.client.query(connection, queryObj);
        const processed = await knex.client.processResponse(response, runner);
        return knex.client.postProcessResponse(processed);
      }
      recorded.push(...collectSqlFromValue(queryObj, knex));
      return [];
    },
    queryArray: async (queries) => {
      if (!Array.isArray(queries)) {
        return runner.query(queries);
      }
      const results = [];
      for (const entry of queries) {
        results.push(await runner.query(entry));
      }
      return results;
    },
  };
  return runner;
}

function shouldExecuteQuery(sql) {
  const trimmed = sql.trim().toLowerCase();
  return (
    trimmed.startsWith('select') ||
    trimmed.startsWith('show') ||
    trimmed.startsWith('pragma')
  );
}

function getSqlString(query) {
  if (!query) {
    return '';
  }
  if (typeof query === 'string') {
    return query;
  }
  if (Array.isArray(query)) {
    return query.map(getSqlString).join(' ');
  }
  return typeof query.sql === 'string' ? query.sql : '';
}

async function withConnection(knex, fn) {
  const connection = await knex.client.acquireConnection();
  try {
    return await fn(connection);
  } finally {
    await knex.client.releaseConnection(connection);
  }
}

async function withRawPatch(query, knex, fn) {
  if (!shouldPatchRaw(query)) {
    return fn();
  }

  const originalRaw = knex.client.raw;
  knex.client.raw = (...args) => {
    const raw = originalRaw.apply(knex.client, args);
    if (raw && typeof raw === 'object') {
      raw.then = undefined;
      raw.catch = undefined;
      raw.finally = undefined;
    }
    return raw;
  };

  try {
    return await fn();
  } finally {
    knex.client.raw = originalRaw;
  }
}

function shouldPatchRaw(query) {
  if (!query || typeof query !== 'object') {
    return false;
  }
  if (!query.sql || typeof query.sql !== 'string') {
    return false;
  }
  return query.sql.trim().toLowerCase() === 'select 1';
}

function collectSqlFromValue(value, knex, bindingsOverride) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      collectSqlFromValue(entry, knex, bindingsOverride)
    );
  }

  if (typeof value === 'string') {
    if (!knex || typeof knex.raw !== 'function') {
      return [value];
    }
    if (!bindingsOverride || bindingsOverride.length === 0) {
      return [value];
    }
    return [formatSqlWithBindings(value, bindingsOverride, knex)];
  }

  if (typeof value === 'object') {
    if ('pre' in value || 'post' in value || 'check' in value) {
      const pre = value.pre;
      const sql = value.sql;
      const check = value.check;
      const post = value.post;
      return [
        ...collectSqlFromValue(pre, knex, bindingsOverride),
        ...collectSqlFromValue(sql, knex, bindingsOverride),
        ...collectSqlFromValue(check, knex, bindingsOverride),
        ...collectSqlFromValue(post, knex, bindingsOverride),
      ];
    }

    if ('sql' in value) {
      const sqlValue = value.sql;
      const bindings =
        'bindings' in value && value.bindings
          ? value.bindings
          : bindingsOverride;
      return collectSqlFromValue(sqlValue, knex, bindings);
    }

    if (typeof value.toSQL === 'function') {
      return collectSqlFromValue(value.toSQL(), knex);
    }

    if (typeof value.toString === 'function') {
      return [String(value.toString())];
    }
  }

  return [];
}

function mergeOutputSql(recorded, processed) {
  const combined = recorded.slice();
  const seen = new Set(recorded);
  for (const sql of processed) {
    if (!sql || seen.has(sql)) {
      continue;
    }
    seen.add(sql);
    combined.push(sql);
  }
  return combined;
}

function isSchemaBuilder(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    'toSQL' in value &&
    'generateDdlCommands' in value
  );
}

function isDdlResult(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('pre' in value || 'post' in value || 'check' in value || 'sql' in value)
  );
}

function isKnexBuilder(value) {
  return (
    !!value && typeof value === 'object' && typeof value.toSQL === 'function'
  );
}

function toSqlStrings(value, knex) {
  if (!value || typeof value.toSQL !== 'function') {
    return [];
  }
  const sqlValue = value.toSQL();
  return collectSqlFromValue(sqlValue, knex);
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const composeFile = path.resolve(repoRoot, 'scripts', 'docker-compose.yml');
const resolverScript = path.resolve(
  repoRoot,
  'docs',
  'scripts',
  'resolve-schema-snippets.mjs'
);
const require = createRequire(import.meta.url);
const DEFAULT_MODE = 'live';
const MODES = new Set(['live', 'compile']);
const SQLITE_DIALECTS = new Set(['sqlite3']);

// Each group maps dialects to a docker service and env configuration.
const groups = [
  {
    name: 'sqlite',
    dialects: ['sqlite3'],
    docker: false,
    default: true,
  },
  {
    name: 'postgres',
    dialects: ['postgres'],
    docker: true,
    service: 'postgres',
    wait: 'waitpostgres',
    env: {
      KNEX_DOCS_PG: 'postgres://testuser:knextest@localhost:25432/knex_test',
    },
    default: true,
  },
  {
    name: 'mysql',
    dialects: ['mysql'],
    docker: true,
    service: 'mysql',
    wait: 'waitmysql',
    env: {
      KNEX_DOCS_MY: 'mysql://testuser:testpassword@localhost:23306/knex_test',
    },
    default: true,
  },
  {
    name: 'mssql',
    dialects: ['mssql'],
    docker: true,
    service: 'mssql',
    wait: 'waitmssql',
    env: {
      KNEX_DOCS_MS: JSON.stringify({
        user: 'sa',
        password: 'S0meVeryHardPassword',
        server: 'localhost',
        port: 21433,
        database: 'knex_test',
        options: { trustServerCertificate: true },
      }),
    },
    default: true,
  },
  {
    name: 'oracledb',
    dialects: ['oracledb'],
    docker: true,
    service: 'oracledb',
    wait: 'waitoracledb',
    env: {
      KNEX_DOCS_OR: JSON.stringify({
        user: 'system',
        password: 'Oracle18',
        connectString: 'localhost:21521/XE',
        stmtCacheSize: 0,
      }),
    },
    default: true,
  },
  {
    name: 'cockroachdb',
    dialects: ['cockroachdb'],
    docker: true,
    service: 'cockroachdb',
    wait: 'waitcockroachdb',
    env: {
      KNEX_DOCS_CR: 'postgresql://root@localhost:26257/test?sslmode=disable',
    },
    default: true,
  },
  {
    name: 'redshift',
    dialects: ['redshift'],
    docker: false,
    envRequired: 'KNEX_DOCS_RS',
    default: true,
  },
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
  const dialectFilter = parseListFlag(args, ['--dialect', '-d']);
  const dbFilter = parseListFlag(args, ['--db', '--database']);
  const isExplicit = (dbName, dialectName = dbName) =>
    (dbFilter && dbFilter.has(dbName)) ||
    (dialectFilter && dialectFilter.has(dialectName));

  const selected = selectGroups(dialectFilter, dbFilter);
  for (const group of selected) {
    const dialects = dialectFilter
      ? group.dialects.filter((dialect) => dialectFilter.has(dialect))
      : group.dialects.slice();
    if (!dialects.length) {
      continue;
    }

    const needsLiveDb = dialects.some((dialect) =>
      shouldUseLiveDb(mode, dialect)
    );

    if (needsLiveDb) {
      if (
        group.name === 'oracledb' &&
        !ensureOptionalModule('oracledb', {
          groupName: group.name,
          required: isExplicit('oracledb'),
          hint: 'Install Oracle client libraries via scripts/oracledb-install-driver-libs.sh.',
        })
      ) {
        continue;
      }
    }

    if (needsLiveDb && group.envRequired && !process.env[group.envRequired]) {
      throw new Error(
        `${group.envRequired} is required for ${group.name} snippets.`
      );
    }

    // Start/stop services per group to keep DB lifecycles isolated.
    if (group.docker && needsLiveDb) {
      await dockerUp(group.service, group.wait);
    }
    try {
      await runResolver(dialects, group.env, mode);
    } finally {
      if (group.docker && needsLiveDb) {
        await dockerDown();
      }
    }
  }
}

function printHelp() {
  const groupList = groups
    .map((group) => `${group.name} (${group.dialects.join(', ')})`)
    .join('\n  ');
  console.log(`Resolve schema builder snippets using docker-compose databases.

Usage:
  node docs/scripts/resolve-schema-snippets-docker.mjs
  node docs/scripts/resolve-schema-snippets-docker.mjs --db mysql
  node docs/scripts/resolve-schema-snippets-docker.mjs --dialect postgres

Options:
  --db, --database   Comma-separated database groups to run
  --dialect, -d      Comma-separated dialects to run
  --mode             live | compile (default: live)

Notes:
  Live mode is the default for all dialects except Redshift.
  SQLite always uses a live in-memory database.
  Redshift is always compile-only.

Groups:
  ${groupList}
`);
}

function parseListFlag(args, names) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (names.includes(args[i])) {
      const value = args[i + 1];
      if (!value) {
        throw new Error(`Missing value for ${args[i]}`);
      }
      i += 1;
      values.push(...value.split(',').map((entry) => entry.trim()));
    }
  }
  const filtered = values.filter(Boolean);
  return filtered.length ? new Set(filtered) : null;
}

function parseMode(args) {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--mode') {
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

function selectGroups(dialectFilter, dbFilter) {
  const byDefault = groups.filter((group) => group.default);
  const byDb = dbFilter
    ? groups.filter((group) => dbFilter.has(group.name))
    : null;

  if (dbFilter) {
    const unknown = [...dbFilter].filter(
      (name) => !groups.some((group) => group.name === name)
    );
    if (unknown.length) {
      throw new Error(`Unknown db group(s): ${unknown.join(', ')}`);
    }
  }

  if (dialectFilter) {
    const unknown = [...dialectFilter].filter(
      (dialect) => !groups.some((group) => group.dialects.includes(dialect))
    );
    if (unknown.length) {
      throw new Error(`Unknown dialect(s): ${unknown.join(', ')}`);
    }
  }

  let selected = byDb || byDefault;
  if (dialectFilter) {
    selected = selected.filter((group) =>
      group.dialects.some((dialect) => dialectFilter.has(dialect))
    );
  }
  return selected;
}

function ensureOptionalModule(moduleName, { groupName, required, hint }) {
  try {
    require(moduleName);
    return true;
  } catch (error) {
    const message =
      error && error.message ? String(error.message).split('\n')[0] : '';
    const suffix = message ? ` (${message})` : '';
    const note = hint ? ` ${hint}` : '';
    if (required) {
      throw new Error(
        `${groupName} snippets require ${moduleName}${suffix}.${note}`
      );
    }
    console.warn(
      `Skipping ${groupName} snippets because ${moduleName} could not be loaded${suffix}.${note}`
    );
    return false;
  }
}

async function runResolver(dialects, extraEnv, mode) {
  const args = [
    resolverScript,
    '--dialect',
    dialects.join(','),
    '--mode',
    mode,
  ];
  await runCommand(process.execPath, args, {
    env: { ...process.env, ...(extraEnv || {}) },
    cwd: repoRoot,
  });
}

async function dockerUp(service, waitService) {
  await runCommand('docker', [
    'compose',
    '-f',
    composeFile,
    'up',
    '--build',
    '-d',
    service,
  ]);
  if (waitService) {
    await runCommand('docker', [
      'compose',
      '-f',
      composeFile,
      'up',
      waitService,
    ]);
  }
}

async function dockerDown() {
  await runCommand('docker', ['compose', '-f', composeFile, 'down']);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function shouldUseLiveDb(mode, dialect) {
  if (dialect === 'redshift') {
    return false;
  }
  if (SQLITE_DIALECTS.has(dialect)) {
    return true;
  }
  return mode === 'live';
}

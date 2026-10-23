'use strict';

const { expect } = require('chai');
const { fork, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { getAllDbs } = require('../util/knex-instance-provider');

const mlhAppRoot = path.resolve(__dirname, '../../..');
const mlhKnexLib = require(path.join(mlhAppRoot, 'knex.js'));
const mlhHost = os.hostname();
const mlhT0 = Date.UTC(2031, 0, 15, 8, 0, 0);
const mlhWaitMs = 20000;
const mlhDay = 24 * 3600 * 1000;

// The process that runs one migration command. It reports what happens over
// IPC; given a start time it runs on a clock the test moves forward.
const mlhChildSource = String.raw`'use strict';
const fs = require('fs');
const path = require('path');
// Numbers JSON cannot carry (Infinity, NaN) arrive as { mlhNumber: '<text>' }.
const cfg = JSON.parse(process.argv[2], (key, value) =>
  value && typeof value === 'object' && 'mlhNumber' in value
    ? Number(value.mlhNumber)
    : value
);
const fromApp = (m) => require(require.resolve(m, { paths: [cfg.appRoot] }));
const realSetTimeout = setTimeout;
let clock = null;
if (cfg.clock !== null) {
  clock = fromApp('@sinonjs/fake-timers').install({
    now: cfg.clock,
    toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  });
}
const send = (message) => {
  if (process.connected) process.send(message);
};
const waiting = {};
global.mlhPark = (name) => {
  if (!cfg.park.includes(name)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    waiting[name] = { resolve, reject };
    send({ event: 'parked', name });
  });
};
let gate = null;
if (cfg.gateSource) {
  gate = new Promise((resolve) => {
    waiting.gate = { resolve };
  });
}
class GatedSource {
  async getMigrations() {
    if (gate && cfg.gateSource === 'list') {
      await settle();
      send({ event: 'gated' });
      await gate;
      gate = null;
    }
    return fs.readdirSync(cfg.directory).filter((f) => f.endsWith('.js')).sort();
  }
  getMigrationName(migration) {
    return migration;
  }
  async getMigration(migration) {
    if (gate) {
      send({ event: 'gated' });
      await gate;
      gate = null;
    }
    return require(path.join(cfg.directory, migration));
  }
}
let lastQueryEvent = performance.now();
const knex = require(path.join(cfg.appRoot, 'knex.js'))({
  client: cfg.client,
  connection: { filename: cfg.filename },
  useNullAsDefault: true,
  log: { warn: (message) => send({ event: 'warn', message: String(message) }) },
});
const seen = () => {
  lastQueryEvent = performance.now();
};
knex.on('query', seen);
knex.on('query-response', seen);
knex.on('query-error', seen);
async function settle() {
  do {
    await new Promise((r) => realSetTimeout(r, 25));
  } while (performance.now() - lastQueryEvent < 150);
}
process.on('message', async (message) => {
  if (message.release) {
    const parked = waiting[message.release];
    if (message.fail) parked.reject(new Error(message.fail));
    else parked.resolve();
  }
  if (message.open) waiting.gate.resolve();
  if (message.tick !== undefined) {
    await clock.tickAsync(message.tick);
    await settle();
    send({ event: 'ticked', now: Date.now() });
  }
});
async function main() {
  const config = Object.assign({}, cfg.config);
  if (cfg.gateSource) config.migrationSource = new GatedSource();
  else config.directory = cfg.directory;
  if (cfg.park.includes('beforeAll')) {
    config.beforeAll = () => global.mlhPark('beforeAll');
  }
  if (cfg.park.some((name) => name.startsWith('beforeEach:'))) {
    config.beforeEach = (knex, [migration]) =>
      global.mlhPark(
        'beforeEach:' + String(migration.file || migration).replace(/\.js$/, '')
      );
  }
  if (cfg.park.some((name) => name.startsWith('afterEach:'))) {
    config.afterEach = (knex, [migration]) =>
      global.mlhPark(
        'afterEach:' + String(migration.file || migration).replace(/\.js$/, '')
      );
  }
  if (cfg.park.includes('afterAll')) {
    config.afterAll = () => global.mlhPark('afterAll');
  }
  const migrate = knex.migrate;
  if (cfg.command === 'unlock') return migrate.forceFreeMigrationsLock(config);
  return migrate[cfg.command](config, cfg.all);
}
main()
  .then(
    (result) => send({ event: 'done', result: result === undefined ? null : result }),
    (error) => send({ event: 'error', name: error.name, message: error.message })
  )
  .then(() => knex.destroy())
  .then(() => {
    if (clock) clock.uninstall();
    if (process.connected) process.disconnect();
  });
`;

function mlhMigration(name, { transaction }) {
  return [
    transaction ? '' : 'exports.config = { transaction: false };',
    'exports.up = async (knex) => {',
    `  await knex('mlh_trace').insert({ pid: process.pid, name: '${name}', step: 'start' });`,
    `  if (global.mlhPark) await global.mlhPark('${name}');`,
    `  await knex('mlh_trace').insert({ pid: process.pid, name: '${name}', step: 'end' });`,
    '};',
    'exports.down = async (knex) => {',
    `  await knex('mlh_trace').insert({ pid: process.pid, name: '${name}', step: 'down' });`,
    `  if (global.mlhPark) await global.mlhPark('down:${name}');`,
    '};',
    '',
  ].join('\n');
}

async function mlhWorkspace(client, { transaction = false, oldLock } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlh-'));
  const directory = path.join(dir, 'migrations');
  fs.mkdirSync(directory);
  for (const name of ['001_first', '002_second']) {
    fs.writeFileSync(
      path.join(directory, `${name}.js`),
      mlhMigration(name, { transaction })
    );
  }
  const childFile = path.join(dir, 'mlh-child.js');
  fs.writeFileSync(childFile, mlhChildSource);
  const ws = {
    client,
    dir,
    directory,
    childFile,
    filename: path.join(dir, 'db.sqlite3'),
    children: [],
  };
  await mlhWithKnex(ws, async (knex) => {
    await knex.schema.createTable('mlh_trace', (t) => {
      t.increments('id');
      t.integer('pid');
      t.string('name');
      t.string('step');
    });
    if (oldLock) {
      // The tables as a knex release without this feature leaves them.
      await knex.schema.createTable('knex_migrations', (t) => {
        t.increments();
        t.string('name');
        t.integer('batch');
        t.timestamp('migration_time');
      });
      await knex.schema.createTable('knex_migrations_lock', (t) => {
        t.increments('index').primary();
        t.integer('is_locked');
      });
      await knex('knex_migrations_lock').insert({
        is_locked: oldLock === 'locked' ? 1 : 0,
      });
    }
  });
  return ws;
}

async function mlhWithKnex(ws, fn) {
  const knex = mlhKnexLib({
    client: ws.client,
    connection: { filename: ws.filename },
    useNullAsDefault: true,
  });
  try {
    return await fn(knex);
  } finally {
    await knex.destroy();
  }
}

function mlhTrack(ws, proc, pid) {
  const child = {
    proc,
    pid,
    holder: `${mlhHost}:${pid}`,
    events: [],
    output: '',
    listeners: [],
  };
  const notify = () => child.listeners.slice().forEach((l) => l());
  proc.stdout.on('data', (d) => {
    child.output += d;
    notify();
  });
  proc.stderr.on('data', (d) => (child.output += d));
  proc.on('message', (message) => {
    child.events.push(message);
    notify();
  });
  proc.on('exit', (code, signal) => {
    child.exited = { code, signal };
    notify();
  });
  ws.children.push(child);
  return child;
}

// Starts a migration command in its own process.
function mlhStart(ws, options = {}) {
  const cfg = {
    appRoot: mlhAppRoot,
    client: ws.client,
    filename: ws.filename,
    directory: ws.directory,
    command: options.command || 'latest',
    all: options.all || false,
    config: options.config || {},
    clock: options.clock === undefined ? mlhT0 : options.clock,
    park: options.park || [],
    gateSource: options.gateSource || false,
  };
  const proc = fork(ws.childFile, [JSON.stringify(cfg)], {
    cwd: ws.dir,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  return mlhTrack(ws, proc, proc.pid);
}

// Runs the knex command line in the workspace against its knexfile.
function mlhCli(ws, args, migrations) {
  const knexfile = path.join(ws.dir, 'knexfile.js');
  fs.writeFileSync(
    knexfile,
    `module.exports = ${JSON.stringify({
      client: ws.client,
      connection: { filename: ws.filename },
      useNullAsDefault: true,
      migrations: Object.assign({ directory: ws.directory }, migrations),
    })};\n`
  );
  const proc = spawn(
    process.execPath,
    [path.join(mlhAppRoot, 'bin/cli.js'), ...args, '--knexfile', knexfile],
    {
      cwd: ws.dir,
      env: Object.assign({}, process.env, {
        NO_COLOR: '1',
        KNEX_PATH: path.join(mlhAppRoot, 'knex.js'),
      }),
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  return mlhTrack(ws, proc, proc.pid);
}

function mlhWait(child, predicate, what) {
  return new Promise((resolve, reject) => {
    const check = () => {
      const found = predicate(child);
      if (found) {
        cleanup();
        resolve(found);
      } else if (child.exited) {
        cleanup();
        reject(
          new Error(
            `process ${child.pid} exited before ${what}: ${JSON.stringify(
              child.events
            )} ${child.output}`
          )
        );
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `timed out waiting for ${what} from ${child.pid}: ${JSON.stringify(
            child.events
          )} ${child.output}`
        )
      );
    }, mlhWaitMs);
    const cleanup = () => {
      clearTimeout(timer);
      child.listeners = child.listeners.filter((l) => l !== check);
    };
    child.listeners.push(check);
    check();
  });
}

function mlhEvent(child, predicate, what) {
  return mlhWait(child, (c) => c.events.find(predicate), what);
}

function mlhParked(child, name) {
  return mlhEvent(
    child,
    (e) => e.event === 'parked' && e.name === name,
    `parking in ${name}`
  );
}

function mlhOutcome(child) {
  return mlhEvent(
    child,
    (e) => e.event === 'done' || e.event === 'error',
    'the end of its command'
  );
}

function mlhExit(child) {
  return mlhWait(child, (c) => c.exited, 'its exit');
}

async function mlhTick(child, ms) {
  const before = child.events.filter((e) => e.event === 'ticked').length;
  child.proc.send({ tick: ms });
  await mlhEvent(
    child,
    () => child.events.filter((x) => x.event === 'ticked').length > before,
    `a clock tick of ${ms} ms`
  );
}

function mlhRelease(child, name, fail) {
  child.proc.send({ release: name, fail });
}

async function mlhKill(child) {
  child.proc.kill('SIGKILL');
  await mlhExit(child).catch(() => {});
}

function mlhWarnings(child) {
  return child.events.filter((e) => e.event === 'warn').map((e) => e.message);
}

function mlhIso(ms) {
  return new Date(ms).toISOString();
}

async function mlhState(ws) {
  return mlhWithKnex(ws, async (knex) => {
    // A command refused before it touched the database left no tables.
    const lock = (await knex.schema.hasTable('knex_migrations_lock'))
      ? await knex('knex_migrations_lock').select('*')
      : [];
    const done = (await knex.schema.hasTable('knex_migrations'))
      ? await knex('knex_migrations').select('name', 'batch').orderBy('id')
      : [];
    const trace = await knex('mlh_trace').select('*').orderBy('id');
    return { lock, done, trace };
  });
}

// The migration tables a command left in a workspace.
async function mlhTables(ws) {
  return mlhWithKnex(ws, async (knex) => {
    const tables = [];
    for (const name of ['knex_migrations', 'knex_migrations_lock']) {
      if (await knex.schema.hasTable(name)) tables.push(name);
    }
    return tables;
  });
}

function mlhSteps(state, pid) {
  return state.trace
    .filter((t) => t.pid === pid)
    .map((t) => `${t.name}:${t.step}`);
}

function mlhExpectLockFree(state) {
  expect(state.lock).to.have.length(1);
  expect(Number(state.lock[0].is_locked)).to.equal(0);
}

function mlhExpectRecorded(state, records) {
  expect(state.done).to.deep.equal(
    records.map(([name, batch]) => ({ name: `${name}.js`, batch }))
  );
}

// The outcome of a run refused by the holder of a live lock.
function mlhRefusal(holder, expiresAt) {
  return {
    event: 'error',
    name: 'MigrationLocked',
    message: `Migration table is already locked by ${holder} until ${mlhIso(
      expiresAt
    )}`,
  };
}

function mlhExpectRefusedBy(outcome, holder, expiresAt) {
  expect(outcome).to.deep.equal(mlhRefusal(holder, expiresAt));
}

function mlhTookOver(holder, expiredAt) {
  return `Took over the migration lock held by ${holder}, which expired at ${mlhIso(
    expiredAt
  )}`;
}

const mlhBoth = [
  [1, ['001_first.js', '002_second.js']],
  [
    ['001_first', 1],
    ['002_second', 1],
  ],
];

for (const mlhClient of ['sqlite3', 'better-sqlite3'].filter((db) =>
  getAllDbs().includes(db)
)) {
  describe(`migration lock holders (${mlhClient})`, function () {
    this.timeout(90000);
    let ws;
    const mlhOpen = async (options) => {
      ws = await mlhWorkspace(mlhClient, options);
      return ws;
    };

    afterEach(async () => {
      for (const w of [ws].concat(ws && ws.others ? ws.others : [])) {
        if (!w) continue;
        for (const child of w.children) {
          if (!child.exited) child.proc.kill('SIGKILL');
        }
        fs.rmSync(w.dir, { recursive: true, force: true });
      }
      ws = null;
    });

    it('takes over the lock of a run that died once its time is up, and runs what that run left', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const dead = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);

      const early = mlhStart(ws, { config, clock: mlhT0 + 59999 });
      mlhExpectRefusedBy(await mlhOutcome(early), dead.holder, mlhT0 + 60000);
      let state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      expect(Number(state.lock[0].is_locked)).to.equal(1);

      const late = mlhStart(ws, { config, clock: mlhT0 + 60001 });
      expect(await mlhOutcome(late)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(late)).to.include(
        mlhTookOver(dead.holder, mlhT0 + 60000)
      );
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, dead.pid)).to.deep.equal(['001_first:start']);
      expect(mlhSteps(state, late.pid)).to.deep.equal([
        '001_first:start',
        '001_first:end',
        '002_second:start',
        '002_second:end',
      ]);
      mlhExpectLockFree(state);
    });

    it('keeps the lock for exactly lockTimeout ms when it is not a round number', async () => {
      await mlhOpen();
      const config = { lockTimeout: 12345 };
      const dead = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);

      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 12344 })),
        dead.holder,
        mlhT0 + 12345
      );
      const late = mlhStart(ws, { config, clock: mlhT0 + 12346 });
      expect(await mlhOutcome(late)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(late)).to.include(
        mlhTookOver(dead.holder, mlhT0 + 12345)
      );
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('keeps the lock with a run that takes longer than lockTimeout in all when each migration takes less', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const holder = mlhStart(ws, {
        config,
        park: ['001_first', '002_second'],
      });
      await mlhParked(holder, '001_first');
      await mlhTick(holder, 40000);
      mlhRelease(holder, '001_first');
      await mlhParked(holder, '002_second');

      // Past the time the run first took the lock for, while it is alive and
      // inside its second migration, which it began at mlhT0 + 40000.
      const other = mlhStart(ws, { config, clock: mlhT0 + 90000 });
      mlhExpectRefusedBy(
        await mlhOutcome(other),
        holder.holder,
        mlhT0 + 100000
      );

      mlhRelease(holder, '002_second');
      expect(await mlhOutcome(holder)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(holder).join('\n')).to.not.contain('Took over');
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, other.pid)).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('lets exactly one of two runs take over an expired lock', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const dead = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);

      const racers = [0, 1].map(() =>
        mlhStart(ws, { config, clock: mlhT0 + 120000, park: ['001_first'] })
      );
      const winner = await Promise.any(
        racers.map((r) => mlhParked(r, '001_first').then(() => r))
      );
      const loser = racers.find((r) => r !== winner);
      // The loser is refused by the run that took the lock over.
      mlhExpectRefusedBy(
        await mlhOutcome(loser),
        winner.holder,
        mlhT0 + 180000
      );
      expect(mlhWarnings(winner)).to.include(
        mlhTookOver(dead.holder, mlhT0 + 60000)
      );
      expect(mlhWarnings(loser).join('\n')).to.not.contain('Took over');

      mlhRelease(winner, '001_first');
      expect(await mlhOutcome(winner)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, loser.pid)).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('stops a run that lost its lock before it records anything more, and leaves the new holder its lock', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const stalled = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(stalled, '001_first');

      const next = mlhStart(ws, {
        config,
        clock: mlhT0 + 60001,
        park: ['001_first'],
      });
      await mlhParked(next, '001_first');
      expect(mlhWarnings(next)).to.include(
        mlhTookOver(stalled.holder, mlhT0 + 60000)
      );

      mlhRelease(stalled, '001_first');
      expect(await mlhOutcome(stalled)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: `Migration lock was lost to ${next.holder}`,
      });
      let state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      expect(mlhSteps(state, stalled.pid)).to.deep.equal([
        '001_first:start',
        '001_first:end',
      ]);

      const third = mlhStart(ws, { config, clock: mlhT0 + 60002 });
      mlhExpectRefusedBy(await mlhOutcome(third), next.holder, mlhT0 + 120001);

      mlhRelease(next, '001_first');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('holds the lock for 600000 ms when lockTimeout is not given', async () => {
      await mlhOpen();
      const dead = mlhStart(ws, { park: ['001_first'] });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);

      const early = mlhStart(ws, { clock: mlhT0 + 599999 });
      mlhExpectRefusedBy(await mlhOutcome(early), dead.holder, mlhT0 + 600000);

      const late = mlhStart(ws, { clock: mlhT0 + 600001 });
      expect(await mlhOutcome(late)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(late)).to.include(
        mlhTookOver(dead.holder, mlhT0 + 600000)
      );
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('keeps what a run recorded while it held the lock and stops it in its next migration once the lock is lost', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const stalled = mlhStart(ws, { config, park: ['002_second'] });
      await mlhParked(stalled, '002_second');

      const next = mlhStart(ws, {
        config,
        clock: mlhT0 + 60001,
        park: ['002_second'],
      });
      await mlhParked(next, '002_second');

      mlhRelease(stalled, '002_second');
      expect(await mlhOutcome(stalled)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: `Migration lock was lost to ${next.holder}`,
      });
      mlhExpectRecorded(await mlhState(ws), [['001_first', 1]]);

      mlhRelease(next, '002_second');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: [2, ['002_second.js']],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, [
        ['001_first', 1],
        ['002_second', 2],
      ]);
      expect(mlhSteps(state, next.pid)).to.deep.equal([
        '002_second:start',
        '002_second:end',
      ]);
      mlhExpectLockFree(state);
    });

    it('lets migrate:unlock take the lock away from a running process', async () => {
      await mlhOpen();
      const running = mlhStart(ws, { park: ['001_first'] });
      await mlhParked(running, '001_first');
      expect(
        await mlhOutcome(mlhStart(ws, { command: 'unlock' }))
      ).to.deep.equal({ event: 'done', result: null });

      const next = mlhStart(ws, { park: ['001_first'] });
      await mlhParked(next, '001_first');
      expect(mlhWarnings(next).join('\n')).to.not.contain('Took over');
      mlhRelease(running, '001_first');
      expect(await mlhOutcome(running)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: `Migration lock was lost to ${next.holder}`,
      });
      mlhRelease(next, '001_first');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      let state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);

      // With nobody holding the lock once it was released.
      const alone = await mlhWorkspace(mlhClient);
      ws.others = [alone];
      const left = mlhStart(alone, { park: ['001_first'] });
      await mlhParked(left, '001_first');
      await mlhOutcome(mlhStart(alone, { command: 'unlock' }));
      mlhRelease(left, '001_first');
      expect(await mlhOutcome(left)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: 'Migration lock was lost',
      });
      state = await mlhState(alone);
      expect(state.done).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('stops a running process whose lock ran out though nobody took it over', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const running = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(running, '001_first');
      // It extended the lock to mlhT0 + 60000 before this migration, and its
      // own clock passes that while it is still inside it.
      await mlhTick(running, 60001);
      mlhRelease(running, '001_first');
      expect(await mlhOutcome(running)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: 'Migration lock was lost',
      });
      let state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      expect(mlhSteps(state, running.pid)).to.deep.equal([
        '001_first:start',
        '001_first:end',
      ]);

      const next = mlhStart(ws, { config, clock: mlhT0 + 60001 });
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('stops a run that lost its lock in its beforeAll hook before it runs or rolls back any migration', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      // Its lock runs out inside beforeAll and another run takes it over.
      const running = mlhStart(ws, { config, park: ['beforeAll'] });
      await mlhParked(running, 'beforeAll');
      const next = mlhStart(ws, {
        config,
        clock: mlhT0 + 60001,
        park: ['001_first'],
      });
      await mlhParked(next, '001_first');
      mlhRelease(running, 'beforeAll');
      expect(await mlhOutcome(running)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: `Migration lock was lost to ${next.holder}`,
      });
      // The run that took it over keeps it.
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 60002 })),
        next.holder,
        mlhT0 + 120001
      );
      mlhRelease(next, '001_first');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      let state = await mlhState(ws);
      expect(mlhSteps(state, running.pid)).to.deep.equal([]);
      mlhExpectRecorded(state, mlhBoth[1]);

      // A rollback whose lock runs out inside beforeAll, with nobody taking it.
      const rollback = mlhStart(ws, {
        command: 'rollback',
        config,
        park: ['beforeAll'],
      });
      await mlhParked(rollback, 'beforeAll');
      await mlhTick(rollback, 60001);
      mlhRelease(rollback, 'beforeAll');
      expect(await mlhOutcome(rollback)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: 'Migration lock was lost',
      });
      state = await mlhState(ws);
      expect(mlhSteps(state, rollback.pid)).to.deep.equal([]);
      mlhExpectRecorded(state, mlhBoth[1]);

      const later = mlhStart(ws, {
        command: 'rollback',
        config,
        clock: mlhT0 + 60001,
      });
      expect(await mlhOutcome(later)).to.deep.equal({
        event: 'done',
        result: [1, ['002_second.js', '001_first.js']],
      });
      state = await mlhState(ws);
      mlhExpectRecorded(state, []);
      mlhExpectLockFree(state);
    });

    it('does not run a migration whose lock was lost in its beforeEach hook, and leaves the new holder its lock', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      // Its lock runs out in the first migration's beforeEach hook, before that
      // migration starts, and another run takes it over.
      const running = mlhStart(ws, { config, park: ['beforeEach:001_first'] });
      await mlhParked(running, 'beforeEach:001_first');
      const next = mlhStart(ws, {
        config,
        clock: mlhT0 + 60001,
        park: ['001_first'],
      });
      await mlhParked(next, '001_first');
      mlhRelease(running, 'beforeEach:001_first');
      expect(await mlhOutcome(running)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: `Migration lock was lost to ${next.holder}`,
      });
      let state = await mlhState(ws);
      expect(mlhSteps(state, running.pid)).to.deep.equal([]);
      mlhExpectRecorded(state, []);
      // The run that took it over keeps it.
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 60002 })),
        next.holder,
        mlhT0 + 120001
      );
      mlhRelease(next, '001_first');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, running.pid)).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('does not record a migration whose lock was lost in its afterEach hook, and leaves the new holder its lock', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      // The first migration has run; its lock runs out inside afterEach and
      // another run takes it over.
      const running = mlhStart(ws, { config, park: ['afterEach:001_first'] });
      await mlhParked(running, 'afterEach:001_first');
      const next = mlhStart(ws, {
        config,
        clock: mlhT0 + 60001,
        park: ['001_first'],
      });
      await mlhParked(next, '001_first');
      mlhRelease(running, 'afterEach:001_first');
      expect(await mlhOutcome(running)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: `Migration lock was lost to ${next.holder}`,
      });
      let state = await mlhState(ws);
      mlhExpectRecorded(state, []);
      expect(mlhSteps(state, running.pid)).to.deep.equal([
        '001_first:start',
        '001_first:end',
      ]);
      // The run that took it over keeps it.
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 60002 })),
        next.holder,
        mlhT0 + 120001
      );
      mlhRelease(next, '001_first');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, running.pid)).to.deep.equal([
        '001_first:start',
        '001_first:end',
      ]);
      mlhExpectLockFree(state);
    });

    it('stops a run whose lock ran out in its afterAll hook, and keeps what it recorded', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const running = mlhStart(ws, { config, park: ['afterAll'] });
      await mlhParked(running, 'afterAll');
      // It extended the lock to mlhT0 + 60000 as it recorded its last
      // migration, and its own clock passes that inside the hook.
      await mlhTick(running, 60001);
      mlhRelease(running, 'afterAll');
      expect(await mlhOutcome(running)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: 'Migration lock was lost',
      });
      let state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);

      const next = mlhStart(ws, { config, clock: mlhT0 + 60001 });
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: [1, []],
      });
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('releases the lock of a run that dies inside a single transaction at once, and waits for one that dies outside it', async () => {
      await mlhOpen({ transaction: true });
      const config = { lockTimeout: 60000 };
      const inTransaction = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(inTransaction, '001_first');
      await mlhKill(inTransaction);
      const next = mlhStart(ws, { config });
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(next).join('\n')).to.not.contain('Took over');
      let state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, inTransaction.pid)).to.deep.equal([]);
      mlhExpectLockFree(state);

      const outside = await mlhWorkspace(mlhClient);
      ws.others = [outside];
      const dead = mlhStart(outside, { config, park: ['001_first'] });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(outside, { config })),
        dead.holder,
        mlhT0 + 60000
      );
      state = await mlhState(outside);
      expect(state.done).to.deep.equal([]);
    });

    it('fails a run with nothing to run whose lock ran out before it released it', async () => {
      await mlhOpen();
      // On real time, a 1 ms lock runs out in the work between taking the lock
      // and releasing it; without a one-transaction batch, nothing holds it.
      const config = { lockTimeout: 1, disableTransactions: true };
      const lost = {
        event: 'error',
        name: 'MigrationLocked',
        message: 'Migration lock was lost',
      };
      // A rollback with nothing applied.
      const rollback = mlhStart(ws, {
        command: 'rollback',
        config,
        clock: null,
      });
      expect(await mlhOutcome(rollback)).to.deep.equal(lost);
      let state = await mlhState(ws);
      mlhExpectRecorded(state, []);
      expect(mlhSteps(state, rollback.pid)).to.deep.equal([]);

      // A run up with everything applied; the run that applies it takes the
      // lock the rollback left over.
      expect((await mlhOutcome(mlhStart(ws, { clock: null }))).event).to.equal(
        'done'
      );
      const latest = mlhStart(ws, { config, clock: null });
      expect(await mlhOutcome(latest)).to.deep.equal(lost);
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, latest.pid)).to.deep.equal([]);
    });

    it('rereads which migrations are applied once it holds the lock', async () => {
      await mlhOpen();
      const gated = mlhStart(ws, { gateSource: true });
      await mlhEvent(gated, (e) => e.event === 'gated', 'reading a migration');
      // A run may read its migrations before it takes the lock, or take the
      // lock first and read them while holding it. In the first case the
      // other run goes ahead and this one chooses again once it has the lock;
      // in the second the other run is refused by this one.
      const first = mlhStart(ws, {});
      const other = await mlhOutcome(first);
      const lockedFirst = other.event === 'error';
      expect(other).to.deep.equal(
        lockedFirst
          ? mlhRefusal(gated.holder, mlhT0 + 600000)
          : { event: 'done', result: mlhBoth[0] }
      );

      gated.proc.send({ open: true });
      expect(await mlhOutcome(gated)).to.deep.equal({
        event: 'done',
        result: lockedFirst ? mlhBoth[0] : [1, []],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, (lockedFirst ? first : gated).pid)).to.deep.equal(
        []
      );
      mlhExpectLockFree(state);
    });

    it('refuses a lockTimeout that is not a positive finite number before it takes the lock or runs anything', async () => {
      const refused = [
        { lockTimeout: 0 },
        { lockTimeout: -1 },
        { lockTimeout: 'soon' },
        { lockTimeout: { mlhNumber: 'Infinity' } },
        { lockTimeout: { mlhNumber: '-Infinity' } },
        { lockTimeout: { mlhNumber: 'NaN' } },
        { lockTimeout: '1' },
        { lockTimeout: true },
        { lockTimeout: [1] },
      ];
      ws = {
        children: [],
        dir: fs.mkdtempSync(path.join(os.tmpdir(), 'mlh-')),
      };
      ws.others = [];
      for (const config of refused) {
        const w = await mlhWorkspace(mlhClient);
        ws.others.push(w);
        const outcome = await mlhOutcome(mlhStart(w, { config }));
        expect(outcome.event, JSON.stringify(config)).to.equal('error');
        const state = await mlhState(w);
        expect(state.done, JSON.stringify(config)).to.deep.equal([]);
        expect(state.trace, JSON.stringify(config)).to.deep.equal([]);
        expect(
          state.lock.filter((l) => Number(l.is_locked)),
          JSON.stringify(config)
        ).to.deep.equal([]);
        // It failed before it created or touched the migration tables.
        expect(await mlhTables(w), JSON.stringify(config)).to.deep.equal([]);
      }

      const early = await mlhWorkspace(mlhClient);
      ws.others.push(early);
      const before = await mlhOutcome(
        mlhStart(early, {
          command: 'before',
          config: { name: '001_first.js', lockTimeout: 0 },
        })
      );
      expect(before.event).to.equal('error');
      expect(await mlhTables(early), 'before').to.deep.equal([]);

      // Every other command that runs migrations refuses it the same way.
      for (const [command, config] of [
        ['up', { lockTimeout: 0 }],
        ['to', { name: '002_second.js', lockTimeout: 0 }],
      ]) {
        const fresh = await mlhWorkspace(mlhClient);
        ws.others.push(fresh);
        const outcome = await mlhOutcome(mlhStart(fresh, { command, config }));
        expect(outcome.event, command).to.equal('error');
        const state = await mlhState(fresh);
        expect(state.done, command).to.deep.equal([]);
        expect(state.trace, command).to.deep.equal([]);
        expect(
          state.lock.filter((l) => Number(l.is_locked)),
          command
        ).to.deep.equal([]);
        expect(await mlhTables(fresh), command).to.deep.equal([]);
      }
      for (const command of ['rollback', 'down']) {
        const applied = await mlhWorkspace(mlhClient);
        ws.others.push(applied);
        expect((await mlhOutcome(mlhStart(applied, {}))).event).to.equal(
          'done'
        );
        const outcome = await mlhOutcome(
          mlhStart(applied, { command, config: { lockTimeout: 0 } })
        );
        expect(outcome.event, command).to.equal('error');
        const state = await mlhState(applied);
        mlhExpectRecorded(state, mlhBoth[1]);
        expect(
          state.trace.filter((t) => t.step === 'down'),
          command
        ).to.deep.equal([]);
        expect(
          state.lock.filter((l) => Number(l.is_locked)),
          command
        ).to.deep.equal([]);
      }

      for (const lockTimeout of [1, 60000.5]) {
        const w = await mlhWorkspace(mlhClient);
        ws.others.push(w);
        const accepted = mlhStart(w, { config: { lockTimeout } });
        expect(await mlhOutcome(accepted), String(lockTimeout)).to.deep.equal({
          event: 'done',
          result: mlhBoth[0],
        });
      }
    });

    it('refuses a lockTimeout that is not a positive finite number while another run holds the lock, and leaves that run its lock', async () => {
      await mlhOpen();
      const commands = [
        ['latest', { lockTimeout: 0 }],
        ['up', { lockTimeout: 0 }],
        ['to', { name: '002_second.js', lockTimeout: 0 }],
        ['before', { name: '002_second.js', lockTimeout: 0 }],
        ['rollback', { lockTimeout: 0 }],
        ['down', { lockTimeout: 0 }],
      ];
      // How each command fails on its lockTimeout while the lock is free.
      const free = [];
      for (const [command, config] of commands) {
        free.push(await mlhOutcome(mlhStart(ws, { command, config })));
      }

      const holder = mlhStart(ws, { park: ['001_first'] });
      await mlhParked(holder, '001_first');
      // A run with a valid lockTimeout is refused by the holder here, so a
      // run that looks at the lock before its lockTimeout is refused too.
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, {})),
        holder.holder,
        mlhT0 + 600000
      );
      const { lock } = await mlhState(ws);
      for (const [i, [command, config]] of commands.entries()) {
        const outcome = await mlhOutcome(mlhStart(ws, { command, config }));
        expect(outcome.event, command).to.equal('error');
        expect(outcome.name, command).to.not.equal('MigrationLocked');
        expect(outcome, command).to.deep.equal(free[i]);
      }
      expect((await mlhState(ws)).lock).to.deep.equal(lock);

      mlhRelease(holder, '001_first');
      expect(await mlhOutcome(holder)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, holder.pid)).to.deep.equal([
        '001_first:start',
        '001_first:end',
        '002_second:start',
        '002_second:end',
      ]);
      mlhExpectLockFree(state);
    });

    it('upgrades a lock table from an earlier version and keeps a lock it holds without a holder until it is released', async () => {
      await mlhOpen({ oldLock: 'locked' });
      const config = { lockTimeout: 60000 };
      for (const clock of [mlhT0, mlhT0 + 3650 * mlhDay]) {
        const refused = mlhStart(ws, { config, clock });
        expect(await mlhOutcome(refused)).to.deep.equal({
          event: 'error',
          name: 'MigrationLocked',
          message: 'Migration table is already locked',
        });
      }
      let state = await mlhState(ws);
      expect(state.lock).to.have.length(1);
      expect(Number(state.lock[0].is_locked)).to.equal(1);
      await mlhOutcome(mlhStart(ws, { command: 'unlock' }));

      const dead = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 1000 })),
        dead.holder,
        mlhT0 + 60000
      );
      const late = mlhStart(ws, { config, clock: mlhT0 + 60001 });
      expect(await mlhOutcome(late)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(late)).to.include(
        mlhTookOver(dead.holder, mlhT0 + 60000)
      );
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('does not roll back again what another run rolled back while it waited for the lock', async () => {
      await mlhOpen();
      expect((await mlhOutcome(mlhStart(ws, {}))).event).to.equal('done');
      const waited = mlhStart(ws, { command: 'down', gateSource: 'list' });
      await mlhEvent(
        waited,
        (e) => e.event === 'gated',
        'reading the migrations'
      );
      // A run may read its migrations before it takes the lock, or take the
      // lock first and read them while holding it. In the first case the
      // other run goes ahead and this one chooses again once it has the lock;
      // in the second the other run is refused by this one.
      const first = mlhStart(ws, { command: 'down' });
      const other = await mlhOutcome(first);
      const lockedFirst = other.event === 'error';
      expect(other).to.deep.equal(
        lockedFirst
          ? mlhRefusal(waited.holder, mlhT0 + 600000)
          : { event: 'done', result: [1, ['002_second.js']] }
      );

      // It rolls back what is applied once it holds the lock: 001_first alone
      // if the other run rolled back 002_second first.
      waited.proc.send({ open: true });
      const last = lockedFirst ? '002_second' : '001_first';
      expect(await mlhOutcome(waited)).to.deep.equal({
        event: 'done',
        result: [1, [`${last}.js`]],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, lockedFirst ? [['001_first', 1]] : []);
      expect(mlhSteps(state, waited.pid)).to.deep.equal([`${last}:down`]);
      expect(mlhSteps(state, first.pid)).to.deep.equal(
        lockedFirst ? [] : ['002_second:down']
      );
      mlhExpectLockFree(state);
    });

    it('runs what another run rolled back while it waited for the lock, with every command that migrates', async () => {
      ws = {
        children: [],
        dir: fs.mkdtempSync(path.join(os.tmpdir(), 'mlh-')),
      };
      ws.others = [];
      const both = [
        ['001_first', 1],
        ['002_second', 2],
      ];
      // The records it leaves; the last is the migration it runs again.
      for (const [command, config, records] of [
        ['latest', {}, both],
        ['up', {}, both],
        ['to', { name: '002_second.js' }, both],
        ['before', { name: '002_second.js' }, [both[0]]],
      ]) {
        const what = command;
        const [ran, batch] = records[records.length - 1];
        const w = await mlhWorkspace(mlhClient);
        ws.others.push(w);
        // What it would run is applied when it reads the migrations; another
        // run rolls back the last of it.
        const setup = command === 'before' ? 'up' : 'latest';
        expect(
          (await mlhOutcome(mlhStart(w, { command: setup }))).event
        ).to.equal('done');
        const applied = (await mlhState(w)).done.map((r) => [
          r.name.replace('.js', ''),
          r.batch,
        ]);
        const waited = mlhStart(w, { command, config, gateSource: 'list' });
        await mlhEvent(waited, (e) => e.event === 'gated', `${what} listing`);
        // A run may read its migrations before it takes the lock, or take the
        // lock first and read them while holding it. In the first case the
        // other run goes ahead and this one chooses again once it has the lock;
        // in the second the other run is refused by this one.
        const other = await mlhOutcome(mlhStart(w, { command: 'down' }));
        const lockedFirst = other.event === 'error';
        expect(other, what).to.deep.equal(
          lockedFirst
            ? mlhRefusal(waited.holder, mlhT0 + 600000)
            : { event: 'done', result: [1, [`${ran}.js`]] }
        );

        // Holding the lock first, it finds everything applied; otherwise it
        // runs again what the other run rolled back.
        waited.proc.send({ open: true });
        expect(await mlhOutcome(waited), what).to.deep.equal({
          event: 'done',
          result: lockedFirst ? [1, []] : [batch, [`${ran}.js`]],
        });
        const state = await mlhState(w);
        mlhExpectRecorded(state, lockedFirst ? applied : records);
        expect(mlhSteps(state, waited.pid), what).to.deep.equal(
          lockedFirst ? [] : [`${ran}:start`, `${ran}:end`]
        );
        mlhExpectLockFree(state);
      }
    });

    it('rolls back what another run applied while it waited for the lock, with every command that rolls back', async () => {
      ws = {
        children: [],
        dir: fs.mkdtempSync(path.join(os.tmpdir(), 'mlh-')),
      };
      ws.others = [];
      const both = ['002_second.js', '001_first.js'];
      // The migrations it rolls back, and the records it leaves.
      for (const [options, ran, records] of [
        [{ command: 'down' }, both.slice(0, 1), [['001_first', 1]]],
        [{ command: 'rollback' }, both, []],
        [{ command: 'rollback', all: true }, both, []],
      ]) {
        const what = JSON.stringify(options);
        const w = await mlhWorkspace(mlhClient);
        ws.others.push(w);
        // Nothing is applied when it reads the migrations; another run applies
        // both before it takes the lock.
        const waited = mlhStart(
          w,
          Object.assign({ gateSource: 'list' }, options)
        );
        await mlhEvent(
          waited,
          (e) => e.event === 'gated',
          `${what} reading the migrations`
        );
        // A run may read its migrations before it takes the lock, or take the
        // lock first and read them while holding it. In the first case the
        // other run goes ahead and this one chooses again once it has the lock;
        // in the second the other run is refused by this one.
        const other = await mlhOutcome(mlhStart(w, {}));
        const lockedFirst = other.event === 'error';
        expect(other, what).to.deep.equal(
          lockedFirst
            ? mlhRefusal(waited.holder, mlhT0 + 600000)
            : { event: 'done', result: mlhBoth[0] }
        );

        // Holding the lock first, it finds nothing applied; otherwise it rolls
        // back what the other run applied.
        waited.proc.send({ open: true });
        expect(await mlhOutcome(waited), what).to.deep.equal({
          event: 'done',
          result: lockedFirst ? [0, []] : [1, ran],
        });
        const state = await mlhState(w);
        mlhExpectRecorded(state, lockedFirst ? [] : records);
        expect(mlhSteps(state, waited.pid), what).to.deep.equal(
          lockedFirst
            ? []
            : ran.map((name) => `${name.replace('.js', '')}:down`)
        );
        mlhExpectLockFree(state);
      }
    });

    it('puts a lock table that a race left with several unlocked rows back to one row', async () => {
      await mlhOpen({ oldLock: 'unlocked' });
      await mlhWithKnex(ws, (knex) =>
        knex('knex_migrations_lock').insert([
          { is_locked: 0 },
          { is_locked: 0 },
        ])
      );
      const run = mlhStart(ws, {});
      expect(await mlhOutcome(run)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('refuses a run while the lock is held even when a starting race left a free lock row beside it', async () => {
      await mlhOpen();
      const holder = mlhStart(ws, { park: ['001_first'] });
      await mlhParked(holder, '001_first');
      // The row a second starter adds after the first one has taken the lock.
      await mlhWithKnex(ws, (knex) =>
        knex('knex_migrations_lock').insert({ is_locked: 0 })
      );

      const late = mlhStart(ws, {});
      mlhExpectRefusedBy(await mlhOutcome(late), holder.holder, mlhT0 + 600000);

      mlhRelease(holder, '001_first');
      expect(await mlhOutcome(holder)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect((await mlhOutcome(mlhStart(ws, {}))).event).to.equal('done');
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      expect(mlhSteps(state, late.pid)).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('lets several processes start against an empty database at once', async () => {
      ws = {
        children: [],
        dir: fs.mkdtempSync(path.join(os.tmpdir(), 'mlh-')),
      };
      ws.others = [];
      for (let round = 0; round < 5; round++) {
        const w = await mlhWorkspace(mlhClient);
        ws.others.push(w);
        const starters = [0, 1, 2, 3].map(() =>
          mlhStart(w, { clock: null, park: ['001_first'] })
        );
        // The one that gets the lock waits inside its first migration, so
        // every other starter ends while the migrations are still running.
        const winner = await Promise.any(
          starters.map((s) => mlhParked(s, '001_first').then(() => s))
        );
        const others = starters.filter((s) => s !== winner);
        // Each starter that lost, and a run started once they are done, is
        // refused by the winner, with a real time.
        const prefix = `Migration table is already locked by ${winner.holder} until `;
        const late = mlhStart(w, { clock: null });
        for (const other of others.concat(late)) {
          const outcome = await mlhOutcome(other);
          expect(outcome.event, JSON.stringify(outcome)).to.equal('error');
          expect(outcome.name, outcome.message).to.equal('MigrationLocked');
          expect(outcome.message.startsWith(prefix), outcome.message).to.equal(
            true
          );
          const until = outcome.message.slice(prefix.length);
          expect(new Date(until).toISOString()).to.equal(until);
        }

        mlhRelease(winner, '001_first');
        expect(await mlhOutcome(winner)).to.deep.equal({
          event: 'done',
          result: mlhBoth[0],
        });
        const state = await mlhState(w);
        mlhExpectRecorded(state, mlhBoth[1]);
        for (const other of others.concat(late)) {
          expect(mlhSteps(state, other.pid)).to.deep.equal([]);
        }
        mlhExpectLockFree(state);
      }
    });

    it('shares the lock with rollback: a rollback that died is taken over once its time is up', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      expect((await mlhOutcome(mlhStart(ws, { config }))).event).to.equal(
        'done'
      );
      const dead = mlhStart(ws, {
        command: 'rollback',
        config,
        park: ['down:002_second'],
      });
      await mlhParked(dead, 'down:002_second');
      await mlhKill(dead);

      mlhExpectRefusedBy(
        await mlhOutcome(
          mlhStart(ws, { command: 'rollback', config, clock: mlhT0 + 59999 })
        ),
        dead.holder,
        mlhT0 + 60000
      );
      const late = mlhStart(ws, {
        command: 'rollback',
        config,
        clock: mlhT0 + 60001,
      });
      expect(await mlhOutcome(late)).to.deep.equal({
        event: 'done',
        result: [1, ['002_second.js', '001_first.js']],
      });
      expect(mlhWarnings(late)).to.include(
        mlhTookOver(dead.holder, mlhT0 + 60000)
      );
      const state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('keeps the lock with a rollback that takes longer than lockTimeout in all when each migration takes less', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      expect((await mlhOutcome(mlhStart(ws, { config }))).event).to.equal(
        'done'
      );
      const holder = mlhStart(ws, {
        command: 'rollback',
        config,
        park: ['down:002_second', 'down:001_first'],
      });
      await mlhParked(holder, 'down:002_second');
      await mlhTick(holder, 40000);
      mlhRelease(holder, 'down:002_second');
      await mlhParked(holder, 'down:001_first');

      // Past the time the rollback first took the lock for, while it is alive
      // and inside its second migration, which it began at mlhT0 + 40000.
      const other = mlhStart(ws, {
        command: 'rollback',
        config,
        clock: mlhT0 + 90000,
      });
      mlhExpectRefusedBy(
        await mlhOutcome(other),
        holder.holder,
        mlhT0 + 100000
      );

      mlhRelease(holder, 'down:001_first');
      expect(await mlhOutcome(holder)).to.deep.equal({
        event: 'done',
        result: [1, ['002_second.js', '001_first.js']],
      });
      expect(mlhWarnings(holder).join('\n')).to.not.contain('Took over');
      const state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      expect(mlhSteps(state, other.pid)).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('stops a rollback whose lock ran out before it removes the record of the migration it was on', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      expect((await mlhOutcome(mlhStart(ws, { config }))).event).to.equal(
        'done'
      );
      const rollback = mlhStart(ws, {
        command: 'rollback',
        config,
        park: ['down:001_first'],
      });
      await mlhParked(rollback, 'down:001_first');
      // It rolled back 002_second and extended the lock to mlhT0 + 60000
      // before this migration; its own clock passes that while it is inside.
      await mlhTick(rollback, 60001);
      mlhRelease(rollback, 'down:001_first');
      expect(await mlhOutcome(rollback)).to.deep.equal({
        event: 'error',
        name: 'MigrationLocked',
        message: 'Migration lock was lost',
      });
      let state = await mlhState(ws);
      mlhExpectRecorded(state, [['001_first', 1]]);
      expect(mlhSteps(state, rollback.pid)).to.deep.equal([
        '002_second:down',
        '001_first:down',
      ]);

      const next = mlhStart(ws, {
        command: 'rollback',
        config,
        clock: mlhT0 + 60001,
      });
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: [1, ['001_first.js']],
      });
      state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      mlhExpectLockFree(state);
    });

    it('leaves nothing running that keeps a process alive after it took over a lock', async () => {
      await mlhOpen();
      const dead = mlhStart(ws, {
        clock: Date.now() - 2 * mlhDay,
        park: ['001_first'],
      });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);

      const next = mlhStart(ws, { clock: null });
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(next).join('\n')).to.contain(
        `Took over the migration lock held by ${dead.holder}`
      );
      expect(await mlhExit(next)).to.deep.equal({ code: 0, signal: null });

      // So do an ordinary run, a run refused while the lock is held, an unlock
      // and a rollback.
      const more = await mlhWorkspace(mlhClient);
      ws.others = [more];
      const holder = mlhStart(more, { clock: null, park: ['001_first'] });
      await mlhParked(holder, '001_first');
      const refused = mlhStart(more, { clock: null });
      expect((await mlhOutcome(refused)).name).to.equal('MigrationLocked');
      expect(await mlhExit(refused)).to.deep.equal({ code: 0, signal: null });
      mlhRelease(holder, '001_first');
      expect(await mlhOutcome(holder)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(await mlhExit(holder)).to.deep.equal({ code: 0, signal: null });
      for (const command of ['unlock', 'rollback']) {
        const child = mlhStart(more, { command, clock: null });
        expect((await mlhOutcome(child)).event, command).to.equal('done');
        expect(await mlhExit(child), command).to.deep.equal({
          code: 0,
          signal: null,
        });
      }
    });

    it('releases the lock when a migration of the run that holds it fails', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const failing = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(failing, '001_first');
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 1000 })),
        failing.holder,
        mlhT0 + 60000
      );

      mlhRelease(failing, '001_first', 'the first migration broke');
      expect(await mlhOutcome(failing)).to.deep.equal({
        event: 'error',
        name: 'Error',
        message: 'the first migration broke',
      });
      let state = await mlhState(ws);
      expect(state.done).to.deep.equal([]);
      mlhExpectLockFree(state);

      // Well before the lock would have run out.
      const next = mlhStart(ws, { config, clock: mlhT0 + 1000 });
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      expect(mlhWarnings(next).join('\n')).to.not.contain('Took over');
      state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('does not release the new holder lock when a run that lost it fails', async () => {
      await mlhOpen();
      const config = { lockTimeout: 60000 };
      const stalled = mlhStart(ws, { config, park: ['001_first'] });
      await mlhParked(stalled, '001_first');
      const next = mlhStart(ws, {
        config,
        clock: mlhT0 + 60001,
        park: ['001_first'],
      });
      await mlhParked(next, '001_first');

      mlhRelease(stalled, '001_first', 'the first migration broke');
      // It lost the lock and its migration failed; it may report either.
      expect([
        { event: 'error', name: 'Error', message: 'the first migration broke' },
        {
          event: 'error',
          name: 'MigrationLocked',
          message: `Migration lock was lost to ${next.holder}`,
        },
      ]).to.deep.include(await mlhOutcome(stalled));
      mlhExpectRefusedBy(
        await mlhOutcome(mlhStart(ws, { config, clock: mlhT0 + 60002 })),
        next.holder,
        mlhT0 + 120001
      );
      mlhRelease(next, '001_first');
      expect(await mlhOutcome(next)).to.deep.equal({
        event: 'done',
        result: mlhBoth[0],
      });
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });

    it('takes over from the command line with lockTimeout set in the knexfile', async () => {
      await mlhOpen();
      const dead = mlhStart(ws, {
        clock: Date.now() - 2 * mlhDay,
        config: { lockTimeout: 60000 },
        park: ['001_first'],
      });
      await mlhParked(dead, '001_first');
      await mlhKill(dead);

      const cli = mlhCli(ws, ['migrate:latest'], { lockTimeout: 60000 });
      expect(await mlhExit(cli), cli.output).to.deep.equal({
        code: 0,
        signal: null,
      });
      expect(cli.output).to.contain(
        `Took over the migration lock held by ${dead.holder}, which expired at `
      );
      expect(cli.output).to.contain('Batch 1 run: 2 migrations');
      const state = await mlhState(ws);
      mlhExpectRecorded(state, mlhBoth[1]);
      mlhExpectLockFree(state);
    });
  });
}

describe('migration lock holders (TypeScript)', function () {
  this.timeout(90000);

  it('accepts lockTimeout in the migrations config and in a migrate call', () => {
    const ts = require(require.resolve('typescript', { paths: [mlhAppRoot] }));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mlh-'));
    try {
      const file = path.join(dir, 'lock-timeout.ts');
      const types = path
        .join(mlhAppRoot, 'types', 'index')
        .split(path.sep)
        .join('/');
      fs.writeFileSync(
        file,
        [
          `import { knex, Knex } from '${types}';`,
          'const config: Knex.Config = {',
          "  client: 'sqlite3',",
          "  connection: { filename: ':memory:' },",
          '  useNullAsDefault: true,',
          '  migrations: { lockTimeout: 600000 },',
          '};',
          'knex(config).migrate.latest({ lockTimeout: 600000 });',
          '',
        ].join('\n')
      );
      const program = ts.createProgram([file], {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2017,
        moduleResolution: ts.ModuleResolutionKind.Node10,
      });
      const errors = ts
        .getPreEmitDiagnostics(program)
        .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
      expect(errors).to.deep.equal([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

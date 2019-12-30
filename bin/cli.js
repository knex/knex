#!/usr/bin/env node
/* eslint no-console:0, no-var:0 */
const Liftoff = require('liftoff');
const interpret = require('interpret');
const path = require('path');
const tildify = require('tildify');
const commander = require('commander');
const color = require('colorette');
const argv = require('getopts')(process.argv.slice(2));
const fs = require('fs');
const { promisify } = require('util');
const cliPkg = require('../package');
const {
  mkConfigObj,
  resolveKnexFilePath,
  resolveEnvironmentConfig,
  exit,
  success,
  checkLocalModule,
  getMigrationExtension,
  getSeedExtension,
  getStubPath,
} = require('./utils/cli-config-utils');

const { listMigrations } = require('./utils/migrationsLister');
const { requireFile } = require('../lib/util/require-interop');

const fsPromised = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
};

async function initKnex(env, opts) {
  checkLocalModule(env);
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log(
      'Working directory changed to',
      color.magenta(tildify(env.cwd))
    );
  }

  if (!opts.knexfile) {
    const configurationPath = resolveKnexFilePath();
    const configuration = configurationPath
      ? (await requireFile(configurationPath.path))
      : undefined;

    env.configuration = configuration || mkConfigObj(opts);
    if (!env.configuration.ext && configurationPath) {
      env.configuration.ext = configurationPath.extension;
    }
  }
  // If knexfile is specified
  else {
    const resolvedKnexfilePath = path.resolve(opts.knexfile);
    const knexfileDir = path.dirname(resolvedKnexfilePath);
    process.chdir(knexfileDir);
    env.configuration = await requireFile(resolvedKnexfilePath);

    if (!env.configuration) {
      exit(
        'Knexfile not found. Specify a path with --knexfile or pass --client and --connection params in commandline'
      );
    }

    if (!env.configuration.ext) {
      env.configuration.ext = path
        .extname(resolvedKnexfilePath)
        .replace('.', '');
    }
  }

  const resolvedConfig = resolveEnvironmentConfig(opts, env.configuration);
  const knex = require(env.modulePath);
  return knex(resolvedConfig);
}

function invoke(env) {
  env.modulePath = env.modulePath || env.knexpath || process.env.KNEX_PATH;

  const filetypes = ['js', 'coffee', 'ts', 'eg', 'ls'];
  let pending = null;

  const cliVersion = [
    color.blue('Knex CLI version:'),
    color.green(cliPkg.version),
  ].join(' ');

  const localVersion = [
    color.blue('Knex Local version:'),
    color.green(env.modulePackage.version || 'None'),
  ].join(' ');

  const trackPending = (fn) => (...args) => {
    pending = fn(...args);
  }

  commander
    .version(`${cliVersion}\n${localVersion}`)
    .option('--debug', 'Run with debugging.')
    .option('--knexfile [path]', 'Specify the knexfile path.')
    .option('--knexpath [path]', 'Specify the path to knex instance.')
    .option('--cwd [path]', 'Specify the working directory.')
    .option('--client [name]', 'Set DB client without a knexfile.')
    .option('--connection [address]', 'Set DB connection without a knexfile.')
    .option(
      '--migrations-directory [path]',
      'Set migrations directory without a knexfile.'
    )
    .option(
      '--migrations-table-name [path]',
      'Set migrations table name without a knexfile.'
    )
    .option(
      '--env [name]',
      'environment, default: process.env.NODE_ENV || development'
    );

  commander
    .command('init')
    .description('        Create a fresh knexfile.')
    .option(
      `-x [${filetypes.join('|')}]`,
      'Specify the knexfile extension (default js)'
    )
    .action(trackPending(async () => {
      const type = (argv.x || 'js').toLowerCase();
      if (filetypes.indexOf(type) === -1) {
        exit(`Invalid filetype specified: ${type}`);
      }
      if (env.configuration) {
        exit(`Error: ${env.knexfile} already exists`);
      }
      checkLocalModule(env);
      const stubPath = `./knexfile.${type}`;
      const code = await fsPromised.readFile(
          path.dirname(env.modulePath) +
            '/lib/migrate/stub/knexfile-' +
            type +
            '.stub'
      );
      await fsPromised.writeFile(stubPath, code);
      success(color.green(`Created ${stubPath}`));
    }));

  commander
    .command('migrate:make <name>')
    .description('        Create a named migration file.')
    .option(
      `-x [${filetypes.join('|')}]`,
      'Specify the stub extension (default js)'
    )
    .option(
      `--stub [<relative/path/from/knexfile>|<name>]`,
      'Specify the migration stub to use. If using <name> the file must be located in config.migrations.directory'
    )
    .action(trackPending(async (name) => {
      const opts = commander.opts();
      opts.client = opts.client || 'sqlite3'; // We don't really care about client when creating migrations
      const instance = await initKnex(env, opts);
      const ext = getMigrationExtension(env, opts);
      const configOverrides = { extension: ext };

      const stub = getStubPath('migrations', env, opts);
      if (stub) {
        configOverrides.stub = stub;
      }

      name = await instance.migrate.make(name, configOverrides)
      success(color.green(`Created Migration: ${name}`));
    }));

  commander
    .command('migrate:latest')
    .description('        Run all migrations that have not yet been run.')
    .option('--verbose', 'verbose')
    .action(trackPending(async () => {
      const instance = await initKnex(env, commander.opts());
      const [batchNo, log] = await instance.migrate.latest()
      if (log.length === 0) {
        success(color.cyan('Already up to date'));
      }
      success(
        color.green(`Batch ${batchNo} run: ${log.length} migrations`) +
          (argv.verbose ? `\n${color.cyan(log.join('\n'))}` : '')
      );
    }));

  commander
    .command('migrate:up [<name>]')
    .description(
      '        Run the next or the specified migration that has not yet been run.'
    )
    .action(trackPending(async (name) => {
      const instance = await initKnex(env, commander.opts());
      const [batchNo, log] = await instance.migrate.up({ name })
      if (log.length === 0) {
        success(color.cyan('Already up to date'));
      }
      success(
        color.green(
          `Batch ${batchNo} ran the following migrations:\n${log.join(
            '\n'
          )}`
        )
      );
    }));

  commander
    .command('migrate:rollback')
    .description('        Rollback the last batch of migrations performed.')
    .option('--all', 'rollback all completed migrations')
    .option('--verbose', 'verbose')
    .action(trackPending(async (cmd) => {
      const { all } = cmd;
      const instance = await initKnex(env, commander.opts());
      const [batchNo, log] = await instance.migrate.rollback(null, all);
      if (log.length === 0) {
        success(color.cyan('Already at the base migration'));
      }
      success(
        color.green(
          `Batch ${batchNo} rolled back: ${log.length} migrations`
        ) + (argv.verbose ? `\n${color.cyan(log.join('\n'))}` : '')
      );
    }));

  commander
    .command('migrate:down [<name>]')
    .description(
      '        Undo the last or the specified migration that was already run.'
    )
    .action(trackPending(async (name) => {
      const instance = await initKnex(env, commander.opts());
      const [batchNo, log] = await instance.migrate.down({ name })

      if (log.length === 0) {
        success(color.cyan('Already at the base migration'));
      }

      success(
        color.green(
          `Batch ${batchNo} rolled back the following migrations:\n${log.join(
            '\n'
          )}`
        )
      );
    }));

  commander
    .command('migrate:currentVersion')
    .description('        View the current version for the migration.')
    .action(trackPending(async () => {
      const instance = await initKnex(env, commander.opts());
      const version = await instance.migrate.currentVersion()
      success(color.green('Current Version: ') + color.blue(version));
    }));

  commander
    .command('migrate:list')
    .alias('migrate:status')
    .description('        List all migrations files with status.')
    .action(trackPending(async () => {
      const instance = await initKnex(env, commander.opts());
      const [completed, newMigrations] = await instance.migrate.list()
      listMigrations(completed, newMigrations);
    }));

  commander
    .command('seed:make <name>')
    .description('        Create a named seed file.')
    .option(
      `-x [${filetypes.join('|')}]`,
      'Specify the stub extension (default js)'
    )
    .option(
      `--stub [<relative/path/from/knexfile>|<name>]`,
      'Specify the seed stub to use. If using <name> the file must be located in config.seeds.directory'
    )
    .action(trackPending(async (name) => {
      const opts = commander.opts();
      opts.client = opts.client || 'sqlite3'; // We don't really care about client when creating seeds
      const instance = await initKnex(env, opts);
      const ext = getSeedExtension(env, opts);
      const configOverrides = { extension: ext };
      const stub = getStubPath('seeds', env, opts);
      if (stub) {
        configOverrides.stub = stub;
      }
      name = await instance.seed.make(name, configOverrides);
      success(color.green(`Created seed file: ${name}`));
    }));

  commander
    .command('seed:run')
    .description('        Run seed files.')
    .option('--verbose', 'verbose')
    .option('--specific', 'run specific seed file')
    .action(trackPending(async () => {
      const instance = await initKnex(env, commander.opts());
      const [log] = await instance.seed.run({ specific: argv.specific })
      if (log.length === 0) {
        success(color.cyan('No seed files exist'));
      }
      success(
        color.green(`Ran ${log.length} seed files`) +
          (argv.verbose ? `\n${color.cyan(log.join('\n'))}` : '')
      );
    }));

  commander.parse(process.argv);

  Promise.resolve(pending).then(() => {
    commander.outputHelp();
    exit('Unknown command-line options, exiting');
  }).catch(exit);
}

const cli = new Liftoff({
  name: 'knex',
  extensions: interpret.jsVariants,
  v8flags: require('v8flags'),
  moduleName: require('../package.json').name,
});

cli.on('require', function(name) {
  console.log('Requiring external module', color.magenta(name));
});

cli.on('requireFail', function(name) {
  console.log(color.red('Failed to load external module'), color.magenta(name));
});

cli.launch(
  {
    cwd: argv.cwd,
    knexfile: argv.knexfile,
    knexpath: argv.knexpath,
    require: argv.require,
    completion: argv.completion,
  },
  invoke
);

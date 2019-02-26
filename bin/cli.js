#!/usr/bin/env node
/* eslint no-console:0, no-var:0 */
const Liftoff = require('liftoff');
const Promise = require('bluebird');
const interpret = require('interpret');
const path = require('path');
const tildify = require('tildify');
const commander = require('commander');
const color = require('colorette');
const argv = require('getopts')(process.argv.slice(2));
const fs = Promise.promisifyAll(require('fs'));
const cliPkg = require('../package');
const {
  mkConfigObj,
  tryLoadingDefaultConfiguration,
} = require('./utils/cli-config-utils');
const { DEFAULT_EXT } = require('./utils/constants');

function exit(text) {
  if (text instanceof Error) {
    console.error(color.red(text.stack));
  } else {
    console.error(color.red(text));
  }
  process.exit(1);
}

function success(text) {
  console.log(text);
  process.exit(0);
}

function checkLocalModule(env) {
  if (!env.modulePath) {
    console.log(
      color.red('No local knex install found in:'),
      color.magenta(tildify(env.cwd))
    );
    exit('Try running: npm install knex');
  }
}

function initKnex(env, opts) {
  checkLocalModule(env);
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log(
      'Working directory changed to',
      color.magenta(tildify(env.cwd))
    );
  }

  if (!opts.knexfile) {
    const configuration = tryLoadingDefaultConfiguration();
    env.configuration = configuration || mkConfigObj(opts);
  }
  // If knexfile is specified
  else {
    const resolvedKnexfilePath = path.resolve(opts.knexfile);
    const knexfileDir = path.dirname(resolvedKnexfilePath);
    process.chdir(knexfileDir);
    env.configuration = require(resolvedKnexfilePath);

    if (!env.configuration) {
      exit(
        'Knexfile not found. Specify a path with --knexfile or pass --client and --connection params in commandline'
      );
    }
  }

  let environment = opts.env || process.env.NODE_ENV;
  const defaultEnv = 'development';

  let config = env.configuration;

  if (!environment && typeof config[defaultEnv] === 'object') {
    environment = defaultEnv;
  }

  if (environment) {
    console.log('Using environment:', color.magenta(environment));
    config = config[environment] || config;
  }

  if (!config) {
    console.log(color.red('Warning: unable to read knexfile config'));
    process.exit(1);
  }

  if (argv.debug !== undefined) {
    config.debug = argv.debug;
  }

  const knex = require(env.modulePath);
  return knex(config);
}

function invoke(env) {
  env.modulePath = env.modulePath || env.knexpath || process.env.KNEX_PATH;

  const filetypes = ['js', 'coffee', 'ts', 'eg', 'ls'];
  let pending = null;

  commander
    .version(
      color.blue('Knex CLI version: ', color.green(cliPkg.version)) +
        '\n' +
        color.blue(
          'Local Knex version: ',
          color.green(env.modulePackage.version)
        ) +
        '\n'
    )
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
    .action(() => {
      const type = (argv.x || 'js').toLowerCase();
      if (filetypes.indexOf(type) === -1) {
        exit(`Invalid filetype specified: ${type}`);
      }
      if (env.configuration) {
        exit(`Error: ${env.knexfile} already exists`);
      }
      checkLocalModule(env);
      const stubPath = `./knexfile.${type}`;
      pending = fs
        .readFileAsync(
          path.dirname(env.modulePath) +
            '/lib/migrate/stub/knexfile-' +
            type +
            '.stub'
        )
        .then((code) => {
          return fs.writeFileAsync(stubPath, code);
        })
        .then(() => {
          success(color.green(`Created ${stubPath}`));
        })
        .catch(exit);
    });

  commander
    .command('migrate:make <name>')
    .description('        Create a named migration file.')
    .option(
      `-x [${filetypes.join('|')}]`,
      'Specify the stub extension (default js)'
    )
    .action((name) => {
      const opts = commander.opts();
      opts.client = opts.client || 'sqlite3'; // We don't really care about client when creating migrations
      const instance = initKnex(env, opts);
      const ext = (
        argv.x ||
        env.configuration.ext ||
        DEFAULT_EXT
      ).toLowerCase();
      pending = instance.migrate
        .make(name, { extension: ext })
        .then((name) => {
          success(color.green(`Created Migration: ${name}`));
        })
        .catch(exit);
    });

  commander
    .command('migrate:latest')
    .description('        Run all migrations that have not yet been run.')
    .option('--verbose', 'verbose')
    .action(() => {
      pending = initKnex(env, commander.opts())
        .migrate.latest()
        .spread((batchNo, log) => {
          if (log.length === 0) {
            success(color.cyan('Already up to date'));
          }
          success(
            color.green(`Batch ${batchNo} run: ${log.length} migrations`) +
              (argv.verbose ? `\n${color.cyan(log.join('\n'))}` : '')
          );
        })
        .catch(exit);
    });

  commander
    .command('migrate:rollback')
    .description('        Rollback the last set of migrations performed.')
    .option('--verbose', 'verbose')
    .action(() => {
      pending = initKnex(env, commander.opts())
        .migrate.rollback()
        .spread((batchNo, log) => {
          if (log.length === 0) {
            success(color.cyan('Already at the base migration'));
          }
          success(
            color.green(
              `Batch ${batchNo} rolled back: ${log.length} migrations`
            ) + (argv.verbose ? `\n${color.cyan(log.join('\n'))}` : '')
          );
        })
        .catch(exit);
    });

  commander
    .command('migrate:currentVersion')
    .description('        View the current version for the migration.')
    .action(() => {
      pending = initKnex(env, commander.opts())
        .migrate.currentVersion()
        .then((version) => {
          success(color.green('Current Version: ') + color.blue(version));
        })
        .catch(exit);
    });

  commander
    .command('seed:make <name>')
    .description('        Create a named seed file.')
    .option(
      `-x [${filetypes.join('|')}]`,
      'Specify the stub extension (default js)'
    )
    .action((name) => {
      const opts = commander.opts();
      opts.client = opts.client || 'sqlite3'; // We don't really care about client when creating seeds
      const instance = initKnex(env, opts);
      const ext = (
        argv.x ||
        env.configuration.ext ||
        DEFAULT_EXT
      ).toLowerCase();
      pending = instance.seed
        .make(name, { extension: ext })
        .then((name) => {
          success(color.green(`Created seed file: ${name}`));
        })
        .catch(exit);
    });

  commander
    .command('seed:run')
    .description('        Run seed files.')
    .option('--verbose', 'verbose')
    .action(() => {
      pending = initKnex(env, commander.opts())
        .seed.run()
        .spread((log) => {
          if (log.length === 0) {
            success(color.cyan('No seed files exist'));
          }
          success(
            color.green(`Ran ${log.length} seed files`) +
              (argv.verbose ? `\n${color.cyan(log.join('\n'))}` : '')
          );
        })
        .catch(exit);
    });

  commander.parse(process.argv);

  Promise.resolve(pending).then(() => {
    commander.outputHelp();
    exit('Unknown command-line options, exiting');
  });
}

const cli = new Liftoff({
  name: 'knex',
  extensions: interpret.jsVariants,
  v8flags: require('v8flags'),
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

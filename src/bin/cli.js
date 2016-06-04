#!/usr/bin/env node
/* eslint no-console:0 */

import Liftoff from 'liftoff';
import Promise from 'bluebird';
import interpret from 'interpret';
import path from 'path';
import chalk from 'chalk';
import tildify from 'tildify';
import commander from 'commander';
const argv = require('minimist')(process.argv.slice(2));
const fs = Promise.promisifyAll(require('fs'));
const cliPkg = require('../../package');

function exit(text) {
  if (text instanceof Error) {
    chalk.red(console.error(text.stack));
  } else {
    chalk.red(console.error(text));
  }
  process.exit(1);
}

function success(text) {
  console.log(text);
  process.exit(0);
}

function checkLocalModule(env) {
  if (!env.modulePath) {
    console.log(chalk.red('No local knex install found in:'), chalk.magenta(tildify(env.cwd)));
    exit('Try running: npm install knex.');
  }
}

function initKnex(env) {

  checkLocalModule(env);

  if (!env.configPath) {
    exit('No knexfile found in this directory. Specify a path with --knexfile');
  }

  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log('Working directory changed to', chalk.magenta(tildify(env.cwd)));
  }

  let environment = commander.env || process.env.NODE_ENV;
  const defaultEnv = 'development';
  let config = require(env.configPath);

  if (!environment && typeof config[defaultEnv] === 'object') {
    environment = defaultEnv;
  }

  if (environment) {
    console.log('Using environment:', chalk.magenta(environment));
    config = config[environment] || config;
  }

  if (!config) {
    console.log(chalk.red('Warning: unable to read knexfile config'));
    process.exit(1);
  }

  if (argv.debug !== undefined)
    config.debug = argv.debug;
  const knex = require(env.modulePath);
  return knex(config);
}

function invoke(env) {

  const filetypes = ['js', 'coffee', 'eg', 'ls'];
  let pending = null;

  commander
    .version(
      chalk.blue('Knex CLI version: ', chalk.green(cliPkg.version)) + '\n' +
      chalk.blue('Local Knex version: ', chalk.green(env.modulePackage.version)) + '\n'
    )
    .option('--debug', 'Run with debugging.')
    .option('--knexfile [path]', 'Specify the knexfile path.')
    .option('--cwd [path]', 'Specify the working directory.')
    .option('--env [name]', 'environment, default: process.env.NODE_ENV || development');


  commander
    .command('init')
    .description('        Create a fresh knexfile.')
    .option(`-x [${filetypes.join('|')}]`, 'Specify the knexfile extension (default js)')
    .action(function() {
      const type = (argv.x || 'js').toLowerCase();
      if (filetypes.indexOf(type) === -1) {
        exit(`Invalid filetype specified: ${type}`);
      }
      if (env.configPath) {
        exit(`Error: ${env.configPath} already exists`);
      }
      checkLocalModule(env);
      const stubPath = `./knexfile.${type}`;
      pending = fs.readFileAsync(
        path.dirname(env.modulePath) +
        '/lib/migrate/stub/knexfile-' +
        type + '.stub'
      ).then(code => fs.writeFileAsync(stubPath, code)).then(() => {
        success(chalk.green(`Created ${stubPath}`));
      }).catch(exit);
    });

  commander
    .command('migrate:make <name>')
    .description('       Create a named migration file.')
    .option(`-x [${filetypes.join('|')}]`, 'Specify the stub extension (default js)')
    .action(function(name) {
      const instance = initKnex(env);
      const ext = (argv.x || env.configPath.split('.').pop()).toLowerCase();
      pending = instance.migrate.make(name, {extension: ext}).then(function(name) {
        success(chalk.green(`Created Migration: ${name}`));
      }).catch(exit);
    });

  commander
    .command('migrate:latest')
    .description('        Run all migrations that have not yet been run.')
    .action(function() {
      pending = initKnex(env).migrate.latest().spread(function(batchNo, log) {
        if (log.length === 0) {
          success(chalk.cyan('Already up to date'));
        }
        success(
          chalk.green(`Batch ${batchNo} run: ${log.length} migrations \n`) +
          chalk.cyan(log.join('\n'))
        );
      }).catch(exit);
    });

  commander
    .command('migrate:rollback')
    .description('        Rollback the last set of migrations performed.')
    .action(function() {
      pending = initKnex(env).migrate.rollback().spread(function(batchNo, log) {
        if (log.length === 0) {
          success(chalk.cyan('Already at the base migration'));
        }
        success(
          chalk.green(`Batch ${batchNo} rolled back: ${log.length} migrations \n`) +
          chalk.cyan(log.join('\n'))
        );
      }).catch(exit);
    });

  commander
    .command('migrate:currentVersion')
    .description('       View the current version for the migration.')
    .action(function () {
      pending = initKnex(env).migrate.currentVersion().then(function(version) {
        success(chalk.green('Current Version: ') + chalk.blue(version));
      }).catch(exit);
    });

  commander
    .command('seed:make <name>')
    .description('       Create a named seed file.')
    .option(`-x [${filetypes.join('|')}]`, 'Specify the stub extension (default js)')
    .action(function(name) {
      const instance = initKnex(env);
      const ext = (argv.x || env.configPath.split('.').pop()).toLowerCase();
      pending = instance.seed.make(name, {extension: ext}).then(function(name) {
        success(chalk.green(`Created seed file: ${name}`));
      }).catch(exit);
    });

  commander
    .command('seed:run')
    .description('       Run seed files.')
    .action(function() {
      pending = initKnex(env).seed.run().spread(function(log) {
        if (log.length === 0) {
          success(chalk.cyan('No seed files exist'));
        }
        success(chalk.green(`Ran ${log.length} seed files \n${chalk.cyan(log.join('\n'))}`));
      }).catch(exit);
    });

  commander.parse(process.argv);

  Promise.resolve(pending).then(function() {
    commander.help();
  });
}

const cli = new Liftoff({
  name: 'knex',
  extensions: interpret.jsVariants,
  v8flags: require('v8flags')
});

cli.on('require', function(name) {
  console.log('Requiring external module', chalk.magenta(name));
});

cli.on('requireFail', function(name) {
  console.log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.launch({
  cwd: argv.cwd,
  configPath: argv.knexfile,
  require: argv.require,
  completion: argv.completion
}, invoke);

#!/usr/bin/env node

/* eslint no-console:0 */

'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _liftoff = require('liftoff');

var _liftoff2 = _interopRequireDefault(_liftoff);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _interpret = require('interpret');

var _interpret2 = _interopRequireDefault(_interpret);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _tildify = require('tildify');

var _tildify2 = _interopRequireDefault(_tildify);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var argv = require('minimist')(process.argv.slice(2));
var fs = _bluebird2['default'].promisifyAll(require('fs'));
var cliPkg = require('../../package');

function exit(text) {
  if (text instanceof Error) {
    _chalk2['default'].red(console.error(text.stack));
  } else {
    _chalk2['default'].red(console.error(text));
  }
  process.exit(1);
}

function success(text) {
  console.log(text);
  process.exit(0);
}

function checkLocalModule(env) {
  if (!env.modulePath) {
    console.log(_chalk2['default'].red('No local knex install found in:'), _chalk2['default'].magenta(_tildify2['default'](env.cwd)));
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
    console.log('Working directory changed to', _chalk2['default'].magenta(_tildify2['default'](env.cwd)));
  }

  var environment = _commander2['default'].env || process.env.NODE_ENV;
  var defaultEnv = 'development';
  var config = require(env.configPath);

  if (!environment && typeof config[defaultEnv] === 'object') {
    environment = defaultEnv;
  }

  if (environment) {
    console.log('Using environment:', _chalk2['default'].magenta(environment));
    config = config[environment] || config;
  }

  if (!config) {
    console.log(_chalk2['default'].red('Warning: unable to read knexfile config'));
    process.exit(1);
  }

  if (argv.debug !== undefined) config.debug = argv.debug;
  var knex = require(env.modulePath);
  return knex(config);
}

function invoke(env) {

  var filetypes = ['js', 'coffee', 'eg', 'ls'];
  var pending = null;

  _commander2['default'].version(_chalk2['default'].blue('Knex CLI version: ', _chalk2['default'].green(cliPkg.version)) + '\n' + _chalk2['default'].blue('Local Knex version: ', _chalk2['default'].green(env.modulePackage.version)) + '\n').option('--debug', 'Run with debugging.').option('--knexfile [path]', 'Specify the knexfile path.').option('--cwd [path]', 'Specify the working directory.').option('--env [name]', 'environment, default: process.env.NODE_ENV || development');

  _commander2['default'].command('init').description('        Create a fresh knexfile.').option('-x [' + filetypes.join('|') + ']', 'Specify the knexfile extension (default js)').action(function () {
    var type = (argv.x || 'js').toLowerCase();
    if (filetypes.indexOf(type) === -1) {
      exit('Invalid filetype specified: ' + type);
    }
    if (env.configPath) {
      exit('Error: ' + env.configPath + ' already exists');
    }
    checkLocalModule(env);
    var stubPath = './knexfile.' + type;
    pending = fs.readFileAsync(_path2['default'].dirname(env.modulePath) + '/lib/migrate/stub/knexfile-' + type + '.stub').then(function (code) {
      return fs.writeFileAsync(stubPath, code);
    }).then(function () {
      success(_chalk2['default'].green('Created ' + stubPath));
    })['catch'](exit);
  });

  _commander2['default'].command('migrate:make <name>').description('       Create a named migration file.').option('-x [' + filetypes.join('|') + ']', 'Specify the stub extension (default js)').action(function (name) {
    var instance = initKnex(env);
    var ext = (argv.x || env.configPath.split('.').pop()).toLowerCase();
    pending = instance.migrate.make(name, { extension: ext }).then(function (name) {
      success(_chalk2['default'].green('Created Migration: ' + name));
    })['catch'](exit);
  });

  _commander2['default'].command('migrate:latest').description('        Run all migrations that have not yet been run.').action(function () {
    pending = initKnex(env).migrate.latest().spread(function (batchNo, log) {
      if (log.length === 0) {
        success(_chalk2['default'].cyan('Already up to date'));
      }
      success(_chalk2['default'].green('Batch ' + batchNo + ' run: ' + log.length + ' migrations \n') + _chalk2['default'].cyan(log.join('\n')));
    })['catch'](exit);
  });

  _commander2['default'].command('migrate:rollback').description('        Rollback the last set of migrations performed.').action(function () {
    pending = initKnex(env).migrate.rollback().spread(function (batchNo, log) {
      if (log.length === 0) {
        success(_chalk2['default'].cyan('Already at the base migration'));
      }
      success(_chalk2['default'].green('Batch ' + batchNo + ' rolled back: ' + log.length + ' migrations \n') + _chalk2['default'].cyan(log.join('\n')));
    })['catch'](exit);
  });

  _commander2['default'].command('migrate:currentVersion').description('       View the current version for the migration.').action(function () {
    pending = initKnex(env).migrate.currentVersion().then(function (version) {
      success(_chalk2['default'].green('Current Version: ') + _chalk2['default'].blue(version));
    })['catch'](exit);
  });

  _commander2['default'].command('seed:make <name>').description('       Create a named seed file.').option('-x [' + filetypes.join('|') + ']', 'Specify the stub extension (default js)').action(function (name) {
    var instance = initKnex(env);
    var ext = (argv.x || env.configPath.split('.').pop()).toLowerCase();
    pending = instance.seed.make(name, { extension: ext }).then(function (name) {
      success(_chalk2['default'].green('Created seed file: ' + name));
    })['catch'](exit);
  });

  _commander2['default'].command('seed:run').description('       Run seed files.').action(function () {
    pending = initKnex(env).seed.run().spread(function (log) {
      if (log.length === 0) {
        success(_chalk2['default'].cyan('No seed files exist'));
      }
      success(_chalk2['default'].green('Ran ' + log.length + ' seed files \n' + _chalk2['default'].cyan(log.join('\n'))));
    })['catch'](exit);
  });

  _commander2['default'].parse(process.argv);

  _bluebird2['default'].resolve(pending).then(function () {
    _commander2['default'].help();
  });
}

// const cli = new Liftoff({
//   name: 'knex',
//   extensions: interpret.jsVariants,
//   v8flags: require('v8flags')
// });

// cli.on('require', function(name) {
//   console.log('Requiring external module', chalk.magenta(name));
// });

// cli.on('requireFail', function(name) {
//   console.log(chalk.red('Failed to load external module'), chalk.magenta(name));
// });

// cli.launch({
//   cwd: argv.cwd,
//   configPath: argv.knexfile,
//   require: argv.require,
//   completion: argv.completion
// }, invoke);
//# sourceMappingURL=data:application/json;base64,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c291cmNlc0NvbnRlbnQiOlsiXG4vKiBlc2xpbnQgbm8tY29uc29sZTowICovXG5cbmltcG9ydCBMaWZ0b2ZmIGZyb20gJ2xpZnRvZmYnO1xuaW1wb3J0IFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IGludGVycHJldCBmcm9tICdpbnRlcnByZXQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IHRpbGRpZnkgZnJvbSAndGlsZGlmeSc7XG5pbXBvcnQgY29tbWFuZGVyIGZyb20gJ2NvbW1hbmRlcic7XG5jb25zdCBhcmd2ID0gcmVxdWlyZSgnbWluaW1pc3QnKShwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuY29uc3QgZnMgPSBQcm9taXNlLnByb21pc2lmeUFsbChyZXF1aXJlKCdmcycpKTtcbmNvbnN0IGNsaVBrZyA9IHJlcXVpcmUoJy4uLy4uL3BhY2thZ2UnKTtcblxuZnVuY3Rpb24gZXhpdCh0ZXh0KSB7XG4gIGlmICh0ZXh0IGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICBjaGFsay5yZWQoY29uc29sZS5lcnJvcih0ZXh0LnN0YWNrKSk7XG4gIH0gZWxzZSB7XG4gICAgY2hhbGsucmVkKGNvbnNvbGUuZXJyb3IodGV4dCkpO1xuICB9XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuZnVuY3Rpb24gc3VjY2Vzcyh0ZXh0KSB7XG4gIGNvbnNvbGUubG9nKHRleHQpO1xuICBwcm9jZXNzLmV4aXQoMCk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrTG9jYWxNb2R1bGUoZW52KSB7XG4gIGlmICghZW52Lm1vZHVsZVBhdGgpIHtcbiAgICBjb25zb2xlLmxvZyhjaGFsay5yZWQoJ05vIGxvY2FsIGtuZXggaW5zdGFsbCBmb3VuZCBpbjonKSwgY2hhbGsubWFnZW50YSh0aWxkaWZ5KGVudi5jd2QpKSk7XG4gICAgZXhpdCgnVHJ5IHJ1bm5pbmc6IG5wbSBpbnN0YWxsIGtuZXguJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdEtuZXgoZW52KSB7XG5cbiAgY2hlY2tMb2NhbE1vZHVsZShlbnYpO1xuXG4gIGlmICghZW52LmNvbmZpZ1BhdGgpIHtcbiAgICBleGl0KCdObyBrbmV4ZmlsZSBmb3VuZCBpbiB0aGlzIGRpcmVjdG9yeS4gU3BlY2lmeSBhIHBhdGggd2l0aCAtLWtuZXhmaWxlJyk7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5jd2QoKSAhPT0gZW52LmN3ZCkge1xuICAgIHByb2Nlc3MuY2hkaXIoZW52LmN3ZCk7XG4gICAgY29uc29sZS5sb2coJ1dvcmtpbmcgZGlyZWN0b3J5IGNoYW5nZWQgdG8nLCBjaGFsay5tYWdlbnRhKHRpbGRpZnkoZW52LmN3ZCkpKTtcbiAgfVxuXG4gIGxldCBlbnZpcm9ubWVudCA9IGNvbW1hbmRlci5lbnYgfHwgcHJvY2Vzcy5lbnYuTk9ERV9FTlY7XG4gIGNvbnN0IGRlZmF1bHRFbnYgPSAnZGV2ZWxvcG1lbnQnO1xuICBsZXQgY29uZmlnID0gcmVxdWlyZShlbnYuY29uZmlnUGF0aCk7XG5cbiAgaWYgKCFlbnZpcm9ubWVudCAmJiB0eXBlb2YgY29uZmlnW2RlZmF1bHRFbnZdID09PSAnb2JqZWN0Jykge1xuICAgIGVudmlyb25tZW50ID0gZGVmYXVsdEVudjtcbiAgfVxuXG4gIGlmIChlbnZpcm9ubWVudCkge1xuICAgIGNvbnNvbGUubG9nKCdVc2luZyBlbnZpcm9ubWVudDonLCBjaGFsay5tYWdlbnRhKGVudmlyb25tZW50KSk7XG4gICAgY29uZmlnID0gY29uZmlnW2Vudmlyb25tZW50XSB8fCBjb25maWc7XG4gIH1cblxuICBpZiAoIWNvbmZpZykge1xuICAgIGNvbnNvbGUubG9nKGNoYWxrLnJlZCgnV2FybmluZzogdW5hYmxlIHRvIHJlYWQga25leGZpbGUgY29uZmlnJykpO1xuICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgfVxuXG4gIGlmIChhcmd2LmRlYnVnICE9PSB1bmRlZmluZWQpXG4gICAgY29uZmlnLmRlYnVnID0gYXJndi5kZWJ1ZztcbiAgY29uc3Qga25leCA9IHJlcXVpcmUoZW52Lm1vZHVsZVBhdGgpO1xuICByZXR1cm4ga25leChjb25maWcpO1xufVxuXG5mdW5jdGlvbiBpbnZva2UoZW52KSB7XG5cbiAgY29uc3QgZmlsZXR5cGVzID0gWydqcycsICdjb2ZmZWUnLCAnZWcnLCAnbHMnXTtcbiAgbGV0IHBlbmRpbmcgPSBudWxsO1xuXG4gIGNvbW1hbmRlclxuICAgIC52ZXJzaW9uKFxuICAgICAgY2hhbGsuYmx1ZSgnS25leCBDTEkgdmVyc2lvbjogJywgY2hhbGsuZ3JlZW4oY2xpUGtnLnZlcnNpb24pKSArICdcXG4nICtcbiAgICAgIGNoYWxrLmJsdWUoJ0xvY2FsIEtuZXggdmVyc2lvbjogJywgY2hhbGsuZ3JlZW4oZW52Lm1vZHVsZVBhY2thZ2UudmVyc2lvbikpICsgJ1xcbidcbiAgICApXG4gICAgLm9wdGlvbignLS1kZWJ1ZycsICdSdW4gd2l0aCBkZWJ1Z2dpbmcuJylcbiAgICAub3B0aW9uKCctLWtuZXhmaWxlIFtwYXRoXScsICdTcGVjaWZ5IHRoZSBrbmV4ZmlsZSBwYXRoLicpXG4gICAgLm9wdGlvbignLS1jd2QgW3BhdGhdJywgJ1NwZWNpZnkgdGhlIHdvcmtpbmcgZGlyZWN0b3J5LicpXG4gICAgLm9wdGlvbignLS1lbnYgW25hbWVdJywgJ2Vudmlyb25tZW50LCBkZWZhdWx0OiBwcm9jZXNzLmVudi5OT0RFX0VOViB8fCBkZXZlbG9wbWVudCcpO1xuXG5cbiAgY29tbWFuZGVyXG4gICAgLmNvbW1hbmQoJ2luaXQnKVxuICAgIC5kZXNjcmlwdGlvbignICAgICAgICBDcmVhdGUgYSBmcmVzaCBrbmV4ZmlsZS4nKVxuICAgIC5vcHRpb24oYC14IFske2ZpbGV0eXBlcy5qb2luKCd8Jyl9XWAsICdTcGVjaWZ5IHRoZSBrbmV4ZmlsZSBleHRlbnNpb24gKGRlZmF1bHQganMpJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgdHlwZSA9IChhcmd2LnggfHwgJ2pzJykudG9Mb3dlckNhc2UoKTtcbiAgICAgIGlmIChmaWxldHlwZXMuaW5kZXhPZih0eXBlKSA9PT0gLTEpIHtcbiAgICAgICAgZXhpdChgSW52YWxpZCBmaWxldHlwZSBzcGVjaWZpZWQ6ICR7dHlwZX1gKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbnYuY29uZmlnUGF0aCkge1xuICAgICAgICBleGl0KGBFcnJvcjogJHtlbnYuY29uZmlnUGF0aH0gYWxyZWFkeSBleGlzdHNgKTtcbiAgICAgIH1cbiAgICAgIGNoZWNrTG9jYWxNb2R1bGUoZW52KTtcbiAgICAgIGNvbnN0IHN0dWJQYXRoID0gYC4va25leGZpbGUuJHt0eXBlfWA7XG4gICAgICBwZW5kaW5nID0gZnMucmVhZEZpbGVBc3luYyhcbiAgICAgICAgcGF0aC5kaXJuYW1lKGVudi5tb2R1bGVQYXRoKSArXG4gICAgICAgICcvbGliL21pZ3JhdGUvc3R1Yi9rbmV4ZmlsZS0nICtcbiAgICAgICAgdHlwZSArICcuc3R1YidcbiAgICAgICkudGhlbihjb2RlID0+IGZzLndyaXRlRmlsZUFzeW5jKHN0dWJQYXRoLCBjb2RlKSkudGhlbigoKSA9PiB7XG4gICAgICAgIHN1Y2Nlc3MoY2hhbGsuZ3JlZW4oYENyZWF0ZWQgJHtzdHViUGF0aH1gKSk7XG4gICAgICB9KS5jYXRjaChleGl0KTtcbiAgICB9KTtcblxuICBjb21tYW5kZXJcbiAgICAuY29tbWFuZCgnbWlncmF0ZTptYWtlIDxuYW1lPicpXG4gICAgLmRlc2NyaXB0aW9uKCcgICAgICAgQ3JlYXRlIGEgbmFtZWQgbWlncmF0aW9uIGZpbGUuJylcbiAgICAub3B0aW9uKGAteCBbJHtmaWxldHlwZXMuam9pbignfCcpfV1gLCAnU3BlY2lmeSB0aGUgc3R1YiBleHRlbnNpb24gKGRlZmF1bHQganMpJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gaW5pdEtuZXgoZW52KTtcbiAgICAgIGNvbnN0IGV4dCA9IChhcmd2LnggfHwgZW52LmNvbmZpZ1BhdGguc3BsaXQoJy4nKS5wb3AoKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgIHBlbmRpbmcgPSBpbnN0YW5jZS5taWdyYXRlLm1ha2UobmFtZSwge2V4dGVuc2lvbjogZXh0fSkudGhlbihmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHN1Y2Nlc3MoY2hhbGsuZ3JlZW4oYENyZWF0ZWQgTWlncmF0aW9uOiAke25hbWV9YCkpO1xuICAgICAgfSkuY2F0Y2goZXhpdCk7XG4gICAgfSk7XG5cbiAgY29tbWFuZGVyXG4gICAgLmNvbW1hbmQoJ21pZ3JhdGU6bGF0ZXN0JylcbiAgICAuZGVzY3JpcHRpb24oJyAgICAgICAgUnVuIGFsbCBtaWdyYXRpb25zIHRoYXQgaGF2ZSBub3QgeWV0IGJlZW4gcnVuLicpXG4gICAgLmFjdGlvbihmdW5jdGlvbigpIHtcbiAgICAgIHBlbmRpbmcgPSBpbml0S25leChlbnYpLm1pZ3JhdGUubGF0ZXN0KCkuc3ByZWFkKGZ1bmN0aW9uKGJhdGNoTm8sIGxvZykge1xuICAgICAgICBpZiAobG9nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHN1Y2Nlc3MoY2hhbGsuY3lhbignQWxyZWFkeSB1cCB0byBkYXRlJykpO1xuICAgICAgICB9XG4gICAgICAgIHN1Y2Nlc3MoXG4gICAgICAgICAgY2hhbGsuZ3JlZW4oYEJhdGNoICR7YmF0Y2hOb30gcnVuOiAke2xvZy5sZW5ndGh9IG1pZ3JhdGlvbnMgXFxuYCkgK1xuICAgICAgICAgIGNoYWxrLmN5YW4obG9nLmpvaW4oJ1xcbicpKVxuICAgICAgICApO1xuICAgICAgfSkuY2F0Y2goZXhpdCk7XG4gICAgfSk7XG5cbiAgY29tbWFuZGVyXG4gICAgLmNvbW1hbmQoJ21pZ3JhdGU6cm9sbGJhY2snKVxuICAgIC5kZXNjcmlwdGlvbignICAgICAgICBSb2xsYmFjayB0aGUgbGFzdCBzZXQgb2YgbWlncmF0aW9ucyBwZXJmb3JtZWQuJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgcGVuZGluZyA9IGluaXRLbmV4KGVudikubWlncmF0ZS5yb2xsYmFjaygpLnNwcmVhZChmdW5jdGlvbihiYXRjaE5vLCBsb2cpIHtcbiAgICAgICAgaWYgKGxvZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdWNjZXNzKGNoYWxrLmN5YW4oJ0FscmVhZHkgYXQgdGhlIGJhc2UgbWlncmF0aW9uJykpO1xuICAgICAgICB9XG4gICAgICAgIHN1Y2Nlc3MoXG4gICAgICAgICAgY2hhbGsuZ3JlZW4oYEJhdGNoICR7YmF0Y2hOb30gcm9sbGVkIGJhY2s6ICR7bG9nLmxlbmd0aH0gbWlncmF0aW9ucyBcXG5gKSArXG4gICAgICAgICAgY2hhbGsuY3lhbihsb2cuam9pbignXFxuJykpXG4gICAgICAgICk7XG4gICAgICB9KS5jYXRjaChleGl0KTtcbiAgICB9KTtcblxuICBjb21tYW5kZXJcbiAgICAuY29tbWFuZCgnbWlncmF0ZTpjdXJyZW50VmVyc2lvbicpXG4gICAgLmRlc2NyaXB0aW9uKCcgICAgICAgVmlldyB0aGUgY3VycmVudCB2ZXJzaW9uIGZvciB0aGUgbWlncmF0aW9uLicpXG4gICAgLmFjdGlvbihmdW5jdGlvbiAoKSB7XG4gICAgICBwZW5kaW5nID0gaW5pdEtuZXgoZW52KS5taWdyYXRlLmN1cnJlbnRWZXJzaW9uKCkudGhlbihmdW5jdGlvbih2ZXJzaW9uKSB7XG4gICAgICAgIHN1Y2Nlc3MoY2hhbGsuZ3JlZW4oJ0N1cnJlbnQgVmVyc2lvbjogJykgKyBjaGFsay5ibHVlKHZlcnNpb24pKTtcbiAgICAgIH0pLmNhdGNoKGV4aXQpO1xuICAgIH0pO1xuXG4gIGNvbW1hbmRlclxuICAgIC5jb21tYW5kKCdzZWVkOm1ha2UgPG5hbWU+JylcbiAgICAuZGVzY3JpcHRpb24oJyAgICAgICBDcmVhdGUgYSBuYW1lZCBzZWVkIGZpbGUuJylcbiAgICAub3B0aW9uKGAteCBbJHtmaWxldHlwZXMuam9pbignfCcpfV1gLCAnU3BlY2lmeSB0aGUgc3R1YiBleHRlbnNpb24gKGRlZmF1bHQganMpJylcbiAgICAuYWN0aW9uKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gaW5pdEtuZXgoZW52KTtcbiAgICAgIGNvbnN0IGV4dCA9IChhcmd2LnggfHwgZW52LmNvbmZpZ1BhdGguc3BsaXQoJy4nKS5wb3AoKSkudG9Mb3dlckNhc2UoKTtcbiAgICAgIHBlbmRpbmcgPSBpbnN0YW5jZS5zZWVkLm1ha2UobmFtZSwge2V4dGVuc2lvbjogZXh0fSkudGhlbihmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHN1Y2Nlc3MoY2hhbGsuZ3JlZW4oYENyZWF0ZWQgc2VlZCBmaWxlOiAke25hbWV9YCkpO1xuICAgICAgfSkuY2F0Y2goZXhpdCk7XG4gICAgfSk7XG5cbiAgY29tbWFuZGVyXG4gICAgLmNvbW1hbmQoJ3NlZWQ6cnVuJylcbiAgICAuZGVzY3JpcHRpb24oJyAgICAgICBSdW4gc2VlZCBmaWxlcy4nKVxuICAgIC5hY3Rpb24oZnVuY3Rpb24oKSB7XG4gICAgICBwZW5kaW5nID0gaW5pdEtuZXgoZW52KS5zZWVkLnJ1bigpLnNwcmVhZChmdW5jdGlvbihsb2cpIHtcbiAgICAgICAgaWYgKGxvZy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdWNjZXNzKGNoYWxrLmN5YW4oJ05vIHNlZWQgZmlsZXMgZXhpc3QnKSk7XG4gICAgICAgIH1cbiAgICAgICAgc3VjY2VzcyhjaGFsay5ncmVlbihgUmFuICR7bG9nLmxlbmd0aH0gc2VlZCBmaWxlcyBcXG4ke2NoYWxrLmN5YW4obG9nLmpvaW4oJ1xcbicpKX1gKSk7XG4gICAgICB9KS5jYXRjaChleGl0KTtcbiAgICB9KTtcblxuICBjb21tYW5kZXIucGFyc2UocHJvY2Vzcy5hcmd2KTtcblxuICBQcm9taXNlLnJlc29sdmUocGVuZGluZykudGhlbihmdW5jdGlvbigpIHtcbiAgICBjb21tYW5kZXIuaGVscCgpO1xuICB9KTtcbn1cblxuLy8gY29uc3QgY2xpID0gbmV3IExpZnRvZmYoe1xuLy8gICBuYW1lOiAna25leCcsXG4vLyAgIGV4dGVuc2lvbnM6IGludGVycHJldC5qc1ZhcmlhbnRzLFxuLy8gICB2OGZsYWdzOiByZXF1aXJlKCd2OGZsYWdzJylcbi8vIH0pO1xuXG4vLyBjbGkub24oJ3JlcXVpcmUnLCBmdW5jdGlvbihuYW1lKSB7XG4vLyAgIGNvbnNvbGUubG9nKCdSZXF1aXJpbmcgZXh0ZXJuYWwgbW9kdWxlJywgY2hhbGsubWFnZW50YShuYW1lKSk7XG4vLyB9KTtcblxuLy8gY2xpLm9uKCdyZXF1aXJlRmFpbCcsIGZ1bmN0aW9uKG5hbWUpIHtcbi8vICAgY29uc29sZS5sb2coY2hhbGsucmVkKCdGYWlsZWQgdG8gbG9hZCBleHRlcm5hbCBtb2R1bGUnKSwgY2hhbGsubWFnZW50YShuYW1lKSk7XG4vLyB9KTtcblxuLy8gY2xpLmxhdW5jaCh7XG4vLyAgIGN3ZDogYXJndi5jd2QsXG4vLyAgIGNvbmZpZ1BhdGg6IGFyZ3Yua25leGZpbGUsXG4vLyAgIHJlcXVpcmU6IGFyZ3YucmVxdWlyZSxcbi8vICAgY29tcGxldGlvbjogYXJndi5jb21wbGV0aW9uXG4vLyB9LCBpbnZva2UpO1xuIl19
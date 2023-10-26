#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const _ = require('lodash');

const exec = function (cmd, args) {
  return new Promise(function (resolve, reject) {
    // Execute command
    const child = child_process.exec(cmd, {
      cwd: process.cwd(),
      env: process.env,
    });

    // Pass stdout and stderr
    child.stdout.on('data', function (data) {
      process.stdout.write(data.toString());
    });
    child.stderr.on('data', function (data) {
      process.stderr.write(data.toString());
    });
    // Handle result
    child.on('exit', function (code) {
      if (code) reject(code);
      else resolve();
    });
    child.on('error', reject);
  });
};

const CWD = process.cwd();
const POSTINSTALL_BUILD_CWD = process.env.POSTINSTALL_BUILD_CWD;

// If we didn't have this check, then we'd be stuck in an infinite `postinstall`
// loop, since we run `npm install --only=dev` below, triggering another
// `postinstall`. We can't use `--ignore-scripts` because that ignores scripts
// on all the modules that get installed, too, which would break stuff. So
// instead, we set an environment variable, `POSTINSTALL_BUILD_CWD`, that keeps
// track of what we're installing. It's more than just a yes/no flag because
// the dev dependencies we're installing might use `postinstall-build` too, and
// we don't want the flag to prevent them from running.
if (POSTINSTALL_BUILD_CWD !== CWD) {
  const BUILD_ARTIFACT = process.argv[2];
  const BUILD_COMMAND = process.argv[3];

  fs.stat(BUILD_ARTIFACT, function (err, stats) {
    if (err || !(stats.isFile() || stats.isDirectory())) {
      // This script will run again after we run `npm install` below. Set an
      // environment variable to tell it to skip the check. Really we just want
      // the execSync's `env` to be modified, but it's easier just modify and
      // pass along the entire `process.env`.
      process.env.POSTINSTALL_BUILD_CWD = CWD;
      // We already have prod dependencies, that's what triggered `postinstall`
      // in the first place. So only install dev.

      // Fetch package.json
      const pkgJson = require(path.join(CWD, 'package.json'));
      const devDeps = pkgJson.devDependencies;
      // Values listed under `buildDependencies` contain the dependency names
      // that are required for `lib` building.
      const buildDependencies = _.pick(devDeps, pkgJson.buildDependencies);

      // Proceed only if there is something to install
      if (!_.isEmpty(buildDependencies)) {
        const opts = { env: process.env, stdio: 'inherit' };

        console.log('Building Knex.js');

        // Map all key (dependency) value (semver) pairs to
        // "dependency@semver dependency@semver ..." string that can be used
        // for `npm install` command
        const installArgs = _(buildDependencies)
          .pickBy(function (semver, dep) {
            // Check if the dependency is already installed
            try {
              require(dep);
              return false;
            } catch (err) {
              return true;
            }
          })
          .map(function (semver, dep) {
            // Format installable dependencies
            return dep + '@' + semver;
          })
          .value()
          .join(' ');
        const needsDepInstallation = !_.isEmpty(installArgs);
        const dependenciesInstalledQ = needsDepInstallation
          ? exec('npm install ' + installArgs, opts)
          : Promise.resolve();
        dependenciesInstalledQ
          .then(function () {
            console.log('✓');
            // Don't need the flag anymore as `postinstall` was already run.
            // Change it back so the environment is minimally changed for the
            // remaining commands.
            process.env.POSTINSTALL_BUILD_CWD = POSTINSTALL_BUILD_CWD;
            console.log('Building compiled files (' + BUILD_COMMAND + ')');
            return exec(BUILD_COMMAND, opts);
          })
          .catch(function (err) {
            console.error(err);
            process.exit(1);
          })
          .then(function () {
            if (process.env.NODE_ENV === 'production') {
              console.log('✓');
              console.log('Pruning dev dependencies for production build');
              return exec('npm prune --production', opts);
            } else {
              console.log('Skipping npm prune');
            }
          })
          .then(function () {
            console.log('✓');
          })
          .catch(function (err) {
            console.error(err);
            process.exit(1);
          });
      }
    }
  });
}

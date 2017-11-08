/*global describe*/

'use strict';

const os      = require('os');
const proc    = require('child_process')
const config  = require('../knexfile');
const knex    = require('../../knex');

if (canRunDockerTests()) {
  for (const dialectName in config) {
    if (config[dialectName].docker) {
      describe(`${dialectName} dialect`, function() {
        require('./reconnect')(config[dialectName], knex);
      })
    }
  }
}

function canRunDockerTests() {
  const isLinux   = os.platform() === 'linux';
  const isDarwin  = os.platform() === 'darwin'
  // dont even try on windows / osx for now
  let hasDockerStarted = false;
  if (isLinux || isDarwin) {
    hasDockerStarted = proc.execSync('docker info 1>/dev/null 2>&1 ; echo $?').toString('utf-8') === '0\n';
  }
  return hasDockerStarted;
}

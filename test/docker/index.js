'use strict';

var os      = require('os');
var proc    = require('child_process')
var config  = require('../knexfile');
var knex    = require('../../knex');

if (canRunDockerTests()) {
  var dialectName;
  for (dialectName in config) {
    if (config[dialectName].docker) {
      require('./reconnect')(config[dialectName], knex);
    }
  }
}

function canRunDockerTests() {
  var isLinux   = os.platform() === 'linux';

  // dont even try on windows / osx for now
  var hasDocker = false;
  if (isLinux) {
    hasDocker = proc.execSync('docker -v 1>/dev/null 2>&1 ; echo $?').toString('utf-8') === '0\n';
  }

  return isLinux && hasDocker;
}

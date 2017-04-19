'use strict';

var os      = require('os');
var proc    = require('child_process')
var config  = require('../knexfile');
var knex    = require('../../knex');
var Promise = require('bluebird');

if (canRunDockerTests()) {
  Promise.each(Object.keys(config), function(dialectName) {
    if (config[dialectName].docker) {
      return require('./reconnect')(config[dialectName], knex);
    }
  });
}

function canRunDockerTests() {
  var isLinux   = os.platform() === 'linux';
  var hasDocker = proc.execSync('docker -v 1>/dev/null 2>&1 ; echo $?').toString('utf-8') === '0\n';
  return isLinux && hasDocker;
}

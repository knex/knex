'use strict';
/* eslint no-console: ["error", { allow: ["log"] }] */

const Promise           = require('bluebird');
const _                 = require('lodash');
const DockerContainer   = require('../dockerContainer');

function RedshiftContainer(docker, options) {
  const name     = _.get(options, 'container');
  const image    = _.get(options, 'image');
  const username = _.get(options, 'username');
  const password = _.get(options, 'password');
  const hostPort = _.get(options, 'hostPort');
  DockerContainer.call(this, docker, name, image, {
    Env: ['POSTGRES_USER=' + username, 'POSTGRES_PASSWORD='  + password],
    PortBindings: {
      '5439/tcp': [{
        HostPort: hostPort.toString()
      }]
    }
  });
}

RedshiftContainer.prototype = Object.create(DockerContainer.prototype);

/**
 * @returns {Promise}
 */
RedshiftContainer.prototype.waitReady = function () {
  const self = this;
  return self.container.then(function (c) {
    return new Promise(function (resolve) {
      c.exec({
        AttachStdout: true,
        Cmd: [
          'sh',
          '-c',
          'until psql -U postgres -d postgres -c "select 1"; do sleep 1; done'
        ]
      })
      .then(function (exec) {
        return exec.start({ Detach: false, Tty: true });
      })
      .then(function (object) {
        const output = object.output;
        output.on('data', function (data) {
          console.log(data.toString('utf-8').trim());
        });
        output.on('end', function () {
          resolve(self);
        });
      });
    })
  });
}

module.exports = RedshiftContainer;

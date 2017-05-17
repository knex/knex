'use strict';

var Promise           = require('bluebird');
var _                 = require('lodash');
var DockerContainer   = require('../dockerContainer');

function PostgresContainer(docker, options) {
  var name     = _.get(options, 'container');
  var image    = _.get(options, 'image');
  var username = _.get(options, 'username');
  var password = _.get(options, 'password');
  var hostPort = _.get(options, 'hostPort');
  DockerContainer.call(this, docker, name, image, {
    Env: ['POSTGRES_USER=' + username, 'POSTGRES_PASSWORD='  + password],
    PortBindings: {
      '5432/tcp': [{
        HostPort: hostPort.toString()
      }]
    }
  });
}

PostgresContainer.prototype = Object.create(DockerContainer.prototype);

/**
 * @returns {Promise}
 */
PostgresContainer.prototype.waitReady = function () {
  var self = this;
  return self.container.then(function (c) {
    return new Promise(function (resolve) {
      c.exec({
        AttachStdout: true,
        Cmd: [
          'sh',
          '-c',
          'until pg_isready; do sleep 1; done'
        ]
      })
      .then(function (exec) {
        return exec.start({ Detach: false, Tty: true });
      })
      .then(function (object) {
        var output = object.output;
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

module.exports = PostgresContainer;

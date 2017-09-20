'use strict';

var Promise           = require('bluebird');
var _                 = require('lodash');
var DockerContainer   = require('../dockerContainer');

function MySQLContainer(docker, options) {
  var name     = _.get(options, 'container');
  var image    = _.get(options, 'image');
  var username = _.get(options, 'username');
  var password = _.get(options, 'password');
  var hostPort = _.get(options, 'hostPort');
  DockerContainer.call(this, docker, name, image, {
    Env: [ 'MYSQL_ROOT_PASSWORD=root' ],
    PortBindings: {
      '3306/tcp': [{
        HostPort: hostPort.toString()
      }]
    }
  });
}

MySQLContainer.prototype = Object.create(DockerContainer.prototype);

/**
 * @returns {Promise}
 */
MySQLContainer.prototype.waitReady = function () {
  var self = this;
  return self.container.then(function (c) {
    return new Promise(function (resolve) {
      c.exec({
        AttachStdout: true,
        Cmd: [
          'sh',
          '-c',
          'until mysqladmin ping -h 127.0.0.1 --silent; do echo "Waiting for mysql readiness" && sleep 2; done'
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

module.exports = MySQLContainer;

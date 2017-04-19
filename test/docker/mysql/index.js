'use strict';

const Promise           = require('bluebird');
const _                 = require('lodash');
const DatabaseContainer = require('../databaseContainer');

function MySQLContainer(docker, options) {
  var name     = _.get(options, 'container');
  var image    = _.get(options, 'image');
  var username = _.get(options, 'username');
  var password = _.get(options, 'password');
  var hostPort = _.get(options, 'hostPort');
  DatabaseContainer.call(this, docker, name, image, {
    Env: [ `MYSQL_ROOT_PASSWORD=root` ],
    PortBindings: {
      '3306/tcp': [{
        HostPort: `${hostPort}`
      }]
    }
  });
}

MySQLContainer.prototype = Object.create(DatabaseContainer.prototype);

/**
 * @returns {Promise}
 */
MySQLContainer.prototype.waitReady = function () {
  return this.container.then((c) => {
    return new Promise((resolve) => {
      c.exec({
        AttachStdout: true,
        Cmd: [
          'sh',
          '-c',
          'until mysqladmin ping -h 127.0.0.1 --silent; do echo "Waiting for mysql readiness" && sleep 2; done'
        ]
      })
      .then((exec) =>
        exec.start({ Detach: false, Tty: true })
      )
      .then(({ output }) => {
        output.on('data', (data) => {
          console.log(data.toString('utf-8').trim());
        });
        output.on('end', () => resolve(this));
      });
    })
  });
}

module.exports = MySQLContainer;

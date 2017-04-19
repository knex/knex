'use strict';

const Promise           = require('bluebird');
const _                 = require('lodash');
const DatabaseContainer = require('../databaseContainer');

function PostgresContainer(docker, options) {
  var name     = _.get(options, 'container');
  var image    = _.get(options, 'image');
  var username = _.get(options, 'username');
  var password = _.get(options, 'password');
  var hostPort = _.get(options, 'hostPort');
  DatabaseContainer.call(this, docker, name, image, {
    Env: [`POSTGRES_USER=${username}`, `POSTGRES_PASSWORD=${password}`],
    PortBindings: {
      '5432/tcp': [{
        HostPort: `${hostPort}`
      }]
    }
  });
}

PostgresContainer.prototype = Object.create(DatabaseContainer.prototype);

/**
 * @returns {Promise}
 */
PostgresContainer.prototype.waitReady = function () {
  return this.container.then((c) => {
    return new Promise((resolve) => {
      c.exec({
        AttachStdout: true,
        Cmd: [
          'sh',
          '-c',
          'until pg_isready; do sleep 1; done'
        ]
      })
      .then((exec) =>
        exec.start({ Detach: false, Tty: true })
      )
      .then(({ output }) => {
        output.on('data', function (data) {
          console.log(data.toString('utf-8').trim());
        });
        output.on('end', () => resolve(this));
      });
    })
  });
}

module.exports = PostgresContainer;

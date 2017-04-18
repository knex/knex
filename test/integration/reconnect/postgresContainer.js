const Promise = require('bluebird');
const _        = require('lodash');

function PostgresContainer(docker, options) {
  var name     = _.get(options, 'name', 'knex-postgres');
  var image    = _.get(options, 'image', 'postgres:9.6');
  var username = _.get(options, 'username', 'postgres');
  var password = _.get(options, 'password', '');
  var hostPort = _.get(options, 'hostPort', 5432);
  this.container = docker.createContainer(
    name,
    image,
    {
      Env: [`POSTGRES_USER=${username}`, `POSTGRES_PASSWORD=${password}`],
      PortBindings: {
        '5432/tcp': [{
          HostPort: `${hostPort}`
        }]
      }
    }
  );
}

/**
 * @returns {Promise}
 */
PostgresContainer.prototype.start = function () {
  return this.container.then((c) =>
    c.start().then(() => {
      console.log(`#~ Started container ${c.id}`);
      return this.waitReady();
    })
  )
};

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

/**
 * @returns {Promise}
 */
PostgresContainer.prototype.stop = function () {
  return this.container.then((c) =>
    c.stop().then(() =>
      console.log(`#~ Stopped container ${c.id}`)
    )
    .catch((err) => {
      if (err.statusCode !== 304) {
        throw err;
      }
    })
  );
}

/**
 * @returns {Promise}
 */
PostgresContainer.prototype.destroy = function () {
  return this.stop().then(() =>
    this.container.then((c) =>
      c.remove().then(() =>
        console.log(`#~ Removed container ${c.id}`)
      )
    )
  );
}

module.exports = PostgresContainer;

'use strict';

const Promise = require('bluebird');
const _        = require('lodash');

function DockerContainer(docker, name, image, options) {
  this.container = docker.createContainer(name, image, options);
}

/**
 * @returns {Promise}
 */
DockerContainer.prototype.start = function () {
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
DockerContainer.prototype.waitReady = function () {
  return Promise.resolve(this);
}

/**
 * @returns {Promise}
 */
DockerContainer.prototype.stop = function () {
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
DockerContainer.prototype.destroy = function () {
  return this.stop().then(() =>
    this.container.then((c) =>
      c.remove().then(() =>
        console.log(`#~ Removed container ${c.id}`)
      )
    )
  );
}

module.exports = DockerContainer;

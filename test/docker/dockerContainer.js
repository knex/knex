'use strict';

var Promise = require('bluebird');

function DockerContainer(docker, name, image, options) {
  this.container = docker.createContainer(name, image, options);
}

/**
 * @returns {Promise}
 */
DockerContainer.prototype.start = function () {
  var self = this;
  return self.container.then(function (c) {
    return c.start().then(function () {
      console.log('#~ Started container', c.id);
      return self.waitReady();
    })
  })
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
  return this.container.then(function (c) {
    return c.stop().then(function () {
      console.log('#~ Stopped container', c.id);
    })
    .catch(function (err) {
      if (err.statusCode !== 304) {
        throw err;
      }
    });
  });
}

/**
 * @returns {Promise}
 */
DockerContainer.prototype.destroy = function () {
  var self = this;
  return self.stop().then(function () {
    return self.container.then(function (c) {
      return c.remove().then(function () {
        console.log('#~ Removed container', c.id);
      });
    });
  });
}

module.exports = DockerContainer;

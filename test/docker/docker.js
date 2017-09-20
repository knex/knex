var _       = require('lodash');
var $Docker = require('dockerode');

function Docker() {
  this.dockerAPI = new $Docker({ socketPath: '/var/run/docker.sock' });
}

/**
 * @param {String} name
 * @param {String} image
 * @param {Object} options
 * @returns Promise<Object>
 */
Docker.prototype.createContainer = function (name, image, options) {
  return this.dockerAPI.createContainer({
    name:         name,
    Image:        image,
    AttachStdin:  _.get(options, 'AttachStdin', false),
    AttachStdout: _.get(options, 'AttachStdout', true),
    AttachStderr: _.get(options, 'AttachStderr', true),
    Tty:          _.get(options, 'Tty', true),
    OpenStdin:    _.get(options, 'OpenStdin', false),
    StdinOnce:    _.get(options, 'StdinOnce', false),
    Env:          _.get(options, 'Env'),
    PortBindings: _.get(options, 'PortBindings')
  });
}

module.exports = Docker;

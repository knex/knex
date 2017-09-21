/*global expect, describe, before, after, it, testPromise*/

'use strict';

var os = require("os");
var proc    = require('child_process');
var Docker = require("../docker/docker");
var Promise = testPromise;

module.exports = function(knex, config) {
  var sinon = require('sinon');
  var docker,
    dockerConf,
    container;

  describe(knex.client.dialect + ' | ' + knex.client.driverName, function() {

    this.dialect    = knex.client.dialect;
    this.driverName = knex.client.driverName;

    before(function() {
      if (config && config.docker && canRunDockerTests()) {
        dockerConf = config.docker;
        const ContainerClass = require("../docker/" + dockerConf. factory);
        docker = new Docker();
        container = new ContainerClass(docker, dockerConf);
        return container.start().then(function() {
          return waitReadyForQueries();
        });
      }
    });

    after(function() {
      var promises = [
        knex.destroy(),
      ];
      if (container) {
        promises.push(container.destroy());
      }
      return testPromise.all(promises);
    });

    require('./schema')(knex);
    require('./migrate')(knex);
    require('./seed')(knex);
    require('./builder/inserts')(knex);
    require('./builder/selects')(knex);
    require('./builder/unions')(knex);
    require('./builder/joins')(knex);
    require('./builder/aggregate')(knex);
    require('./builder/updates')(knex);
    require('./builder/transaction')(knex);
    require('./builder/deletes')(knex);
    require('./builder/additional')(knex);
    require('./datatype/bigint')(knex);

    describe('knex.destroy', function() {
      it('should allow destroying the pool with knex.destroy', function() {
        var spy = sinon.spy(knex.client.pool, 'clear');
        return knex.destroy().then(function() {
          expect(spy).to.have.callCount(1);
          expect(knex.client.pool).to.equal(undefined);
          return knex.destroy();
        }).then(function() {
          expect(spy).to.have.callCount(1);
        });
      });
    });
  });


  function waitReadyForQueries(attempt) {
    attempt = attempt || 0;
    return new Promise(function (resolve, reject) {
      knex.raw('SELECT 1 as one')
        .then(function () {
          resolve();
        })
        .catch(function (a) {
          if (attempt < 20) {
            setTimeout(function () { resolve(waitReadyForQueries(attempt + 1)) }, 1000);
          } else {
            reject(attempt);
          }
        });
    });
  }

  function canRunDockerTests() {
    var isLinux   = os.platform() === 'linux';
    var isDarwin  = os.platform() === 'darwin'
    // dont even try on windows / osx for now
    var hasDocker = false;
    if (isLinux || isDarwin) {
      hasDocker = proc.execSync('docker -v 1>/dev/null 2>&1 ; echo $?').toString('utf-8') === '0\n';
    }
    return hasDocker;
  }
};

/*global afterEach, before, expect, describe, it, testPromise*/
'use strict';

var Docker  = require('./docker');
var Promise = testPromise;

module.exports = function(config, knex) {

  var dockerConf       = config.docker;
  var ContainerClass   = require(dockerConf.factory);

  var EVICTION_RUN_INTERVAL_MILLIS = 15 * 1000;
  var IDLE_TIMEOUT_MILLIS          = 20 * 1000;
  var ACQUIRE_CONNECTION_TIMEOUT   = 10 * 1000;
  var ACQUIRE_TIMEOUT_MILLIS       = 10 * 1000;

  var docker;
  var connectionPool;
  var container;


  describe('using database as a docker container', function () {

    this.timeout(dockerConf.timeout);

    before(function () {
      docker = new Docker();
    });

    afterEach(function () {
      return sequencedPromise([
        function () { console.log('>> Destroying container'); },
        function () { return container.destroy(); }
        // function () { console.log('>> Destroying pool'); },
        // function () { return connectionPool.destroy(); },
        // function () { console.log('>> Destroyed all'); }
      ]);
    });

    describe('start container and wait until it is ready', function () {

      beforeEach(function () {
        container = new ContainerClass(docker, dockerConf);
        return container.start().then(function () {
          return waitReadyForQueries();
        });
      });

      describe('initialize connection pool', function () {
        beforeEach(function () {
          connectionPool = createPool();
        });

        it('connection pool can query', function () {
          return testQuery(connectionPool);
        });

        describe('stop db-container and expect queries to fail', function () {

          beforeEach(function () {
            return container.stop();
          });

          it('connection pool can not query x10', function () {
            var promises = [];
            for (var i = 0; i < 10; i += 1) {
              promises.push(
                testQuery(connectionPool)
                  .then(function () { throw new Error('Failure expected'); })
                  .catch(function (err) {
                    expect(err.message).to.not.equal('Failure expected');
                  })
              );
            }
            return Promise.all(promises);
          });

          describe('restart db-container and keep using connection pool', function () {
            beforeEach(function () {
              return container.start().then(function () {
                return waitReadyForQueries();
              });
            });

            it('connection pool can query x10', function () {
              var promises = [];
              for (var i = 0; i < 10; i += 1) {
                promises.push(testQuery(connectionPool));
              }
              return Promise.all(promises);
            });
          });
        });
      });
    })
  });

  function testQuery(pool) {
    return pool.raw('SELECT 10 as ten').then(function (result) {
      expect(result.rows || result[0]).to.deep.equal([{ ten: 10 }]);
    });
  }

  function sequencedPromise(blocks) {
    var order = function (prev, block) {
      return prev.then(block)
    };
    var base  = Promise.resolve(true);
    return blocks.reduce(order, base);
  }

  function createPool() {
    return knex({
      // debug:                    true,
      client:                   dockerConf.client,
      acquireConnectionTimeout: ACQUIRE_CONNECTION_TIMEOUT,
      pool:                     {
        min:                       7,
        max:                       7,
        idleTimeoutMillis:         IDLE_TIMEOUT_MILLIS,
        acquireTimeoutMillis:      ACQUIRE_TIMEOUT_MILLIS,
        evictionRunIntervalMillis: EVICTION_RUN_INTERVAL_MILLIS
      },
      connection:               {
        database: dockerConf.database,
        port:     dockerConf.hostPort,
        user:     dockerConf.username,
        password: dockerConf.password,
        host:     '127.0.0.1'
      }
    });
  }

  function waitReadyForQueries(attempt) {
    attempt = attempt || 0;
    return new Promise(function (resolve, reject) {
      console.log('#~ Waiting to be ready for queries #', attempt);
      var pool = createPool();
      pool.raw('SELECT 1 as one')
        .then(function () {
          return pool.destroy().then(resolve);
        })
        .catch(function (a) {
          return pool.destroy().then(function () {
            if (attempt < 20) {
              setTimeout(function () { resolve(waitReadyForQueries(attempt + 1)) }, 1000);
            } else {
              reject(attempt);
            }
          })
        });
    });
  }
};

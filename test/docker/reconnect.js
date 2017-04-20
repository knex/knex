/*global afterEach, before, expect, describe, it, testPromise*/
'use strict';

var Docker  = require('./docker');
var Promise = testPromise;

module.exports = function(config, knex) {

  var dockerConf       = config.docker;
  var ContainerClass   = require(dockerConf.factory);

  /**
   * Make sure the connections in the connection pool are not
   * evicted on timeout, they should only be evicted on error.
   */
  var EVICTION_RUN_INTERVAL_MILLIS = dockerConf.timeout;
  var IDLE_TIMEOUT_MILLIS          = dockerConf.timeout;
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
      return sequencedPromise(
        () => console.log('>> Destroying container'),
        () => container.destroy(),
        () => console.log('>> Destroying pool'),
        () => connectionPool.destroy(),
        () => console.log('>> Destroyed all')
      );
    });

    describe('start container and wait until it is ready', function () {

      beforeEach(function () {
        container = new ContainerClass(docker, dockerConf);
        return container.start().then(() => waitReadyForQueries());
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
                  .then(() => { throw new Error('Failure expected'); })
                  .catch((err) => expect(err.message).to.not.equal('Failure expected'))
              );
            }
            return Promise.all(promises);
          });

          describe('restart db-container and keep using connection pool', function () {
            beforeEach(function () {
              return container.start().then(() => waitReadyForQueries());
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
    return pool.raw(`SELECT 10 as ten`).then((result) => {
      expect(result.rows || result[0]).to.deep.equal([{ ten: 10 }]);
    });
  }

  function sequencedPromise(...blocks) {
    const base  = Promise.resolve(true);
    const order = (prev, block) => prev.then(() => block());
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

  function waitReadyForQueries(attempt = 0) {
    return new Promise(function (resolve, reject) {
      console.log(`#~ Waiting to be ready for queries #${attempt}`);
      var pool = createPool();
      pool.raw('SELECT 1 as one')
        .then(() => pool.destroy().then(resolve))
        .catch((a) => {
          pool.destroy().then(() => {
            if (attempt < 20) {
              setTimeout(() => resolve(waitReadyForQueries(attempt + 1)), 1000);
            } else {
              reject(attempt);
            }
          })
        });
    });
  }
};

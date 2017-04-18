/*global afterEach, before, expect, describe, it, testPromise*/

var Docker            = require('./docker');
var knex              = require('../../../knex');
var PostgresContainer = require('./postgresContainer');

'use strict';

var Promise = testPromise;

var DB_CONTAINER_PORT            = 49152;
var EVICTION_RUN_INTERVAL_MILLIS = 15 * 1000;
var IDLE_TIMEOUT_MILLIS          = 20 * 1000;
var ACQUIRE_CONNECTION_TIMEOUT   = 10 * 1000;
var ACQUIRE_TIMEOUT_MILLIS       = 10 * 1000;

module.exports = function() {

  var docker;
  var connectionPool;
  var container;

  describe('using database as a docker container', function () {
    this.timeout(30 * 1000);

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
        container = new PostgresContainer(docker, { hostPort: DB_CONTAINER_PORT });
        return container.start().then(() => waitReadyForQueries());
      });

      describe('initialize connection pool', function () {
        beforeEach(function () {
          connectionPool = createPool();
        });

        it('connection pool can query', function () {
          return connectionPool.raw('SELECT 10 as ten').then((result) => {
            expect(result.rows).to.deep.equal([{ ten: 10 }]);
          });
        });

        describe('restart postgres and keep using connection pool', function () {
          beforeEach(function () {
            return container.stop()
              .then(() => container.start())
              .then(() => waitReadyForQueries());
          });

          it('connection pool can query x10', function () {
            var promises = [];
            for (var i = 0; i < 10; i += 1) {
              promises.push(
                connectionPool.raw(`SELECT 10 as ten`).then((result) => {
                  expect(result.rows).to.deep.equal([{ ten: 10 }]);
                })
              );
            }
            return Promise.all(promises);
          });
        });
      });
    })
  });

  function sequencedPromise(...blocks) {
    const base  = Promise.resolve(true);
    const order = (prev, block) => prev.then(() => block());
    return blocks.reduce(order, base);
  }

  function createPool() {
    return knex({
      // debug:                    true,
      client:                   'pg',
      acquireConnectionTimeout: ACQUIRE_CONNECTION_TIMEOUT,
      pool:                     {
        min:                       7,
        max:                       7,
        idleTimeoutMillis:         IDLE_TIMEOUT_MILLIS,
        acquireTimeoutMillis:      ACQUIRE_TIMEOUT_MILLIS,
        evictionRunIntervalMillis: EVICTION_RUN_INTERVAL_MILLIS
      },
      connection:               {
        database: 'postgres',
        port:     `${DB_CONTAINER_PORT}`,
        host:     '127.0.0.1',
        user:     'postgres',
        password: ''
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

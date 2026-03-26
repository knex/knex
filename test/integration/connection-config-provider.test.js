'use strict';

const _ = require('lodash');
const makeKnex = require('../../knex');
const { setHiddenProperty } = require('../../lib/util/security');
const { getAllDbs, getKnexForDb } = require('../integration2/util/knex-instance-provider');

getAllDbs().forEach((db) => {
  describe(`${db} - Connection configuration provider`, () => {
    let knex;
    let config;
    let configWorkingCopy;
    let providerInvocationCount;
    let connectionConfigWorkingCopy;

    beforeAll(() => {
      knex = getKnexForDb(db);
      config = knex.client.config;
    });
    afterAll(() => knex.destroy());

    beforeEach(() => {
      configWorkingCopy = _.cloneDeep(config);
      if (config.connection && config.connection.password) {
        setHiddenProperty(configWorkingCopy.connection, config.connection);
      }
      configWorkingCopy.pool.min = 1;
      configWorkingCopy.pool.max = 2;
      providerInvocationCount = 0;
      connectionConfigWorkingCopy = configWorkingCopy.connection;
    });

    it('is not used when configuration is static', async function () {
      return runTwoConcurrentTransactions(0);
    });

    it('can return a promise for a config object, which is reused when not given given an expiry checker', async () => {
      configWorkingCopy.connection = () => {
        ++providerInvocationCount;
        return Promise.resolve(connectionConfigWorkingCopy);
      };
      return runTwoConcurrentTransactions(1);
    });

    it('can return a config object, which is reused when not given given an expiry checker', async () => {
      configWorkingCopy.connection = () => {
        ++providerInvocationCount;
        return connectionConfigWorkingCopy;
      };
      return runTwoConcurrentTransactions(1);
    });

    it('reuses the same resolved config when not yet expired', async () => {
      configWorkingCopy.connection = () => {
        ++providerInvocationCount;
        return Object.assign(connectionConfigWorkingCopy, {
          expirationChecker: () => false,
        });
      };
      return runTwoConcurrentTransactions(1);
    });

    it('replaces the resolved config when expired', async () => {
      configWorkingCopy.connection = () => {
        ++providerInvocationCount;
        return Object.assign(connectionConfigWorkingCopy, {
          expirationChecker: () => true,
        });
      };
      const knexLocal = makeKnex(configWorkingCopy);
      let caught;
      try {
        const initial = await knexLocal.client.connectionConfigProvider();
        knexLocal.client.connectionSettings = initial;
        if (initial.expirationChecker) {
          knexLocal.client.connectionConfigExpirationChecker =
            initial.expirationChecker;
          delete initial.expirationChecker;
        }
        const poolConfig = knexLocal.client.getPoolSettings(knexLocal.client.config.pool);
        await poolConfig.validate({});
      } catch (err) {
        caught = err;
      } finally {
        await knexLocal.destroy();
      }
      expect(caught).toBeInstanceOf(Error);
      expect(caught.message).toContain(
        'Connection configuration still reported expired after refresh'
      );
      expect(providerInvocationCount).toBe(2);
    });

    async function runTwoConcurrentTransactions(expectedInvocationCount) {
      const knexLocal = makeKnex(configWorkingCopy);
      await knexLocal.transaction(async (trx) => {
        await knexLocal.transaction(async (trx2) => {});
      });
      await knexLocal.destroy();
      expect(providerInvocationCount).toBe(expectedInvocationCount);
    }
  });
});

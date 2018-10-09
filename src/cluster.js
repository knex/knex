import Knex from './knex';
import { CLUSTER_CONFIG_OPTIONS, SUPPORTED_CLUSTERS } from './constants';
import Promise from 'bluebird';
import { assign } from 'lodash';

const _getValidPools = (cluster, name) => {
  const poolNameRegex = new RegExp(name);
  const filteredPools = [];
  const uptime = process.uptime();

  // narrow pools down to ones with matching names
  for (const poolName in cluster) {
    if (!cluster.hasOwnProperty(poolName)) {
      continue;
    }
    const pool = cluster[poolName];
    if (poolNameRegex.test(poolName) && pool.isOnline(uptime)) {
      filteredPools.push(cluster[poolName]);
      continue;
    }
  }
  return filteredPools;
};

const _getRandom = (myArray) => {
  const floor = Math.floor;
  const random = Math.random;
  return myArray[floor(random() * myArray.length)];
};

const parseConfig = (config) => {
  const parsedConfig = {};
  for (const name in config) {
    if (!CLUSTER_CONFIG_OPTIONS.includes(name)) {
      throw new Error('knex: Unsupported config item: ' + name);
    }
    if (!config.hasOwnProperty(name)) {
      continue;
    }
    parsedConfig[name] = config[name];
  }
  return parsedConfig;
};

export default function KnexCluster(config) {
  // check this dialect supports clusters;
  // create a new config
  // create a cluster of knex objects
  this.config = parseConfig(config);
  this._defaultSelector = config.defaultSelector || 'RR';
  this.cluster = {};
  this._roundRobin = {};
}

assign(KnexCluster.prototype, {
  add(poolName, poolConfig) {
    if (!SUPPORTED_CLUSTERS.includes(poolConfig.client)) {
      throw new Error(
        `knex: Clustering for ${poolConfig.client} is not yet supported`
      );
    }
    if (this.cluster[poolName] !== undefined) {
      throw new Error(
        `knex: Pool ${poolName} is already defined in knexCluster`
      );
    }

    const newKnex = Knex(poolConfig);
    newKnex.addToCluster(this.config);

    this.cluster[poolName] = newKnex;
  },
  remove(poolName) {
    const knexPool = this.cluster[poolName];
    if (!knexPool) {
      throw new Error(`knex: Pool ${poolName} not found in cluster`);
    }
    return new Promise((resolve) => {
      knexPool.destroy(() => {
        delete this.cluster[poolName];
        return resolve();
      });
    });
  },
  _getRoundRobin(name, pools) {
    if (!this._roundRobin[name]) {
      this._roundRobin[name] = 0;
    }
    // in case they removed a pool or one went offline
    let position = Math.min(this._roundRobin[name], pools.length - 1);
    const pool = pools[position];
    position += 1;
    this._roundRobin[name] = position >= pools.length ? 0 : position;
    return pool;
  },

  getKnex(name, selector = this._defaultSelector) {
    const pools = _getValidPools(this.cluster, name);
    if (pools.length === 0) {
      throw new Error('knex: no valid pools found');
    }
    switch (selector) {
      case 'RR':
        return this._getRoundRobin(name, pools);
      case 'RANDOM':
        return _getRandom(name, pools);
      default:
        throw new Error(`knex: Unknown selector option ${selector}`);
    }
  },
});

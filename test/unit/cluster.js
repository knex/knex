const Knex = require('../../lib/index');
const { expect } = require('chai');

const getClusterConfig = () => ({
  removeNodeErrorCount: 5,
  restoreNodeTimeout: 0,
});

const getConnectionConfig = () => ({
  client: 'mysql',
  connection: {},
});

const KnexCluster = Knex.KnexCluster;
describe('Cluster tests', () => {
  describe('cluster config tests', () => {
    it('sets a default selector', () => {});
  });
  describe('general tests', () => {
    it('creates a cluster', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);
      expect(cluster.cluster).to.exist;
      expect(cluster.config).to.deep.equal(clusterConfig);
    });

    it('adds a node to a cluster', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);
      const connectionConfig = getConnectionConfig();
      cluster.add('MASTER', connectionConfig);
      expect(cluster.cluster.MASTER).to.exist;
    });

    it('removes a node from the cluster', async () => {
      const clusterConfig = getClusterConfig();
      const connectionConfig = getConnectionConfig();
      const cluster = new KnexCluster(clusterConfig);
      cluster.add('MASTER', connectionConfig);
      expect(cluster.cluster.MASTER).to.exist;
      await cluster.remove('MASTER');
      expect(cluster.cluster.MASTER).to.not.exist;
    });

    it('gets a connection by name', () => {
      const clusterConfig = getClusterConfig();
      const connectionConfig = getConnectionConfig();
      connectionConfig.connection.host = 'fakeHost';
      const cluster = new KnexCluster(clusterConfig);
      cluster.add('MASTER', connectionConfig);
      const myKnex = cluster.getKnex('MASTER');
      // check we got the right one back
      expect(myKnex).to.exist;
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost');
    });

    it('gets a connection by regex', () => {
      const clusterConfig = getClusterConfig();
      const connectionConfig = getConnectionConfig();
      connectionConfig.connection.host = 'fakeHost';
      const cluster = new KnexCluster(clusterConfig);
      cluster.add('MASTER', connectionConfig);
      const myKnex = cluster.getKnex('MAST*');
      // check we got the right one back
      expect(myKnex).to.exist;
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost');
    });

    it('gets a connection by round robin', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);

      const connectionConfig = getConnectionConfig();
      connectionConfig.connection.host = 'fakeHost';
      cluster.add('MASTER1', connectionConfig);

      const connectionConfig2 = getConnectionConfig();
      connectionConfig2.connection.host = 'fakeHost2';
      cluster.add('MASTER2', connectionConfig2);

      let myKnex = cluster.getKnex('MAST*', 'RR');
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost');

      myKnex = cluster.getKnex('MAST*', 'RR');
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost2');

      myKnex = cluster.getKnex('MAST*', 'RR');
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost');
    });
  });

  describe('pool auto removal tests', () => {
    it('doesnt return a failing pool', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);

      const connectionConfig = getConnectionConfig();
      connectionConfig.connection.host = 'fakeHost';
      cluster.add('MASTER1', connectionConfig);

      const connectionConfig2 = getConnectionConfig();
      connectionConfig2.connection.host = 'fakeHost2';
      cluster.add('MASTER2', connectionConfig2);

      let myKnex = cluster.getKnex('MAST*', 'RR');
      myKnex.client.offlineUntil = process.uptime() + 1000000;

      // Try a few times to make sure its looped back around
      for (let i = 0; i < 3; i++) {
        myKnex = cluster.getKnex('MAST*', 'RR');
        expect(myKnex.client.connectionSettings.host).to.equal('fakeHost2');
      }
    });

    it('returns a pool that is no longer failing', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);

      const connectionConfig = getConnectionConfig();
      connectionConfig.connection.host = 'fakeHost';
      cluster.add('MASTER1', connectionConfig);

      const connectionConfig2 = getConnectionConfig();
      connectionConfig2.connection.host = 'fakeHost2';
      cluster.add('MASTER2', connectionConfig2);

      let myKnex = cluster.getKnex('MAST*', 'RR');
      myKnex.client.offlineUntil = process.uptime() - 1;

      myKnex = cluster.getKnex('MAST*', 'RR');
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost2');

      myKnex = cluster.getKnex('MAST*', 'RR');
      expect(myKnex.client.connectionSettings.host).to.equal('fakeHost');
    });
  });

  describe('rejection tests', () => {
    it('throws if an unknown cluster config is used', () => {
      const clusterConfig = getClusterConfig();
      clusterConfig.unsupportedItem = true;
      const throwingFunction = () => {
        new KnexCluster(clusterConfig);
      };
      const expectedError = 'knex: Unsupported config item: unsupportedItem';
      expect(throwingFunction).to.throw(expectedError);
    });

    it('throws if an unsupported pool is added', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);
      const connectionConfig = getConnectionConfig();
      connectionConfig.client = 'unsupportedClient';
      const throwingFunction = () => {
        cluster.add('MASTER', connectionConfig);
      };
      const expectedError =
        'knex: Clustering for unsupportedClient is not yet supported';
      expect(throwingFunction).to.throw(expectedError);
    });

    it('throws if a duplicate pool is added', () => {
      const clusterConfig = getClusterConfig();
      const connectionConfig = getConnectionConfig();
      const cluster = new KnexCluster(clusterConfig);
      cluster.add('MASTER', connectionConfig);
      const throwingFunction = () => {
        cluster.add('MASTER', connectionConfig);
      };
      const expectedError =
        'knex: Pool MASTER is already defined in knexCluster';
      expect(throwingFunction).to.throw(expectedError);
    });

    it('throws when trying to remove a non-existant pool', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);
      const throwingFunction = () => {
        cluster.remove('MASTER');
      };
      const expectedError = 'knex: Pool MASTER not found in cluster';
      expect(throwingFunction).to.throw(expectedError);
    });

    it('throws when a pool isnt found', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);
      const throwingFunction = () => {
        cluster.getKnex('MASTER');
      };
      const expectedError = 'knex: no valid pools found';
      expect(throwingFunction).to.throw(expectedError);
    });

    it('throws when an unknown selector is provided', () => {
      const clusterConfig = getClusterConfig();
      const cluster = new KnexCluster(clusterConfig);

      const connectionConfig = getConnectionConfig();
      cluster.add('MASTER', connectionConfig);

      const throwingFunction = () => {
        cluster.getKnex('MASTER', 'fakeSelector');
      };
      const expectedError = 'knex: Unknown selector option fakeSelector';
      expect(throwingFunction).to.throw(expectedError);
    });
  });
});

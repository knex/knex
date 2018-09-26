const Knex = require('../../lib/index');
const { expect } = require('chai');
const Promise = require('bluebird');
const sqliteConfig = require('../knexfile').sqlite3;

describe('knex', () => {
  it('throws error on unsupported config client value', () => {
    expect(() => {
      Knex({
        client: 'dummy',
      });
    }).to.throw(
      /Unknown configuration option 'client' value dummy. Note that it is case-sensitive, check documentation for supported values/
    );
  });

  it('accepts supported config client value', () => {
    expect(() => {
      Knex({
        client: 'mysql',
      });
    }).not.to.throw();
  });

  it('accepts supported config client value alias', () => {
    expect(() => {
      Knex({
        client: 'sqlite',
      });
    }).not.to.throw();
  });

  it('supports creating copy with userParams', () => {
    const knex = Knex({
      client: 'sqlite',
    });

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    expect(knexWithParams).to.be.a('function');
    expect(knexWithParams.userParams).to.deep.equal({ userParam: '451' });
    expect(knexWithParams.client.config.client).to.equal('sqlite');
    expect(knexWithParams.migrate).to.be.a('object');
  });

  it('supports passing user params in config', () => {
    const knexWithParams = Knex({
      client: 'sqlite',
      userParams: {
        userParam: '451',
      },
    });

    expect(knexWithParams).to.be.a('function');
    expect(knexWithParams.userParams).to.deep.equal({ userParam: '451' });
    expect(knexWithParams.client.config.client).to.equal('sqlite');
    expect(knexWithParams.migrate).to.be.a('object');
  });

  it('migrator of a copy with userParams has reference to correct Knex', () => {
    const knex = Knex({
      client: 'sqlite',
    });

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    expect(knexWithParams.migrate.knex.userParams).to.deep.equal({
      userParam: '451',
    });
  });

  it('transaction of a copy with userParams retains userparams', (done) => {
    const knex = Knex(sqliteConfig);

    const knexWithParams = knex.withUserParams({ userParam: '451' });

    knexWithParams.transaction((trx) => {
      expect(trx.userParams).to.deep.equal({
        userParam: '451',
      });
      done();
      return Promise.resolve();
    });
  });

  it('creating transaction copy with user params should throw an error', (done) => {
    const knex = Knex(sqliteConfig);

    knex.transaction((trx) => {
      expect(() => {
        trx.withUserParams({ userParam: '451' });
      }).to.throw(
        /Cannot set user params on a transaction - it can only inherit params from main knex instance/
      );
      done();
      return Promise.resolve();
    });
  });
});

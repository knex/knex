'use strict';
const _ = require('lodash');
const expect = require('chai').expect;
const sinon = require('sinon');

const knex = require('../../../knex');
const config = require('../../knexfile');

describe('Oracle', () => {
  describe('Compiler', () => {
    const knexInstance = knex({
      client: 'oracledb',
      connection: {
        user: 'user',
        password: 'password',
        connectString: 'connect-string',
        externalAuth: true,
        host: 'host',
        database: 'database',
      },
    });

    it('correctly builds single value insert', async () => {
      const qb = knexInstance.client.queryBuilder();
      qb.insert({ value: 1 }).into('fakeTable');
      const compiler = knexInstance.client.queryCompiler(qb);
      const sql = compiler.insert();
      expect(sql).to.eql({
        sql: 'insert into "fakeTable" ("value") values (?)',
        outBinding: [[]],
        returning: [],
      });
    });

    it('correctly builds default values only insert', async () => {
      const qb = knexInstance.client.queryBuilder();
      qb.insert({}).into('fakeTable');
      const compiler = knexInstance.client.queryCompiler(qb);
      const sql = compiler.insert();
      expect(sql).to.eql({
        sql: 'insert into "fakeTable" values (default)',
        outBinding: [[]],
        returning: [],
      });
    });

    it('correctly builds default values only insert and returning', async () => {
      const qb = knexInstance.client.queryBuilder();
      qb.insert({}).into('fakeTable').returning('id');
      const compiler = knexInstance.client.queryCompiler(qb);
      const sql = compiler.insert();
      expect(sql).to.eql({
        sql:
          'insert into "fakeTable" ("id") values (default) returning "id" into ?',
        outBinding: [['id']],
        returning: ['id'],
      });
    });
  });

  describe('OracleDb externalAuth', function () {
    const knexInstance = knex({
      client: 'oracledb',
      connection: {
        user: 'user',
        password: 'password',
        connectString: 'connect-string',
        externalAuth: true,
        host: 'host',
        database: 'database',
      },
    });
    let spy;

    before(function () {
      spy = sinon.spy(knexInstance.client.driver, 'getConnection');
    });

    it('externalAuth and connectString should be sent to the getConnection', function () {
      const connectionWithExternalAuth = {
        connectString: 'connect-string',
        externalAuth: true,
      };
      knexInstance.client.acquireRawConnection().then(
        function (resolve) {},
        function (reject) {}
      );
      expect(spy).to.have.callCount(1);
      expect(spy).to.have.been.calledWith(connectionWithExternalAuth);
    });

    after(function () {
      knexInstance.client.driver.getConnection.restore();
    });
  });

  describe('OracleDb parameters', function () {
    describe('with fetchAsString parameter ', function () {
      let knexClient;

      before(function () {
        const conf = _.clone(config.oracledb);
        conf.fetchAsString = ['number', 'DATE', 'cLOb', 'BUFFER'];
        knexClient = knex(conf);
        return knexClient;
      });

      it('on float', function () {
        return knexClient
          .raw('select 7.329 as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.be.a('string');
          });
      });

      it('on date', function () {
        return knexClient
          .raw('select CURRENT_DATE as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.be.a('string');
          });
      });

      it('on clob', function () {
        return knexClient
          .raw('select TO_CLOB(\'LONG CONTENT\') as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.be.equal('LONG CONTENT');
          });
      });

      it('on raw', function () {
        return knexClient
          .raw('select UTL_RAW.CAST_TO_RAW(3) as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.be.equal('33');
          });
      });

      after(function () {
        return knexClient.destroy();
      });
    });

    describe('without fetchAsString parameter', function () {
      let knexClient;

      before(function () {
        knexClient = knex(config.oracledb);
        return knexClient;
      });

      it('on float', function () {
        return knexClient
          .raw('select 7.329 as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.not.be.a('string');
          });
      });

      it('on date', function () {
        return knexClient
          .raw('select CURRENT_DATE as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.not.be.a('string');
          });
      });

      it('on blob', async () => {
        const result = await knexClient.raw(
          'select TO_BLOB(\'67c1a1acaaca11a1b36fa6636166709b\') as "field" from dual'
        );
        expect(result[0]).to.be.ok;
        expect(result[0].field.toString('hex')).to.be.equal(
          '67c1a1acaaca11a1b36fa6636166709b'
        );
      });

      it('on raw', function () {
        return knexClient
          .raw('select UTL_RAW.CAST_TO_RAW(3) as "field" from dual')
          .then(function (result) {
            expect(result[0]).to.be.ok;
            expect(result[0].field).to.be.instanceOf(Buffer);
          });
      });

      after(function () {
        return knexClient.destroy();
      });
    });
  });

  describe('OracleDb unit tests', function () {
    let knexClient;

    before(function () {
      const conf = _.clone(config.oracledb);
      conf.fetchAsString = ['number', 'DATE', 'cLOb', 'BUFFER'];
      knexClient = knex(conf);
      return knexClient;
    });

    it('disposes the connection on connection error', async function () {
      let spy = sinon.spy();
      // call the real acquireConnection but release the connection immediately to cause connection error
      const acquireConnection = knexClient.client.acquireConnection;
      sinon.stub(knexClient.client, 'acquireConnection').callsFake(async () => {
        const conn = await acquireConnection.call(knexClient.client);
        conn.release();
        spy = sinon.spy(conn, 'close');
        return conn;
      });

      let exception;
      try {
        await knexClient.raw('insert into DUAL values(1)');
      } catch (e) {
        exception = e;
      }

      expect(exception).not.to.equal(undefined);
      expect(exception.message).to.include('NJS-003: invalid connection');
      expect(spy.callCount).to.equal(1);
    });

    it('clears the connection from the pool on disconnect during commit', async function () {
      const err = 'error message';
      const spy = sinon.spy(knexClient.client, 'releaseConnection');
      // call the real acquireConnection but ensure commitAsync fails simulating a disconnect
      const acquireConnection = knexClient.client.acquireConnection;
      sinon.stub(knexClient.client, 'acquireConnection').callsFake(async () => {
        const conn = await acquireConnection.call(knexClient.client);
        conn.commitAsync = () => Promise.reject(err);
        return conn;
      });

      let exception;
      try {
        await knexClient.transaction(async (trx) => {
          await trx('DUAL').select('*');
        });
      } catch (e) {
        exception = e;
      }

      expect(spy.callCount).to.equal(1);
      expect(exception).to.equal(err);
    });

    afterEach(function () {
      knexClient.client.acquireConnection.restore();
    });

    after(function () {
      return knexClient.destroy();
    });
  });
});

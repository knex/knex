// global it, describe, expect

'use strict';
const _ = require('lodash');
const expect = require('chai').expect;
const knex = require('../../../knex');
const config = require('../../knexfile');
const sinon = require('sinon');
const oracledb = require('oracledb');

describe('OracleDb externalAuth', function() {
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

  before(function() {
    spy = sinon.spy(knexInstance.client.driver, 'getConnection');
  });

  it('externalAuth and connectString should be sent to the getConnection', function() {
    const connectionWithExternalAuth = {
      connectString: 'connect-string',
      externalAuth: true,
    };
    knexInstance.client
      .acquireRawConnection()
      .then(function(resolve) {}, function(reject) {});
    expect(spy).to.have.callCount(1);
    expect(spy).to.have.been.calledWith(connectionWithExternalAuth);
  });

  after(function() {
    knexInstance.client.driver.getConnection.restore();
  });
});

describe('OracleDb parameters', function() {
  describe('with fetchAsString parameter ', function() {
    let knexClient;

    before(function() {
      const conf = _.clone(config.oracledb);
      conf.fetchAsString = ['number', 'DATE', 'cLOb'];
      knexClient = knex(conf);
      return knexClient;
    });

    it('on float', function() {
      return knexClient
        .raw('select 7.329 as "field" from dual')
        .then(function(result) {
          expect(result[0]).to.be.ok;
          expect(result[0].field).to.be.a('string');
        });
    });

    it('on date', function() {
      return knexClient
        .raw('select CURRENT_DATE as "field" from dual')
        .then(function(result) {
          expect(result[0]).to.be.ok;
          expect(result[0].field).to.be.a('string');
        });
    });

    after(function() {
      return knexClient.destroy();
    });
  });

  describe('without fetchAsString parameter', function() {
    let knexClient;

    before(function() {
      knexClient = knex(config.oracledb);
      return knexClient;
    });

    it('on float', function() {
      return knexClient
        .raw('select 7.329 as "field" from dual')
        .then(function(result) {
          expect(result[0]).to.be.ok;
          expect(result[0].field).to.not.be.a('string');
        });
    });

    it('on date', function() {
      return knexClient
        .raw('select CURRENT_DATE as "field" from dual')
        .then(function(result) {
          expect(result[0]).to.be.ok;
          expect(result[0].field).to.not.be.a('string');
        });
    });

    after(function() {
      return knexClient.destroy();
    });
  });
  describe('test stored procedures', function() {
    let knexClient;

    before(function() {
      knexClient = knex(config.oracledb);
      return knexClient;
    });

    it('create stored procedure', function() {
      return knexClient
        .raw(
          `
          CREATE OR REPLACE PROCEDURE SYSTEM.multiply (X IN NUMBER, Y IN NUMBER, OUTPUT OUT NUMBER)
          IS
            BEGIN
              OUTPUT := X * Y;
            END;`
        )
        .then(function(result) {
          expect(result).to.be.an('array');
        });
    });

    it('get outbound values from stored procedure', function() {
      const bindVars = {
        x: 6,
        y: 7,
        output: {
          dir: oracledb.BIND_OUT,
        },
      };
      return knexClient
        .raw('BEGIN SYSTEM.MULTIPLY(:x, :y, :output); END;', bindVars)
        .then(function(result) {
          expect(result[0]).to.be.ok;
          expect(result[0]).to.equal('42');
        });
    });

    it('drop stored procedure', function() {
      const bindVars = { x: 6, y: 7 };
      return knexClient
        .raw('drop procedure SYSTEM.MULTIPLY', bindVars)
        .then(function(result) {
          expect(result).to.be.ok;
          expect(result).to.be.an('array');
        });
    });

    after(function() {
      return knexClient.destroy();
    });
  });
});
